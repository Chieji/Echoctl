/**
 * Tests for System Information Tool
 */

import { describe, it, expect } from '@jest/globals';
import { getSystemInfo } from '../src/tools/system.js';

describe('System Information Tool', () => {
  it('should return system information', async () => {
    const result = await getSystemInfo();
    expect(result.success).toBe(true);
    
    const info = JSON.parse(result.output);
    expect(info).toHaveProperty('platform');
    expect(info).toHaveProperty('arch');
    expect(info).toHaveProperty('release');
    expect(info).toHaveProperty('type');
    expect(info).toHaveProperty('hostname');
    expect(info).toHaveProperty('uptime');
    expect(info).toHaveProperty('loadavg');
    expect(info).toHaveProperty('totalmem');
    expect(info).toHaveProperty('freemem');
    expect(info).toHaveProperty('cpus');
    expect(info).toHaveProperty('networkInterfaces');
    expect(info).toHaveProperty('userInfo');
    
    expect(Array.isArray(info.cpus)).toBe(true);
    expect(info.cpus.length).toBeGreaterThan(0);
  });
});
