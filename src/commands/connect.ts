/**
 * `echoctl connect` — Connect CLI to a running ECHOMEN backend via WebSocket.
 *
 * Usage:
 *   echoctl connect                    # connects to localhost:3001
 *   echoctl connect --url ws://remote:3001/ws/echo
 *   echoctl connect --token my-secret-token
 *
 * When connected, the CLI can:
 *   - Execute tools on the ECHOMEN backend (browser, shell, files)
 *   - Stream logs to the web dashboard in real-time
 *   - Sync memory bidirectionally
 *   - Share provider health information
 */

import WebSocket from 'ws';

export interface BridgeConfig {
  url: string;
  token: string;
  sessionId: string;
}

export class EchoBridge {
  private ws: WebSocket | null = null;
  private config: BridgeConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timer: NodeJS.Timeout;
  }>();
  private messageCounter = 0;
  private onLog: (msg: string) => void;

  constructor(config: BridgeConfig, onLog?: (msg: string) => void) {
    this.config = config;
    this.onLog = onLog || console.log;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.config.url}?token=${encodeURIComponent(this.config.token)}&session=${encodeURIComponent(this.config.sessionId)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        this.onLog(`[Bridge] ✅ Connected to ${this.config.url}`);
        resolve();
      });

      this.ws.on('message', (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          this.handleMessage(msg);
        } catch (err: any) {
          this.onLog(`[Bridge] Invalid message: ${err.message}`);
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        this.onLog(`[Bridge] Disconnected (${code}: ${reason.toString()})`);
        this.attemptReconnect();
      });

      this.ws.on('error', (err: Error) => {
        if (this.reconnectAttempts === 0) {
          reject(err);
        }
        this.onLog(`[Bridge] Error: ${err.message}`);
      });

      this.ws.on('ping', () => {
        this.ws?.pong();
      });
    });
  }

  private handleMessage(msg: any): void {
    // Handle tool_result responses
    if (msg.type === 'tool_result' && msg.payload?.requestId) {
      const pending = this.pendingRequests.get(msg.payload.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.payload.requestId);

        if (msg.payload.success) {
          pending.resolve(msg.payload.result);
        } else {
          pending.reject(new Error(msg.payload.error || 'Tool execution failed'));
        }
      }
    }

    // Handle pong
    if (msg.type === 'pong') {
      return; // Keepalive acknowledged
    }

    // Handle status updates from web
    if (msg.type === 'status_update') {
      this.onLog(`[Web] ${msg.payload.message || msg.payload.status}`);
    }

    // Handle log messages from web
    if (msg.type === 'log') {
      this.onLog(`[Web:${msg.payload.level}] ${msg.payload.message}`);
    }
  }

  /**
   * Execute a tool on the ECHOMEN backend via WebSocket.
   */
  async executeTool(tool: string, args: Record<string, any>, timeout = 60000): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to ECHOMEN bridge');
    }

    const id = `cli-${Date.now()}-${++this.messageCounter}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Tool '${tool}' timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer });

      this.ws!.send(JSON.stringify({
        type: 'tool_request',
        id,
        source: 'cli',
        timestamp: Date.now(),
        payload: { tool, args }
      }));
    });
  }

  /**
   * Send a log entry to the web dashboard.
   */
  sendLog(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', message: string, source = 'Echoctl'): void {
    this.send({
      type: 'log',
      source: 'cli',
      payload: { level, message, source }
    });
  }

  /**
   * Send a status update to the web dashboard.
   */
  sendStatus(status: string, message?: string, taskId?: string): void {
    this.send({
      type: 'status_update',
      source: 'cli',
      payload: { status, message, taskId }
    });
  }

  /**
   * Sync a memory entry to the web side.
   */
  syncMemory(action: 'write' | 'delete', key: string, value?: any): void {
    this.send({
      type: 'memory_sync',
      source: 'cli',
      payload: { action, key, value }
    });
  }

  /**
   * Send a streaming AI chunk to the web dashboard.
   */
  sendChunk(chunk: string): void {
    this.send({
      type: 'streaming_chunk',
      source: 'cli',
      payload: { chunk }
    });
  }

  private send(partial: Partial<any>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      ...partial,
      id: `cli-${Date.now()}-${++this.messageCounter}`,
      timestamp: Date.now(),
    }));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onLog(`[Bridge] Max reconnect attempts reached. Giving up.`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.onLog(`[Bridge] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(() => {
        // Will trigger another reconnect via the 'close' handler
      });
    }, delay);
  }

  disconnect(): void {
    // Clean up pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Bridge disconnected'));
    }
    this.pendingRequests.clear();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Register the `echoctl connect` command.
 */
export function registerConnectCommand(program: any): void {
  program
    .command('connect')
    .description('Connect to a running ECHOMEN web dashboard for real-time bridge')
    .option('--url <url>', 'WebSocket URL', 'ws://localhost:3001/ws/echo')
    .option('--token <token>', 'API token for authentication', process.env.ECHO_API_TOKEN || 'echo-dev-token')
    .option('--session <id>', 'Session identifier', `cli-${Date.now()}`)
    .action(async (options: { url: string; token: string; session: string }) => {
      const bridge = new EchoBridge({
        url: options.url,
        token: options.token,
        sessionId: options.session,
      });

      try {
        await bridge.connect();
        console.log(`\n🔌 Connected to ECHOMEN at ${options.url}`);
        console.log(`   Session: ${options.session}`);
        console.log(`   Press Ctrl+C to disconnect.\n`);

        // Keep the process alive
        process.on('SIGINT', () => {
          console.log('\n[Bridge] Disconnecting...');
          bridge.disconnect();
          process.exit(0);
        });

        // Send initial status
        bridge.sendStatus('RUNNING', 'CLI connected and ready');

      } catch (err: any) {
        console.error(`❌ Failed to connect: ${err.message}`);
        console.error(`   Make sure ECHOMEN backend is running at ${options.url}`);
        process.exit(1);
      }
    });
}
