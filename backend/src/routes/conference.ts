import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../../prisma/client';
import crypto from 'crypto';
import OpenAI from 'openai';

const router = express.Router();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Создать конференцию
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { chatId, title } = req.body;

    const link = crypto.randomBytes(6).toString('hex');

    const conference = await prisma.conference.create({
      data: {
        createdBy: userId,
        chatId: chatId || null,
        title: title || null,
        link,
        participants: {
          create: {
            userId,
            isMuted: false,
            isVideoOff: false
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.json(conference);
  } catch (error) {
    console.error('Error creating conference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить конференцию по ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const conference = await prisma.conference.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!conference) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    res.json(conference);
  } catch (error) {
    console.error('Error fetching conference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить конференцию по ссылке
router.get('/link/:link', async (req, res) => {
  try {
    const conference = await prisma.conference.findUnique({
      where: { link: req.params.link },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!conference) {
      return res.status(404).json({ error: 'Conference not found' });
    }

    res.json(conference);
  } catch (error) {
    console.error('Error fetching conference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Присоединиться к конференции
router.post('/:id/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const conferenceId = req.params.id;

    const participant = await prisma.conferenceParticipant.upsert({
      where: {
        conferenceId_userId: {
          conferenceId,
          userId
        }
      },
      update: {
        leftAt: null
      },
      create: {
        conferenceId,
        userId,
        isMuted: false,
        isVideoOff: false
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

    res.json(participant);
  } catch (error) {
    console.error('Error joining conference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить статус участника (микрофон, камера)
router.put('/:id/participant', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { isMuted, isVideoOff } = req.body;

    const participant = await prisma.conferenceParticipant.update({
      where: {
        conferenceId_userId: {
          conferenceId: req.params.id,
          userId
        }
      },
      data: {
        isMuted: isMuted ?? undefined,
        isVideoOff: isVideoOff ?? undefined
      }
    });

    res.json(participant);
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Покинуть конференцию
router.post('/:id/leave', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    await prisma.conferenceParticipant.update({
      where: {
        conferenceId_userId: {
          conferenceId: req.params.id,
          userId
        }
      },
      data: {
        leftAt: new Date()
      }
    });

    res.json({ message: 'Left conference' });
  } catch (error) {
    console.error('Error leaving conference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Завершить конференцию
router.post('/:id/end', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const conference = await prisma.conference.findUnique({
      where: { id: req.params.id }
    });

    if (!conference || conference.createdBy !== userId) {
      return res.status(403).json({ error: 'Only creator can end conference' });
    }

    const updated = await prisma.conference.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error ending conference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить сообщения конференции
router.get('/:id/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.conferenceMessage.findMany({
      where: { conferenceId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Отправить сообщение в конференцию
router.post('/:id/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { content, type = 'text' } = req.body;

    const message = await prisma.conferenceMessage.create({
      data: {
        conferenceId: req.params.id,
        userId,
        content,
        type
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

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить резюме конференции
router.get('/:id/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const summary = await prisma.conferenceSummary.findUnique({
      where: { conferenceId: req.params.id }
    });

    res.json(summary || {});
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать автоматическое резюме через бота
router.post('/:id/summary/auto', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API not configured' });
    }

    const messages = await prisma.conferenceMessage.findMany({
      where: {
        conferenceId: req.params.id,
        type: 'text'
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (messages.length === 0) {
      return res.json({ summary: 'Нет сообщений для анализа' });
    }

    const transcript = messages.map(m => 
      `${m.user.name}: ${m.content}`
    ).join('\n');

    const conference = await prisma.conference.findUnique({
      where: { id: req.params.id }
    });

    const prompt = `Проанализируй транскрипт видеоконференции и создай краткое резюме встречи.
Включи основные темы, решения, задачи и важные моменты.

Транскрипт:\n${transcript}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Ты помощник, который создаёт резюме видеоконференций. Создавай структурированные и полезные резюме." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000
    });

    const autoSummary = completion.choices[0].message.content;
    const date = conference?.startedAt || new Date();

    const summary = await prisma.conferenceSummary.upsert({
      where: { conferenceId: req.params.id },
      update: {
        autoSummary,
        date
      },
      create: {
        conferenceId: req.params.id,
        autoSummary,
        date
      }
    });

    res.json(summary);
  } catch (error) {
    console.error('Error creating auto summary:', error);
    res.status(500).json({ error: 'Error creating summary' });
  }
});

// Обновить ручное резюме
router.put('/:id/summary/manual', authenticate, async (req: AuthRequest, res) => {
  try {
    const { manualSummary } = req.body;

    const conference = await prisma.conference.findUnique({
      where: { id: req.params.id }
    });

    const summary = await prisma.conferenceSummary.upsert({
      where: { conferenceId: req.params.id },
      update: {
        manualSummary
      },
      create: {
        conferenceId: req.params.id,
        manualSummary,
        date: conference?.startedAt || new Date()
      }
    });

    res.json(summary);
  } catch (error) {
    console.error('Error updating manual summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
