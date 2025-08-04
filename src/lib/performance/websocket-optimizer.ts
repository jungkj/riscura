import { memoryManager } from './memory-manager';

export interface WebSocketConfig {
  maxConnections: number;
  connectionTimeout: number;
  heartbeatInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  enableCompression: boolean;
  enableBinaryProtocol: boolean;
  messageQueueSize: number;
  enableMetrics: boolean;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  messagesIncoming: number;
  messagesOutgoing: number;
  averageLatency: number;
  connectionUptime: number;
  bandwidthUsage: number;
  errorRate: number;
}

export interface ConnectionState {
  id: string;
  url: string;
  socket: WebSocket | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastHeartbeat: Date;
  reconnectAttempts: number;
  messageQueue: MessageQueue[];
  metadata: Record<string, any>;
  createdAt: Date;
  connectedAt?: Date;
  lastError?: Error;
}

export interface MessageQueue {
  id: string;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

export interface WebSocketPool {
  connections: Map<string, ConnectionState>;
  maxSize: number;
  activeCount: number;
  messageBuffer: Map<string, MessageQueue[]>;
}

// Default configuration
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  maxConnections: 50,
  connectionTimeout: 30000, // 30 seconds
  heartbeatInterval: 30000, // 30 seconds
  reconnectAttempts: 5,
  reconnectDelay: 1000, // 1 second
  enableCompression: true,
  enableBinaryProtocol: false,
  messageQueueSize: 100,
  enableMetrics: true,
}

