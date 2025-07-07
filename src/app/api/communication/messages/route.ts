
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/communication/messages - Update a message (edit)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content, userId } = body;

    if (!messageId || !content || !userId) {
      return NextResponse.json({ error: 'Message ID, content, and user ID are required' }, { status: 400 });
    }

    // Verify user owns the message
    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        isDeleted: false
      }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date()
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
        reactions: true
      }
    });

    const formattedMessage = {
      id: updatedMessage.id,
      content: updatedMessage.content,
      type: updatedMessage.type,
      conversationId: updatedMessage.conversationId,
      senderId: updatedMessage.senderId,
      isEdited: updatedMessage.isEdited,
      createdAt: updatedMessage.createdAt.toISOString(),
      updatedAt: updatedMessage.updatedAt.toISOString(),
      sender: {
        id: updatedMessage.sender.id,
        name: updatedMessage.sender.name || 'Unknown',
        email: updatedMessage.sender.email,
        avatar: updatedMessage.sender.avatar
      },
      attachments: updatedMessage.attachments,
      reactions: updatedMessage.reactions
    };

    return NextResponse.json({ message: formattedMessage });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/communication/messages - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!messageId || !userId) {
      return NextResponse.json({ error: 'Message ID and user ID are required' }, { status: 400 });
    }

    // Verify user owns the message or is admin
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        isDeleted: false
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const userParticipant = message.conversation.participants[0];
    const canDelete = message.senderId === userId || userParticipant?.role === 'ADMIN';

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete the message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: 'This message was deleted',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

// POST /api/communication/messages/reaction - Add/remove reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId, emoji, action = 'add' } = body;

    if (!messageId || !userId || !emoji) {
      return NextResponse.json({ error: 'Message ID, user ID, and emoji are required' }, { status: 400 });
    }

    // Verify user has access to the message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId: userId
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    if (action === 'add') {
      // Add reaction (upsert to handle duplicates)
      await prisma.messageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji
          }
        },
        update: {},
        create: {
          messageId,
          userId,
          emoji
        }
      });
    } else if (action === 'remove') {
      // Remove reaction
      await prisma.messageReaction.deleteMany({
        where: {
          messageId,
          userId,
          emoji
        }
      });
    }

    // Get updated reactions
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      reactions: reactions.map(r => ({
        id: r.id,
        emoji: r.emoji,
        userId: r.userId,
        userName: r.user.name || 'Unknown'
      }))
    });

  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json(
      { error: 'Failed to handle reaction' },
      { status: 500 }
    );
  }
}
