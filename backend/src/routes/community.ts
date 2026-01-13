import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import OpenAI from 'openai';

const router = express.Router();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

router.get('/reports', async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    const where: any = { isPublic: true };
    if (userId) {
      where.userId = userId as string;
    }

    const reports = await prisma.report.findMany({
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

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/my', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reports', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, content, images = [], videos = [], isPublic = false } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const report = await prisma.report.create({
      data: {
        userId,
        title,
        content,
        images,
        videos,
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

    res.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/reports/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, content, images, videos, isPublic } = req.body;

    const report = await prisma.report.findUnique({
      where: { id: req.params.id }
    });

    if (!report || report.userId !== userId) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        title: title ?? undefined,
        content: content ?? undefined,
        images: images ?? undefined,
        videos: videos ?? undefined,
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
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/reports/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const report = await prisma.report.findUnique({
      where: { id: req.params.id }
    });

    if (!report || report.userId !== userId) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    await prisma.report.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reports/analyze/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.userId;
    const { limit = 10 } = req.query;

    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API not configured' });
    }

    const reports = await prisma.report.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    if (reports.length === 0) {
      return res.json({ summary: 'Нет отчётов для анализа' });
    }

    const reportsText = reports.map(r => 
      `Дата: ${r.createdAt.toLocaleDateString()}\n${r.content}`
    ).join('\n\n---\n\n');

    const prompt = `Проанализируй следующие отчёты пользователя и предоставь краткое резюме:
- Как у человека дела?
- Что он делает?
- Какие основные темы и достижения?

Отчёты:\n${reportsText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Ты помощник, который анализирует дневниковые записи и предоставляет краткие резюме." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    });

    const summary = completion.choices[0].message.content;

    res.json({ summary, reportsCount: reports.length });
  } catch (error) {
    console.error('Error analyzing reports:', error);
    res.status(500).json({ error: 'Error analyzing reports. Make sure OPENAI_API_KEY is set.' });
  }
});

router.get('/forms', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const forms = await prisma.reportForm.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(forms.map(form => ({
      ...form,
      fields: JSON.parse(form.fields)
    })));
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/forms', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, fields, isDefault } = req.body;

    if (!name || !fields) {
      return res.status(400).json({ error: 'Name and fields are required' });
    }

    if (isDefault) {
      await prisma.reportForm.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const form = await prisma.reportForm.create({
      data: {
        userId,
        name,
        fields: JSON.stringify(fields),
        isDefault: isDefault || false
      }
    });

    res.json({ ...form, fields: JSON.parse(form.fields) });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/forms/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, fields, isDefault } = req.body;

    const form = await prisma.reportForm.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (isDefault) {
      await prisma.reportForm.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.reportForm.update({
      where: { id: req.params.id },
      data: {
        name: name ?? undefined,
        fields: fields ? JSON.stringify(fields) : undefined,
        isDefault: isDefault ?? undefined
      }
    });

    res.json({ ...updated, fields: JSON.parse(updated.fields) });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
