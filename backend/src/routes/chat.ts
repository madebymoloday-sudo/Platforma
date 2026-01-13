import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

const router = express.Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const chatMembers = await prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
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
        }
      }
    });

    const chats = chatMembers.map(member => ({
      id: member.chat.id,
      name: member.chat.name,
      type: member.chat.type,
      role: member.role,
      members: member.chat.members.map(m => m.user),
      lastMessage: member.chat.messages[0] || null,
      createdAt: member.chat.createdAt
    }));

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, type = 'group', memberIds = [] } = req.body;

    // Для групп можно создать даже без других участников
    const chat = await prisma.chat.create({
      data: {
        name: type === 'group' ? (name || 'Новая группа') : null,
        type,
        members: {
          create: [
            { userId, role: 'admin' },
            ...memberIds.filter((id: string) => id !== userId).map((id: string) => ({ userId: id, role: 'member' }))
          ]
        }
      },
      include: {
        members: {
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

    res.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:chatId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const member = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
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

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:chatId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;
    const { content, type = 'text', mediaUrl } = req.body;

    const member = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        userId,
        content,
        type,
        mediaUrl
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

router.get('/stories/all', authenticate, async (req: AuthRequest, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/stories', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { content, type } = req.body;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        userId,
        content,
        type,
        expiresAt
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

    res.json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
