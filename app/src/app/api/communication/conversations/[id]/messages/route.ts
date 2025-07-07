import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).default('TEXT'),
  parentMessageId: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string(),
    fileSize: z.number()
  })).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    // Check if user is participant
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where = {
      conversationId,
      ...(before && {
        createdAt: {
          lt: new Date(before)
        }
      })
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          parentMessage: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          replies: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 3
          },
          _count: {
            select: {
              replies: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.message.count({ where })
    ]);

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== session.user.id)
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(messageId => ({
          messageId,
          userId: session.user.id
        })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Check if user is participant
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id
      }
    });

    if (!participation) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create message with attachments
    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        type: validatedData.type,
        conversationId,
        senderId: session.user.id,
        parentMessageId: validatedData.parentMessageId,
        attachments: validatedData.attachments ? {
          create: validatedData.attachments
        } : undefined
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        attachments: true,
        parentMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Update conversation's last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}