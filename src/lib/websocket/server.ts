import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { db } from '@/lib/db';

export interface CollaborationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  currentPage?: string;
  permissions: string[];
}

export interface PresenceInfo {
  userId: string;
  user: CollaborationUser;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
  selection?: {
    start: number;
    end: number;
    elementId: string;
  };
  isTyping: boolean;
  currentDocument?: string;
  lastActivity: Date;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId: string;
  roomId?: string;
}

export interface CollaborationRoom {
  id: string;
  type: 'document' | 'risk' | 'control' | 'project' | 'general';
  entityId: string;
  participants: Map<string, PresenceInfo>;
  createdAt: Date;
  lastActivity: Date;
}

export class CollaborationServer {
  private wss: WebSocketServer;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private userSockets: Map<string, WebSocket[]> = new Map();
  private socketUsers: Map<WebSocket, CollaborationUser> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/collaboration/ws',
      verifyClient: this.verifyClient.bind(this),
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private async verifyClient(info: {
    origin: string;
    secure: boolean;
    req: IncomingMessage;
  }): Promise<boolean> {
    try {
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string;

      if (!token) {
        return false;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      // Get user from database
      const user = await db.client.user.findUnique({
        where: { id: decoded.userId, isActive: true },
        include: {
          organization: true,
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return false;
      }

      // Store user info for connection
      (info.req as any).user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationId: user.organizationId,
        avatar: user.avatar,
        isOnline: true,
        lastSeen: new Date(),
        permissions: user.userRoles.flatMap((ur) => ur.role.permissions.map((p) => p.name)),
      };

      return true;
    } catch (error) {
      console.error('WebSocket verification failed:', error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const user = (req as any).user as CollaborationUser;

      if (!user) {
        ws.close(1008, 'Authentication failed');
        return;
      }

      console.log(`User ${user.email} connected to collaboration server`);

      // Store user-socket mapping
      this.socketUsers.set(ws, user);
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, []);
      }
      this.userSockets.get(user.id)!.push(ws);

      // Set user as online
      this.updateUserPresence(user.id, { isOnline: true, lastSeen: new Date() });

      // Send initial presence data
      this.sendToUser(user.id, {
        type: 'presence:connected',
        payload: { user },
        timestamp: new Date(),
        userId: user.id,
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          message.userId = user.id;
          message.timestamp = new Date();

          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          this.sendToSocket(ws, {
            type: 'error',
            payload: { message: 'Invalid message format' },
            timestamp: new Date(),
            userId: user.id,
          });
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws, user);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws, user);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    const user = this.socketUsers.get(ws);
    if (!user) return;

    switch (message.type) {
      case 'room:join':
        this.handleJoinRoom(user, message.payload);
        break;

      case 'room:leave':
        this.handleLeaveRoom(user, message.payload);
        break;

      case 'presence:update':
        this.handlePresenceUpdate(user, message.payload);
        break;

      case 'cursor:move':
        this.handleCursorMove(user, message.payload);
        break;

      case 'selection:change':
        this.handleSelectionChange(user, message.payload);
        break;

      case 'typing:start':
      case 'typing:stop':
        this.handleTypingStatus(user, message);
        break;

      case 'comment:create':
        this.handleCreateComment(user, message.payload);
        break;

      case 'comment:update':
        this.handleUpdateComment(user, message.payload);
        break;

      case 'comment:delete':
        this.handleDeleteComment(user, message.payload);
        break;

      case 'document:edit':
        this.handleDocumentEdit(user, message.payload);
        break;

      case 'task:update':
        this.handleTaskUpdate(user, message.payload);
        break;

      case 'notification:send':
        this.handleSendNotification(user, message.payload);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleJoinRoom(
    user: CollaborationUser,
    payload: { roomId: string; entityType: string; entityId: string }
  ): void {
    const { roomId, entityType, entityId } = payload;

    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        type: entityType as any,
        entityId,
        participants: new Map(),
        createdAt: new Date(),
        lastActivity: new Date(),
      });
    }

    const room = this.rooms.get(roomId)!;

    // Add user to room
    room.participants.set(user.id, {
      userId: user.id,
      user,
      isTyping: false,
      lastActivity: new Date(),
    });

    room.lastActivity = new Date();

    // Notify other participants
    this.broadcastToRoom(
      roomId,
      {
        type: 'room:user_joined',
        payload: { user, roomId },
        timestamp: new Date(),
        userId: user.id,
      },
      user.id
    );

    // Send current room state to user
    this.sendToUser(user.id, {
      type: 'room:joined',
      payload: {
        roomId,
        participants: Array.from(room.participants.values()),
      },
      timestamp: new Date(),
      userId: user.id,
    });

    console.log(`User ${user.email} joined room ${roomId}`);
  }

  private handleLeaveRoom(user: CollaborationUser, payload: { roomId: string }): void {
    const { roomId } = payload;
    const room = this.rooms.get(roomId);

    if (!room) return;

    // Remove user from room
    room.participants.delete(user.id);

    // Notify other participants
    this.broadcastToRoom(
      roomId,
      {
        type: 'room:user_left',
        payload: { user, roomId },
        timestamp: new Date(),
        userId: user.id,
      },
      user.id
    );

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }

    console.log(`User ${user.email} left room ${roomId}`);
  }

