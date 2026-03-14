/**
 * Tests for MCP (Model Context Protocol) Integration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MCPServerClient } from '../src/extensions/mcp.js';
import { MCPServerConfig } from '../src/storage/mcp.js';

describe('MCPServerClient', () => {
  const mockConfig: MCPServerConfig = {
    command: 'node',
    args: ['server.js'],
    enabled: true,
  };

  it('should initialize with correct transport (stdio)', () => {
    const client = new MCPServerClient('test-server', mockConfig);
    // @ts-ignore - accessing private for test
    expect(client.transport).toBe('stdio');
  });

  it('should initialize with correct transport (sse)', () => {
    const sseConfig: MCPServerConfig = {
      command: 'http://localhost:3000/sse',
      enabled: true,
    };
    const client = new MCPServerClient('sse-server', sseConfig);
    // @ts-ignore - accessing private for test
    expect(client.transport).toBe('sse');
  });

  it('should have a name', () => {
    const client = new MCPServerClient('my-server', mockConfig);
    expect(client.name).toBe('my-server');
  });
});
