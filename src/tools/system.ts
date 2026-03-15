/**
 * System Information Tool
 * Provides details about the host system
 */

import os from 'os';
import { ToolResult } from './executor.js';

/**
 * Get system information
 */
export async function getSystemInfo(): Promise<ToolResult> {
  try {
    const info = {
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
      type: os.type(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
      })),
      networkInterfaces: os.networkInterfaces(),
      userInfo: os.userInfo(),
    };

    return {
      success: true,
      output: JSON.stringify(info, null, 2),
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
    };
  }
}

export const systemTools = {
  getSystemInfo,
};