export class WebSocketOptimizer {
  private config: WebSocketConfig;
  private connectionPool: WebSocketPool;
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    messagesIncoming: 0,
    messagesOutgoing: 0,
    averageLatency: 0,
    connectionUptime: 0,
    bandwidthUsage: 0,
    errorRate: 0,
  }
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private messageLatencyTracker: Map<string, number> = new Map();

  constructor(_config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_WEBSOCKET_CONFIG, ...config }
    this.connectionPool = {
      connections: new Map(),
      maxSize: this.config.maxConnections,
      activeCount: 0,
      messageBuffer: new Map(),
    }
    this.initializeOptimizer();
  }

  /**
   * Initialize WebSocket optimizer
   */
  private initializeOptimizer(): void {
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring()

    // Start metrics collection
    if (this.config.enableMetrics) {
      this.startMetricsCollection()
    }

    // Register cleanup handlers
    this.registerCleanupHandlers()

    // Set up global error handlers
    this.setupGlobalErrorHandlers()
  }

  /**
   * Create optimized WebSocket connection
   */
  async createConnection(
    url: string,
    options: {
      protocols?: string[];
      metadata?: Record<string, any>;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      autoReconnect?: boolean;
    } = {}
  ): Promise<string> {
    const { protocols, metadata = {}, priority = 'normal', autoReconnect = true } = options;

    // Check connection pool limits
    if (this.connectionPool.activeCount >= this.connectionPool.maxSize) {
      throw new Error('Maximum WebSocket connections reached')
    }

    const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const connectionState: ConnectionState = {
      id: connectionId,
      url,
      socket: null,
      status: 'connecting',
      lastHeartbeat: new Date(),
      reconnectAttempts: 0,
      messageQueue: [],
      metadata: { ...metadata, priority, autoReconnect },
      createdAt: new Date(),
    }

    this.connectionPool.connections.set(connectionId, connectionState);
    this.metrics.totalConnections++;

    try {
      await this.establishConnection(connectionState, protocols);
      return connectionId;
    } catch (error) {
      this.handleConnectionError(connectionState, error as Error);
      throw error;
    }
  }

  /**
   * Establish WebSocket connection
   */
  private async establishConnection(
    connectionState: ConnectionState,
    protocols?: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(connectionState.url, protocols);

        // Configure WebSocket
        if (this.config.enableBinaryProtocol) {
          socket.binaryType = 'arraybuffer'
        }

        const timeout = setTimeout(() => {
          socket.close();
          reject(new Error('WebSocket connection timeout'));
        }, this.config.connectionTimeout);

        socket.onopen = (event) => {
          clearTimeout(timeout);
          this.handleConnectionOpen(connectionState, socket, event);
          resolve();
        }

        socket.onclose = (event) => {
          clearTimeout(timeout);
          this.handleConnectionClose(connectionState, event);
        }

        socket.onerror = (event) => {
          clearTimeout(timeout);
          this.handleConnectionError(connectionState, new Error('WebSocket error'));
          reject(new Error('WebSocket connection failed'));
        }

        socket.onmessage = (event) => {
          this.handleMessage(connectionState, event);
        }

        connectionState.socket = socket;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle connection open
   */
  private handleConnectionOpen(
    connectionState: ConnectionState,
    socket: WebSocket,
    event: Event
  ): void {
    connectionState.status = 'connected';
    connectionState.connectedAt = new Date();
    connectionState.reconnectAttempts = 0;
    this.connectionPool.activeCount++;
    this.metrics.activeConnections++;

    // Process queued messages
    this.processMessageQueue(connectionState)

    // Emit connection event
    this.emitEvent('connection:open', { connectionId: connectionState.id, event })

    // Register connection cleanup
    memoryManager.registerResource(
      `websocket-${connectionState.id}`,
      'webSocket',
      'WebSocketOptimizer',
      () => {
        this.closeConnection(connectionState.id)
      }
    );

    // console.log(`WebSocket connection ${connectionState.id} established`)
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(connectionState: ConnectionState, event: CloseEvent): void {
    connectionState.status = 'disconnected';
    connectionState.socket = null;
    this.connectionPool.activeCount = Math.max(0, this.connectionPool.activeCount - 1);
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);

    // Emit close event
    this.emitEvent('connection:close', {
      connectionId: connectionState.id,
      event,
      code: event.code,
      reason: event.reason,
    })

    // Attempt reconnection if enabled and not a clean close
    if (connectionState.metadata.autoReconnect && event.code !== 1000) {
      this.attemptReconnection(connectionState)
    } else {
      // Remove from pool if not reconnecting
      this.connectionPool.connections.delete(connectionState.id)
    }

    // console.log(`WebSocket connection ${connectionState.id} closed (code: ${event.code})`)
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(connectionState: ConnectionState, error: Error): void {
    connectionState.status = 'error';
    connectionState.lastError = error;
    this.metrics.failedConnections++;
    this.metrics.errorRate = this.metrics.failedConnections / this.metrics.totalConnections;

    // Emit error event
    this.emitEvent('connection:error', {
      connectionId: connectionState.id,
      error: error.message,
    })

    // console.error(`WebSocket connection ${connectionState.id} error:`, error)
  }

  /**
   * Handle incoming message
   */
  private handleMessage(connectionState: ConnectionState, event: MessageEvent): void {
    this.metrics.messagesIncoming++;

    try {
      // Parse message based on type
      let parsedData: any

      if (typeof event.data === 'string') {
        parsedData = JSON.parse(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        // Handle binary data
        parsedData = this.parseBinaryMessage(event.data)
      } else {
        parsedData = event.data;
      }

      // Track message latency if it's a response
      if (parsedData.messageId && this.messageLatencyTracker.has(parsedData.messageId)) {
        const sendTime = this.messageLatencyTracker.get(parsedData.messageId)!
        const latency = Date.now() - sendTime;
        this.updateAverageLatency(latency);
        this.messageLatencyTracker.delete(parsedData.messageId);
      }

      // Update heartbeat timestamp
      connectionState.lastHeartbeat = new Date()

      // Emit message event
      this.emitEvent('message', {
        connectionId: connectionState.id,
        data: parsedData,
        originalEvent: event,
      })
    } catch (error) {
      // console.error(`Failed to parse WebSocket message from ${connectionState.id}:`, error)
      this.emitEvent('message:error', {
        connectionId: connectionState.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Send message through WebSocket
   */
  async sendMessage(
    connectionId: string,
    data: any,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      retry?: boolean;
      maxRetries?: number;
      trackLatency?: boolean;
    } = {}
  ): Promise<void> {
    const { priority = 'normal', retry = true, maxRetries = 3, trackLatency = false } = options;

    const connectionState = this.connectionPool.connections.get(connectionId);
    if (!connectionState) {
      throw new Error(`WebSocket connection ${connectionId} not found`);
    }

    const message: MessageQueue = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      priority,
      timestamp: new Date(),
      retries: 0,
      maxRetries: retry ? maxRetries : 0,
    }

    // Track latency if requested
    if (trackLatency) {
      this.messageLatencyTracker.set(message.id, Date.now())
    }

    if (connectionState.status === 'connected' && connectionState.socket) {
      await this.sendMessageImmediate(connectionState, message);
    } else {
      // Queue message for later delivery
      this.queueMessage(connectionState, message)
    }
  }

  /**
   * Send message immediately
   */
  private async sendMessageImmediate(
    connectionState: ConnectionState,
    message: MessageQueue
  ): Promise<void> {
    try {
      const socket = connectionState.socket!;
      let serializedData: string | ArrayBuffer;

      // Serialize message based on configuration
      if (this.config.enableBinaryProtocol && this.shouldUseBinary(message.data)) {
        serializedData = this.serializeToBinary(message.data)
      } else {
        serializedData = JSON.stringify({
          messageId: message.id,
          timestamp: message.timestamp,
          data: message.data,
        });
      }

      socket.send(serializedData);
      this.metrics.messagesOutgoing++;
      this.updateBandwidthUsage(serializedData);

      // console.log(`Message ${message.id} sent to connection ${connectionState.id}`)
    } catch (error) {
      // console.error(`Failed to send message ${message.id}:`, error)

      // Retry if configured
      if (message.retries < message.maxRetries) {
        message.retries++
        this.queueMessage(connectionState, message);
      } else {
        this.emitEvent('message:failed', {
          connectionId: connectionState.id,
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(connectionState: ConnectionState, message: MessageQueue): void {
    // Check queue size limit
    if (connectionState.messageQueue.length >= this.config.messageQueueSize) {
      // Remove oldest low-priority message
      const lowPriorityIndex = connectionState.messageQueue.findIndex((m) => m.priority === 'low')
      if (lowPriorityIndex !== -1) {
        connectionState.messageQueue.splice(lowPriorityIndex, 1);
      } else {
        connectionState.messageQueue.shift(); // Remove oldest message
      }
    }

    connectionState.messageQueue.push(message);

    // Sort by priority
    connectionState.messageQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // console.log(`Message ${message.id} queued for connection ${connectionState.id}`)
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(connectionState: ConnectionState): Promise<void> {
    const messagesToProcess = [...connectionState.messageQueue];
    connectionState.messageQueue = [];

    for (const message of messagesToProcess) {
      try {
        await this.sendMessageImmediate(connectionState, message);
        // Add small delay to prevent overwhelming the connection
        await new Promise((resolve) => setTimeout(resolve, 10))
      } catch (error) {
        // console.error(`Failed to process queued message ${message.id}:`, error)
        // Re-queue if retries available
        if (message.retries < message.maxRetries) {
          this.queueMessage(connectionState, message)
        }
      }
    }
  }

  /**
   * Attempt reconnection
   */
  private async attemptReconnection(connectionState: ConnectionState): Promise<void> {
    if (connectionState.reconnectAttempts >= this.config.reconnectAttempts) {
      // console.log(`Max reconnection attempts reached for ${connectionState.id}`)
      this.connectionPool.connections.delete(connectionState.id);
      this.emitEvent('connection:failed', { connectionId: connectionState.id });
      return;
    }

    connectionState.status = 'reconnecting';
    connectionState.reconnectAttempts++;

    const delay = this.config.reconnectDelay * Math.pow(2, connectionState.reconnectAttempts - 1);

    setTimeout(async () => {
      try {
        await this.establishConnection(connectionState);
        this.emitEvent('connection:reconnected', { connectionId: connectionState.id });
      } catch (error) {
        // console.error(
          `Reconnection attempt ${connectionState.reconnectAttempts} failed for ${connectionState.id}:`,
          error
        )
        this.attemptReconnection(connectionState);
      }
    }, delay);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);

    // Register cleanup
    memoryManager.registerResource(
      'websocket-heartbeat-interval',
      'interval',
      'WebSocketOptimizer',
      () => {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval)
        }
      }
    );
  }

  /**
   * Check heartbeats for all connections
   */
  private checkHeartbeats(): void {
    const now = new Date();
    const heartbeatTimeout = this.config.heartbeatInterval * 2; // 2x heartbeat interval

    for (const [connectionId, connectionState] of this.connectionPool.connections.entries()) {
      if (connectionState.status === 'connected') {
        const timeSinceLastHeartbeat = now.getTime() - connectionState.lastHeartbeat.getTime();

        if (timeSinceLastHeartbeat > heartbeatTimeout) {
          // console.warn(`Heartbeat timeout for connection ${connectionId}`)

          // Send ping to check if connection is alive
          this.sendPing(connectionState)
        }
      }
    }
  }

  /**
   * Send ping to connection
   */
  private sendPing(connectionState: ConnectionState): void {
    if (connectionState.socket && connectionState.socket.readyState === WebSocket.OPEN) {
      try {
        const pingData = {
          type: 'ping',
          timestamp: Date.now(),
        }

        connectionState.socket.send(JSON.stringify(pingData));
      } catch (error) {
        // console.error(`Failed to send ping to ${connectionState.id}:`, error)
        // Force reconnection
        if (connectionState.metadata.autoReconnect) {
          connectionState.socket.close()
        }
      }
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 10000); // Update every 10 seconds

    // Register cleanup
    memoryManager.registerResource(
      'websocket-metrics-interval',
      'interval',
      'WebSocketOptimizer',
      () => {
        if (this.metricsInterval) {
          clearInterval(this.metricsInterval)
        }
      }
    );
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // Calculate connection uptime
    let totalUptime = 0
    let connectedCount = 0;

    for (const connectionState of this.connectionPool.connections.values()) {
      if (connectionState.status === 'connected' && connectionState.connectedAt) {
        totalUptime += Date.now() - connectionState.connectedAt.getTime();
        connectedCount++;
      }
    }

    this.metrics.connectionUptime = connectedCount > 0 ? totalUptime / connectedCount : 0;

    // Update error rate
    this.metrics.errorRate =
      this.metrics.totalConnections > 0
        ? this.metrics.failedConnections / this.metrics.totalConnections
        : 0
  }

  /**
   * Update average latency
   */
  private updateAverageLatency(latency: number): void {
    if (this.metrics.averageLatency === 0) {
      this.metrics.averageLatency = latency;
    } else {
      // Rolling average
      this.metrics.averageLatency = this.metrics.averageLatency * 0.9 + latency * 0.1
    }
  }

  /**
   * Update bandwidth usage
   */
  private updateBandwidthUsage(_data: string | ArrayBuffer): void {
    const size = typeof data === 'string' ? data.length : data.byteLength;
    this.metrics.bandwidthUsage += size;
  }

  /**
   * Utility methods
   */
  private shouldUseBinary(_data: any): boolean {
    // Simple heuristic: use binary for large objects or specific data types
    return (
      data instanceof ArrayBuffer ||
      data instanceof Uint8Array ||
      (typeof data === 'object' && JSON.stringify(data).length > 1024)
    )
  }

  private serializeToBinary(_data: any): ArrayBuffer {
    // Simple binary serialization (could be enhanced with protobuf, msgpack, etc.)
    const jsonString = JSON.stringify(data)
    const encoder = new TextEncoder();
    return encoder.encode(jsonString).buffer;
  }

  private parseBinaryMessage(buffer: ArrayBuffer): any {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(buffer);
    return JSON.parse(jsonString);
  }

  /**
   * Event handling
   */
  private emitEvent(eventName: string, data: any): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          // console.error(`Error in event handler for ${eventName}:`, error)
        }
      });
    }
  }

  addEventListener(eventName: string, handler: Function): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)!.add(handler);
  }

  removeEventListener(eventName: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        // console.log('Network connection restored, attempting to reconnect WebSockets')
        this.reconnectAllConnections();
      });

      window.addEventListener('offline', () => {
        // console.log('Network connection lost')
        this.emitEvent('network:offline', {});
      });
    }
  }

  /**
   * Reconnect all connections
   */
  private async reconnectAllConnections(): Promise<void> {
    for (const connectionState of this.connectionPool.connections.values()) {
      if (connectionState.status === 'disconnected' && connectionState.metadata.autoReconnect) {
        await this.attemptReconnection(connectionState);
      }
    }
  }

  /**
   * Register cleanup handlers
   */
  private registerCleanupHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Close specific connection
   */
  closeConnection(connectionId: string): void {
    const connectionState = this.connectionPool.connections.get(connectionId);
    if (connectionState && connectionState.socket) {
      connectionState.socket.close(1000, 'Normal closure');
      this.connectionPool.connections.delete(connectionId);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(connectionId: string): ConnectionState | null {
    return this.connectionPool.connections.get(connectionId) || null;
  }

  /**
   * Get all connection states
   */
  getAllConnections(): ConnectionState[] {
    return Array.from(this.connectionPool.connections.values());
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  /**
   * Get pool status
   */
  getPoolStatus(): {
    totalConnections: number;
    activeConnections: number;
    queuedMessages: number;
    utilizationPercent: number;
  } {
    const queuedMessages = Array.from(this.connectionPool.connections.values()).reduce(
      (total, state) => total + state.messageQueue.length,
      0
    );

    return {
      totalConnections: this.connectionPool.connections.size,
      activeConnections: this.connectionPool.activeCount,
      queuedMessages,
      utilizationPercent: (this.connectionPool.activeCount / this.connectionPool.maxSize) * 100,
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Close all connections
    for (const [connectionId, connectionState] of this.connectionPool.connections.entries()) {
      if (connectionState.socket) {
        connectionState.socket.close(1001, 'Going away')
      }
    }

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Clear data structures
    this.connectionPool.connections.clear()
    this.connectionPool.messageBuffer.clear();
    this.eventHandlers.clear();
    this.messageLatencyTracker.clear();

    // console.log('WebSocket optimizer cleaned up')
  }
}

// Global instance
export const webSocketOptimizer = new WebSocketOptimizer()

// Initialize on load
if (typeof window !== 'undefined') {
  (window as any).__WEBSOCKET_OPTIMIZER__ = webSocketOptimizer
}

export default WebSocketOptimizer;
