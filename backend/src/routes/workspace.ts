import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { type } = req.query;

    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const items = await prisma.workspaceItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching workspace items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { type, title, content } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }

    const item = await prisma.workspaceItem.create({
      data: {
        userId,
        type,
        title,
        content: content || '{}'
      }
    });

    res.json(item);
  } catch (error) {
    console.error('Error creating workspace item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, content } = req.body;

    const item = await prisma.workspaceItem.findUnique({
      where: { id: req.params.id }
    });

    if (!item || item.userId !== userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updated = await prisma.workspaceItem.update({
      where: { id: req.params.id },
      data: {
        title: title ?? undefined,
        content: content ?? undefined
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating workspace item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const item = await prisma.workspaceItem.findUnique({
      where: { id: req.params.id }
    });

    if (!item || item.userId !== userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.workspaceItem.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting workspace item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