  private handlePresenceUpdate(
    user: CollaborationUser,
    payload: { currentPage?: string; status?: string }
  ): void {
    this.updateUserPresence(user.id, {
      currentPage: payload.currentPage,
      lastSeen: new Date(),
    });

    // Broadcast presence update to all rooms user is in
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(user.id)) {
        this.broadcastToRoom(
          roomId,
          {
            type: 'presence:updated',
            payload: { userId: user.id, ...payload },
            timestamp: new Date(),
            userId: user.id,
          },
          user.id
        );
      }
    }
  }

  private handleCursorMove(
    user: CollaborationUser,
    payload: { roomId: string; cursor: { x: number; y: number; elementId?: string } }
  ): void {
    const { roomId, cursor } = payload;
    const room = this.rooms.get(roomId);

    if (!room || !room.participants.has(user.id)) return;

    // Update user's cursor position
    const participant = room.participants.get(user.id)!;
    participant.cursor = cursor;
    participant.lastActivity = new Date();

    // Broadcast cursor position to other participants
    this.broadcastToRoom(
      roomId,
      {
        type: 'cursor:moved',
        payload: { userId: user.id, cursor },
        timestamp: new Date(),
        userId: user.id,
      },
      user.id
    );
  }

  private handleSelectionChange(
    user: CollaborationUser,
    payload: { roomId: string; selection: { start: number; end: number; elementId: string } }
  ): void {
    const { roomId, selection } = payload;
    const room = this.rooms.get(roomId);

    if (!room || !room.participants.has(user.id)) return;

    // Update user's selection
    const participant = room.participants.get(user.id)!;
    participant.selection = selection;
    participant.lastActivity = new Date();

    // Broadcast selection to other participants
    this.broadcastToRoom(
      roomId,
      {
        type: 'selection:changed',
        payload: { userId: user.id, selection },
        timestamp: new Date(),
        userId: user.id,
      },
      user.id
    );
  }

  private handleTypingStatus(user: CollaborationUser, message: WebSocketMessage): void {
    const { roomId } = message.payload;
    const room = this.rooms.get(roomId);

    if (!room || !room.participants.has(user.id)) return;

    const isTyping = message.type === 'typing:start';
    const participant = room.participants.get(user.id)!;
    participant.isTyping = isTyping;
    participant.lastActivity = new Date();

    // Broadcast typing status
    this.broadcastToRoom(
      roomId,
      {
        type: 'typing:status',
        payload: { userId: user.id, isTyping },
        timestamp: new Date(),
        userId: user.id,
      },
      user.id
    );
  }

  private async handleCreateComment(user: CollaborationUser, payload: any): Promise<void> {
    try {
      // Create comment in database
      const comment = await db.client.comment.create({
        data: {
          content: payload.content,
          entityType: payload.entityType,
          entityId: payload.entityId,
          parentId: payload.parentId,
          authorId: user.id,
          organizationId: user.organizationId,
          mentions: payload.mentions || [],
          isResolved: false,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          replies: {
            include: {
              author: {
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

      // Broadcast to relevant rooms
      const roomId = `${payload.entityType}:${payload.entityId}`;
      this.broadcastToRoom(roomId, {
        type: 'comment:created',
        payload: { comment },
        timestamp: new Date(),
        userId: user.id,
      });

      // Handle mentions
      if (payload.mentions && payload.mentions.length > 0) {
        await this.handleMentions(user, comment, payload.mentions);
      }

      // Log activity
      await db.client.activity.create({
        data: {
          type: 'COMMENTED',
          entityType: payload.entityType.toUpperCase(),
          entityId: payload.entityId,
          description: `${user.firstName} ${user.lastName} added a comment`,
          userId: user.id,
          organizationId: user.organizationId,
          metadata: {
            commentId: comment.id,
            content: payload.content.substring(0, 100),
            mentions: payload.mentions,
          },
          isPublic: true,
        },
      });
    } catch (error) {
      console.error('Failed to create comment:', error);
      this.sendToUser(user.id, {
        type: 'error',
        payload: { message: 'Failed to create comment' },
        timestamp: new Date(),
        userId: user.id,
      });
    }
  }

  private async handleUpdateComment(user: CollaborationUser, payload: any): Promise<void> {
    try {
      const comment = await db.client.comment.update({
        where: {
          id: payload.commentId,
          authorId: user.id, // Ensure user can only update their own comments
        },
        data: {
          content: payload.content,
          mentions: payload.mentions || [],
          updatedAt: new Date(),
        },
        include: {
          author: {
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

      // Broadcast update
      const roomId = `${comment.entityType}:${comment.entityId}`;
      this.broadcastToRoom(roomId, {
        type: 'comment:updated',
        payload: { comment },
        timestamp: new Date(),
        userId: user.id,
      });
    } catch (error) {
      console.error('Failed to update comment:', error);
      this.sendToUser(user.id, {
        type: 'error',
        payload: { message: 'Failed to update comment' },
        timestamp: new Date(),
        userId: user.id,
      });
    }
  }

  private async handleDeleteComment(user: CollaborationUser, payload: any): Promise<void> {
    try {
      const comment = await db.client.comment.findUnique({
        where: { id: payload.commentId },
      });

      if (!comment || comment.authorId !== user.id) {
        throw new Error('Comment not found or insufficient permissions');
      }

      await db.client.comment.delete({
        where: { id: payload.commentId },
      });

      // Broadcast deletion
      const roomId = `${comment.entityType}:${comment.entityId}`;
      this.broadcastToRoom(roomId, {
        type: 'comment:deleted',
        payload: { commentId: payload.commentId },
        timestamp: new Date(),
        userId: user.id,
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      this.sendToUser(user.id, {
        type: 'error',
        payload: { message: 'Failed to delete comment' },
        timestamp: new Date(),
        userId: user.id,
      });
    }
  }

  private handleDocumentEdit(user: CollaborationUser, payload: any): void {
    const { roomId, operation } = payload;

    // Broadcast edit operation to other participants
    this.broadcastToRoom(
      roomId,
      {
        type: 'document:edited',
        payload: { userId: user.id, operation },
        timestamp: new Date(),
        userId: user.id,
      },
      user.id
    );
  }

  private async handleTaskUpdate(user: CollaborationUser, payload: any): Promise<void> {
    try {
      const task = await db.client.task.update({
        where: { id: payload.taskId },
        data: payload.updates,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
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

      // Broadcast task update
      const roomId = `task:${task.id}`;
      this.broadcastToRoom(roomId, {
        type: 'task:updated',
        payload: { task },
        timestamp: new Date(),
        userId: user.id,
      });

      // Notify assignee if changed
      if (payload.updates.assigneeId && payload.updates.assigneeId !== user.id) {
        await this.createNotification({
          type: 'TASK_ASSIGNED',
          recipientId: payload.updates.assigneeId,
          senderId: user.id,
          entityType: 'TASK',
          entityId: task.id,
          title: 'Task Assigned',
          message: `${user.firstName} ${user.lastName} assigned you a task: ${task.title}`,
        });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }

  private async handleSendNotification(user: CollaborationUser, payload: any): Promise<void> {
    await this.createNotification({
      type: payload.type,
      recipientId: payload.recipientId,
      senderId: user.id,
      entityType: payload.entityType,
      entityId: payload.entityId,
      title: payload.title,
      message: payload.message,
    });
  }

  private async handleMentions(
    user: CollaborationUser,
    comment: any,
    mentions: string[]
  ): Promise<void> {
    for (const mentionedUserId of mentions) {
      await this.createNotification({
        type: 'MENTION',
        recipientId: mentionedUserId,
        senderId: user.id,
        entityType: 'COMMENT',
        entityId: comment.id,
        title: 'You were mentioned',
        message: `${user.firstName} ${user.lastName} mentioned you in a comment`,
      });
    }
  }

  private handleDisconnection(ws: WebSocket, user: CollaborationUser): void {
    console.log(`User ${user.email} disconnected from collaboration server`);

    // Remove from socket mappings
    this.socketUsers.delete(ws);
    const userSockets = this.userSockets.get(user.id) || [];
    const socketIndex = userSockets.indexOf(ws);
    if (socketIndex > -1) {
      userSockets.splice(socketIndex, 1);
    }

    // If no more sockets for this user, mark as offline
    if (userSockets.length === 0) {
      this.updateUserPresence(user.id, { isOnline: false, lastSeen: new Date() });
      this.userSockets.delete(user.id);

      // Remove from all rooms
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.participants.has(user.id)) {
          room.participants.delete(user.id);

          // Notify other participants
          this.broadcastToRoom(roomId, {
            type: 'room:user_left',
            payload: { user, roomId },
            timestamp: new Date(),
            userId: user.id,
          });

          // Clean up empty rooms
          if (room.participants.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }
    }
  }

  private updateUserPresence(userId: string, updates: Partial<CollaborationUser>): void {
    // Update in-memory presence
    for (const room of this.rooms.values()) {
      const participant = room.participants.get(userId);
      if (participant) {
        Object.assign(participant.user, updates);
      }
    }

    // Update in database
    db.client.user
      .update({
        where: { id: userId },
        data: {
          isOnline: updates.isOnline,
          lastSeenAt: updates.lastSeen,
        },
      })
      .catch((error) => {
        console.error('Failed to update user presence:', error);
      });
  }

  public sendToUser(userId: string, message: WebSocketMessage): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socket of sockets) {
        this.sendToSocket(socket, message);
      }
    }
  }

  private sendToSocket(socket: WebSocket, message: WebSocketMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  public broadcastToRoom(roomId: string, message: WebSocketMessage, excludeUserId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [userId, participant] of room.participants.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      this.sendToUser(userId, message);
    }
  }

  private async createNotification(notification: {
    type: string;
    recipientId: string;
    senderId: string;
    entityType: string;
    entityId: string;
    title: string;
    message: string;
  }): Promise<void> {
    try {
      const dbNotification = await db.client.notification.create({
        data: notification,
        include: {
          sender: {
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

      // Send real-time notification
      this.sendToUser(notification.recipientId, {
        type: 'notification:received',
        payload: { notification: dbNotification },
        timestamp: new Date(),
        userId: notification.senderId,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      // Send heartbeat to all connected clients
      for (const [socket, user] of this.socketUsers.entries()) {
        this.sendToSocket(socket, {
          type: 'heartbeat',
          payload: { timestamp: new Date() },
          timestamp: new Date(),
          userId: user.id,
        });
      }

      // Clean up inactive rooms
      const now = new Date();
      for (const [roomId, room] of this.rooms.entries()) {
        const timeSinceActivity = now.getTime() - room.lastActivity.getTime();
        if (timeSinceActivity > 30 * 60 * 1000) {
          // 30 minutes
          this.rooms.delete(roomId);
        }
      }
    }, 30000); // 30 seconds
  }

  public getRoomInfo(roomId: string): CollaborationRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getOnlineUsers(): CollaborationUser[] {
    const users: CollaborationUser[] = [];
    for (const user of this.socketUsers.values()) {
      if (!users.find((u) => u.id === user.id)) {
        users.push(user);
      }
    }
    return users;
  }

  public getUserPresence(userId: string): PresenceInfo | undefined {
    for (const room of this.rooms.values()) {
      const participant = room.participants.get(userId);
      if (participant) {
        return participant;
      }
    }
    return undefined;
  }
}

export let collaborationServer: CollaborationServer;

export function initializeCollaborationServer(server: any): void {
  collaborationServer = new CollaborationServer(server);
}
