
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/communication/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                status: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = conversation.participants.find(p => p.userId === userId);
        const lastReadAt = participant?.lastReadAt || new Date(0);

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            createdAt: {
              gt: lastReadAt
            },
            senderId: {
              not: userId
            }
          }
        });

        return {
          id: conversation.id,
          title: conversation.title,
          type: conversation.type,
          isGroup: conversation.isGroup,
          lastMessage: conversation.messages[0] ? {
            id: conversation.messages[0].id,
            content: conversation.messages[0].content,
            senderId: conversation.messages[0].senderId,
            senderName: conversation.messages[0].sender.name || 'Unknown',
            createdAt: conversation.messages[0].createdAt.toISOString(),
            type: conversation.messages[0].type
          } : undefined,
          participants: conversation.participants.map(p => ({
            id: p.id,
            user: {
              id: p.user.id,
              name: p.user.name || 'Unknown',
              email: p.user.email,
              avatar: p.user.avatar,
              status: p.user.status
            },
            role: p.role
          })),
          unreadCount,
          lastMessageAt: conversation.lastMessageAt?.toISOString(),
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString()
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithUnread,
      total: conversationsWithUnread.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/communication/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type = 'DIRECT', participantIds, createdBy } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'Participant IDs are required' }, { status: 400 });
    }

    if (!createdBy) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    // Validate participants exist
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [...participantIds, createdBy]
        }
      }
    });

    if (users.length !== participantIds.length + 1) {
      return NextResponse.json({ error: 'Some users not found' }, { status: 400 });
    }

    // For direct conversations, check if one already exists
    if (type === 'DIRECT' && participantIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [createdBy, participantIds[0]]
              }
            }
          }
        },
        include: {
          participants: true
        }
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return NextResponse.json({
          conversation: {
            id: existingConversation.id,
            title: existingConversation.title,
            type: existingConversation.type,
            isGroup: existingConversation.isGroup,
            createdAt: existingConversation.createdAt.toISOString(),
            updatedAt: existingConversation.updatedAt.toISOString()
          },
          isExisting: true
        });
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        title,
        type,
        isGroup: type !== 'DIRECT',
        participants: {
          create: [
            {
              userId: createdBy,
              role: 'ADMIN'
            },
            ...participantIds.map((userId: string) => ({
              userId,
              role: type === 'DIRECT' ? 'MEMBER' : 'MEMBER'
            }))
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                status: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        type: conversation.type,
        isGroup: conversation.isGroup,
        participants: conversation.participants.map(p => ({
          id: p.id,
          user: p.user,
          role: p.role
        })),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      },
      isExisting: false
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
