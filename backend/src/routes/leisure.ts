import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../../prisma/client';

const router = express.Router();

// Получить все публичные ссылки досуга
router.get('/', async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    const where: any = { isPublic: true };
    if (type) {
      where.type = type;
    }

    const leisure = await prisma.leisure.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    res.json(leisure);
  } catch (error) {
    console.error('Error fetching leisure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить мои ссылки
router.get('/my', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const leisure = await prisma.leisure.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leisure);
  } catch (error) {
    console.error('Error fetching my leisure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать ссылку
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, description, url, type = 'video', thumbnail, tags = [], isPublic = true } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const leisure = await prisma.leisure.create({
      data: {
        userId,
        title,
        description,
        url,
        type,
        thumbnail,
        tags,
        isPublic
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.json(leisure);
  } catch (error) {
    console.error('Error creating leisure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить ссылку
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, description, url, type, thumbnail, tags, isPublic } = req.body;

    const leisure = await prisma.leisure.findUnique({
      where: { id: req.params.id }
    });

    if (!leisure || leisure.userId !== userId) {
      return res.status(404).json({ error: 'Leisure not found or access denied' });
    }

    const updated = await prisma.leisure.update({
      where: { id: req.params.id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        url: url ?? undefined,
        type: type ?? undefined,
        thumbnail: thumbnail ?? undefined,
        tags: tags ?? undefined,
        isPublic: isPublic ?? undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating leisure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить ссылку
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const leisure = await prisma.leisure.findUnique({
      where: { id: req.params.id }
    });

    if (!leisure || leisure.userId !== userId) {
      return res.status(404).json({ error: 'Leisure not found or access denied' });
    }

    await prisma.leisure.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Leisure deleted' });
  } catch (error) {
    console.error('Error deleting leisure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
