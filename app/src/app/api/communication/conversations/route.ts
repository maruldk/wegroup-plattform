import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createConversationSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['DIRECT', 'GROUP', 'CHANNEL']),
  participantIds: z.array(z.string()).min(1),
  description: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    const where = {
      participants: {
        some: {
          userId: session.user.id
        }
      },
      ...(type && { type })
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  readBy: {
                    none: {
                      userId: session.user.id
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.conversation.count({ where })
    ]);

    const formattedConversations = conversations.map(conv => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createConversationSchema.parse(body);

    // Check if direct conversation already exists
    if (validatedData.type === 'DIRECT' && validatedData.participantIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [session.user.id, validatedData.participantIds[0]]
              }
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
                  image: true
                }
              }
            }
          }
        }
      });

      if (existingConversation) {
        return NextResponse.json(existingConversation);
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: validatedData.title,
        type: validatedData.type,
        description: validatedData.description,
        participants: {
          create: [
            {
              userId: session.user.id,
              role: 'ADMIN'
            },
            ...validatedData.participantIds.map(userId => ({
              userId,
              role: 'MEMBER' as const
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
                image: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}