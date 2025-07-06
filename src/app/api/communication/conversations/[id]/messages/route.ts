
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/communication/conversations/[id]/messages - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const before = searchParams.get('before'); // For pagination

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const conversationId = params.id;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause for pagination
    const whereClause: any = {
      conversationId,
      isDeleted: false
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
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
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Update last read timestamp for the user
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    const formattedMessages = messages.reverse().map(message => ({
      id: message.id,
      content: message.content,
      type: message.type,
      conversationId: message.conversationId,
      senderId: message.senderId,
      replyToId: message.replyToId,
      isEdited: message.isEdited,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name || 'Unknown',
        email: message.sender.email,
        avatar: message.sender.avatar
      },
      attachments: message.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize
      })),
      reactions: message.reactions.map(reaction => ({
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user.name || 'Unknown'
      })),
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        senderName: message.replyTo.sender.name || 'Unknown'
      } : undefined
    }));

    return NextResponse.json({
      messages: formattedMessages,
      hasMore: messages.length === limit,
      total: formattedMessages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/communication/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, senderId, type = 'TEXT', replyToId, attachments } = body;

    if (!content || !senderId) {
      return NextResponse.json({ error: 'Content and sender ID are required' }, { status: 400 });
    }

    const conversationId = params.id;

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: senderId
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create message with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the message
      const message = await tx.message.create({
        data: {
          content,
          type,
          conversationId,
          senderId,
          replyToId,
          attachments: attachments ? {
            create: attachments.map((att: any) => ({
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileType: att.fileType,
              fileSize: att.fileSize
            }))
          } : undefined
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          attachments: true,
          replyTo: {
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

      // Update conversation last message time
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return message;
    });

    const formattedMessage = {
      id: result.id,
      content: result.content,
      type: result.type,
      conversationId: result.conversationId,
      senderId: result.senderId,
      replyToId: result.replyToId,
      isEdited: result.isEdited,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      sender: {
        id: result.sender.id,
        name: result.sender.name || 'Unknown',
        email: result.sender.email,
        avatar: result.sender.avatar
      },
      attachments: result.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize
      })),
      replyTo: result.replyTo ? {
        id: result.replyTo.id,
        content: result.replyTo.content,
        senderName: result.replyTo.sender.name || 'Unknown'
      } : undefined
    };

    return NextResponse.json({ message: formattedMessage }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
