import { PrismaClient, ChannelType, ChannelMemberRole, ChatMessageType } from '@prisma/client';
import { redis } from '@/lib/cache/memory-cache';

const prisma = new PrismaClient();

export interface CreateChannelInput {
  name: string;
  description?: string;
  type: ChannelType;
  organizationId: string;
  createdBy: string;
  members?: string[];
}

export interface SendMessageInput {
  channelId: string;
  userId: string;
  content: string;
  type?: ChatMessageType;
  attachments?: any[];
  parentId?: string;
}

export interface UpdateMessageInput {
  messageId: string;
  userId: string;
  content: string;
}

export interface AddReactionInput {
  messageId: string;
  userId: string;
  emoji: string;
}

export interface MarkAsReadInput {
  channelId: string;
  userId: string;
  messageId: string;
}

export class ChatService {
  // Channel Management
  async createChannel(input: CreateChannelInput) {
    const { name, description, type, organizationId, createdBy, members = [] } = input;

    // Create channel
    const channel = await prisma.chatChannel.create({
      data: {
        name,
        description,
        type,
        organizationId,
        createdBy,
        isActive: true,
        members: {
          create: [
            {
              userId: createdBy,
              role: ChannelMemberRole.OWNER,
            },
            ...members.map(userId => ({
              userId,
              role: ChannelMemberRole.MEMBER,
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Cache channel info
    await redis.setex(`channel:${channel.id}`, 3600, JSON.stringify(channel));

    return channel;
  }

  async getChannel(channelId: string, userId: string) {
    // Check cache first
    const cached = await redis.get(`channel:${channelId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Verify user has access
    const membership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Cache for 1 hour
    await redis.setex(`channel:${channelId}`, 3600, JSON.stringify(channel));

    return channel;
  }

  async getUserChannels(userId: string, organizationId: string) {
    const channels = await prisma.chatChannel.findMany({
      where: {
        organizationId,
        members: {
          some: {
            userId,
          },
        },
        isActive: true,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get unread counts
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        const unreadCount = await this.getUnreadCount(channel.id, userId);
        return {
          ...channel,
          unreadCount,
          lastMessage: channel.messages[0] || null,
        };
      })
    );

    return channelsWithUnread;
  }

  async addChannelMember(channelId: string, userId: string, addedBy: string) {
    // Verify the user adding has permissions
    const adderMembership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: addedBy,
        },
      },
    });

    if (!adderMembership || (adderMembership.role !== ChannelMemberRole.OWNER && adderMembership.role !== ChannelMemberRole.ADMIN)) {
      throw new Error('Insufficient permissions');
    }

    const member = await prisma.chatChannelMember.create({
      data: {
        channelId,
        userId,
        role: ChannelMemberRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Invalidate channel cache
    await redis.del(`channel:${channelId}`);

    return member;
  }

  async removeChannelMember(channelId: string, userId: string, removedBy: string) {
    // Verify permissions or self-removal
    if (userId !== removedBy) {
      const removerMembership = await prisma.chatChannelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId: removedBy,
          },
        },
      });

      if (!removerMembership || (removerMembership.role !== ChannelMemberRole.OWNER && removerMembership.role !== ChannelMemberRole.ADMIN)) {
        throw new Error('Insufficient permissions');
      }
    }

    await prisma.chatChannelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    // Invalidate channel cache
    await redis.del(`channel:${channelId}`);
  }

  // Message Management
  async sendMessage(input: SendMessageInput) {
    const { channelId, userId, content, type = ChatMessageType.TEXT, attachments, parentId } = input;

    // Verify user has access
    const membership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        channelId,
        userId,
        content,
        type,
        attachments: attachments ? JSON.stringify(attachments) : null,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
        parent: parentId ? {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        } : undefined,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Update channel's last activity
    await prisma.chatChannel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    // Update member's last read
    await prisma.chatChannelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    // Invalidate unread counts for other members
    const members = await prisma.chatChannelMember.findMany({
      where: { channelId },
      select: { userId: true },
    });

    for (const member of members) {
      if (member.userId !== userId) {
        await redis.del(`unread:${channelId}:${member.userId}`);
      }
    }

    return message;
  }

  async getChannelMessages(channelId: string, userId: string, limit = 50, before?: string) {
    // Verify access
    const membership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId,
        isDeleted: false,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse();
  }

  async updateMessage(input: UpdateMessageInput) {
    const { messageId, userId, content } = input;

    // Verify ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { userId: true },
    });

    if (!message || message.userId !== userId) {
      throw new Error('Access denied');
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string) {
    // Verify ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { userId: true, channelId: true },
    });

    if (!message || message.userId !== userId) {
      throw new Error('Access denied');
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }

  // Reactions
  async addReaction(input: AddReactionInput) {
    const { messageId, userId, emoji } = input;

    // Verify message exists and user has access
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { channelId: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const membership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: message.channelId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    const reaction = await prisma.chatReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await prisma.chatReaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    return { success: true };
  }

  // Read Receipts
  async markAsRead(input: MarkAsReadInput) {
    const { channelId, userId, messageId } = input;

    // Create read receipt
    await prisma.chatReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
      },
    });

    // Update member's last read
    await prisma.chatChannelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    // Clear unread cache
    await redis.del(`unread:${channelId}:${userId}`);

    return { success: true };
  }

  async getUnreadCount(channelId: string, userId: string): Promise<number> {
    // Check cache first
    const cached = await redis.get(`unread:${channelId}:${userId}`);
    if (cached !== null) {
      return parseInt(cached);
    }

    // Get member's last read time
    const membership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      select: { lastReadAt: true },
    });

    if (!membership) {
      return 0;
    }

    // Count unread messages
    const unreadCount = await prisma.chatMessage.count({
      where: {
        channelId,
        createdAt: { gt: membership.lastReadAt },
        userId: { not: userId },
        isDeleted: false,
      },
    });

    // Cache for 5 minutes
    await redis.setex(`unread:${channelId}:${userId}`, 300, unreadCount.toString());

    return unreadCount;
  }

  // Search
  async searchMessages(organizationId: string, userId: string, query: string, channelId?: string) {
    // Get user's accessible channels
    const accessibleChannels = await prisma.chatChannelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });

    const channelIds = accessibleChannels.map(m => m.channelId);

    const messages = await prisma.chatMessage.findMany({
      where: {
        channel: {
          organizationId,
          id: channelId ? channelId : { in: channelIds },
        },
        content: {
          contains: query,
          mode: 'insensitive',
        },
        isDeleted: false,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return messages;
  }

  // Direct Messages
  async getOrCreateDirectChannel(userId1: string, userId2: string, organizationId: string) {
    // Check if direct channel already exists
    const existingChannel = await prisma.chatChannel.findFirst({
      where: {
        type: ChannelType.DIRECT,
        organizationId,
        members: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (existingChannel) {
      return existingChannel;
    }

    // Create new direct channel
    const users = await prisma.user.findMany({
      where: { id: { in: [userId1, userId2] } },
      select: { firstName: true, lastName: true },
    });

    const channelName = users.map(u => `${u.firstName} ${u.lastName}`).join(' - ');

    const channel = await this.createChannel({
      name: channelName,
      type: ChannelType.DIRECT,
      organizationId,
      createdBy: userId1,
      members: [userId2],
    });

    return channel;
  }

  // Typing Indicators
  async setTypingStatus(channelId: string, userId: string, isTyping: boolean) {
    const key = `typing:${channelId}:${userId}`;
    
    if (isTyping) {
      // Set typing status with 5 second expiry
      await redis.setex(key, 5, '1');
    } else {
      await redis.del(key);
    }

    return { success: true };
  }

  async getTypingUsers(channelId: string): Promise<string[]> {
    const pattern = `typing:${channelId}:*`;
    const typingUserIds: string[] = [];
    let cursor = '0';
    
    // Use SCAN instead of KEYS for better performance
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      
      // Extract user IDs from keys
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          typingUserIds.push(parts[parts.length - 1]);
        }
      }
    } while (cursor !== '0');

    return typingUserIds;
  }
}

export default new ChatService();