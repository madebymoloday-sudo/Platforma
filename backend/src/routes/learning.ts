import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    
    const content = await prisma.learningContent.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { order: 'asc' }
    });

    res.json(content);
  } catch (error) {
    console.error('Error fetching learning content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const content = await prisma.learningContent.findUnique({
      where: { id: req.params.id },
      include: {
        category: true
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать материал
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, content, images = [], audioUrl, videoUrl, categoryId, order } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const learningContent = await prisma.learningContent.create({
      data: {
        title,
        description,
        type,
        content: content || '',
        images,
        audioUrl,
        videoUrl,
        categoryId: categoryId || null,
        order: order || 0
      },
      include: {
        category: true
      }
    });

    res.json(learningContent);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить материал
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, content, images, audioUrl, videoUrl, categoryId, order } = req.body;

    const learningContent = await prisma.learningContent.update({
      where: { id: req.params.id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        type: type ?? undefined,
        content: content ?? undefined,
        images: images ?? undefined,
        audioUrl: audioUrl ?? undefined,
        videoUrl: videoUrl ?? undefined,
        categoryId: categoryId ?? undefined,
        order: order ?? undefined
      },
      include: {
        category: true
      }
    });

    res.json(learningContent);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить материал
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.learningContent.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Content deleted' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const { progress, completed } = req.body;
    const userId = req.userId!;

    const learningProgress = await prisma.learningProgress.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId: req.params.id
        }
      },
      update: {
        progress: progress ?? undefined,
        completed: completed ?? undefined
      },
      create: {
        userId,
        contentId: req.params.id,
        progress: progress ?? 0,
        completed: completed ?? false
      }
    });

    res.json(learningProgress);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/progress/all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const progress = await prisma.learningProgress.findMany({
      where: { userId },
      include: {
        content: true
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
