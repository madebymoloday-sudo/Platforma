import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../../prisma/client';

const router = express.Router();

// Получить все категории
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.learningCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать категорию
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, color, image, order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.learningCategory.create({
      data: {
        name,
        description,
        color,
        image,
        order: order || 0
      }
    });

    res.json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить категорию
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, color, image, order } = req.body;

    const category = await prisma.learningCategory.update({
      where: { id: req.params.id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        color: color ?? undefined,
        image: image ?? undefined,
        order: order ?? undefined
      }
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить категорию
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.learningCategory.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
