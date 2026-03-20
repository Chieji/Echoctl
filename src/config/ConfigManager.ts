/**
 * Configuration Manager
 * Centralized configuration with environment variable support
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';

export interface EchoConfig {
  // Core settings
  version: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;

  // API settings
  apiUrl: string;
  apiKey: string;
  apiTimeout: number;

  // CLI settings
  theme: 'light' | 'dark' | 'auto';
  outputFormat: 'text' | 'json' | 'table';
  pageSize: number;

  // Tool settings
  toolTimeout: number;
  maxConcurrentTools: number;

  // Security settings
  enableHITL: boolean;
  requireApprovalFor: string[];
  enableAuditLogging: boolean;

  // Plugin settings
  pluginDirectories: string[];
  autoLoadPlugins: boolean;

  // Logging settings
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFile?: string;
  logMaxSize: number;

  // Custom settings
  [key: string]: any;
}

class ConfigManager {
  private config: EchoConfig;
  private configPath: string;
  private defaults: EchoConfig = {
    version: '1.0.0',
    environment: 'development',
    debug: false,
    apiUrl: process.env.ECHO_API_URL || 'http://localhost:3001',
    apiKey: process.env.ECHO_API_KEY || 'echomen-secret-token-2026',
    apiTimeout: 30000,
    theme: 'auto',
    outputFormat: 'text',
    pageSize: 20,
    toolTimeout: 60000,
    maxConcurrentTools: 5,
    enableHITL: true,
    requireApprovalFor: ['writeFile', 'deleteFile', 'runCommand'],
    enableAuditLogging: true,
    pluginDirectories: [
      join(homedir(), '.echo', 'plugins'),
      join(process.cwd(), 'plugins'),
    ],
    autoLoadPlugins: true,
    logLevel: 'info',
    logMaxSize: 100 * 1024 * 1024, // 100MB
  };

  constructor(configDir?: string) {
    const dir = configDir || join(homedir(), '.echo');

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.configPath = join(dir, 'config.json');
    this.config = this.load();
  }

  /**
   * Load configuration from file
   */
  private load(): EchoConfig {
    try {
      if (existsSync(this.configPath)) {
        const fileConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));
        return { ...this.defaults, ...fileConfig };
      }
    } catch (error) {
      console.warn('Failed to load config file, using defaults');
    }

    return { ...this.defaults };
  }

  /**
   * Save configuration to file
   */
  save(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error: any) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Get configuration value
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      value = value?.[k];
    }

    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Set configuration value
   */
  set(key: string, value: any): void {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];

      if (!(k in obj)) {
        obj[k] = {};
      }

      obj = obj[k];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Get all configuration
   */
  getAll(): EchoConfig {
    return { ...this.config };
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.config = { ...this.defaults };
    this.save();
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!this.config.apiUrl) {
      errors.push('apiUrl is required');
    }

    if (!this.config.apiKey) {
      errors.push('apiKey is required');
    }

    // Validate types
    if (typeof this.config.debug !== 'boolean') {
      errors.push('debug must be a boolean');
    }

    if (!['development', 'staging', 'production'].includes(this.config.environment)) {
      errors.push('environment must be development, staging, or production');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

export const configManager = new ConfigManager();
