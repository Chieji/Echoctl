/**
 * Auto-Auth Sync - Zero-Friction Authentication
 * Automatically detects and syncs credentials from existing CLI tools
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface QwenCredentials {
  accessKeyId: string;
  accessKeySecret: string;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export class AutoAuthSync {
  
  /**
   * Attempts to pull the active Google Cloud access token using the gcloud CLI.
   * Perfect for authenticating Gemini without manual key entry.
   */
  static async syncGoogleCredentials(): Promise<string | null> {
    try {
      // Executes gcloud command to get the active access token
      const token = execSync('gcloud auth print-access-token', { 
        encoding: 'utf-8',
        stdio: 'pipe' // Prevents terminal spam if it fails
      }).trim();
      return token;
    } catch (error) {
      // User is not logged into gcloud or it's not installed
      return null; 
    }
  }

  /**
   * Scans the local Aliyun (Alibaba Cloud) config file for active Qwen credentials.
   */
  static async syncQwenCredentials(): Promise<QwenCredentials | null> {
    try {
      const configPath = path.join(os.homedir(), '.aliyun', 'config.json');
      
      if (!fs.existsSync(configPath)) {
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      // Find the profile currently marked as active
      const activeProfile = config.profiles.find((p: any) => p.name === config.current);
      
      if (activeProfile && activeProfile.access_key_id && activeProfile.access_key_secret) {
        return {
          accessKeyId: activeProfile.access_key_id,
          accessKeySecret: activeProfile.access_key_secret
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Scans AWS credentials file for active AWS CLI credentials.
   * Can be used for Bedrock or other AWS AI services.
   */
  static async syncAWSCredentials(profile: string = 'default'): Promise<AWSCredentials | null> {
    try {
      const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
      
      if (!fs.existsSync(credentialsPath)) {
        return null;
      }

      const credentialsData = fs.readFileSync(credentialsPath, 'utf-8');
      const lines = credentialsData.split('\n');
      
      let inProfile = profile === 'default';
      let credentials: AWSCredentials = { accessKeyId: '', secretAccessKey: '' };
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('[')) {
          inProfile = trimmed === `[${profile}]`;
          continue;
        }
        
        if (inProfile && trimmed.includes('=')) {
          const [key, value] = trimmed.split('=').map(s => s.trim());
          if (key === 'aws_access_key_id') {
            credentials.accessKeyId = value;
          } else if (key === 'aws_secret_access_key') {
            credentials.secretAccessKey = value;
          } else if (key === 'aws_session_token') {
            credentials.sessionToken = value;
          }
        }
      }
      
      if (credentials.accessKeyId && credentials.secretAccessKey) {
        return credentials;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks for Ollama local installation and returns base URL.
   */
  static async syncOllamaCredentials(): Promise<string | null> {
    try {
      // Check if ollama is running on default port
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('curl -s http://localhost:11434/api/tags');
      return 'http://localhost:11434';
    } catch (error) {
      return null;
    }
  }

  /**
   * Check for OpenAI key in environment variable.
   */
  static async syncOpenAIEnvCredentials(): Promise<string | null> {
    return process.env.OPENAI_API_KEY || null;
  }

  /**
   * Check for Anthropic key in environment variable.
   */
  static async syncAnthropicEnvCredentials(): Promise<string | null> {
    return process.env.ANTHROPIC_API_KEY || null;
  }

  /**
   * Check for Gemini key in environment variable.
   */
  static async syncGeminiEnvCredentials(): Promise<string | null> {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }

  /**
   * Run all credential sync checks and return available credentials.
   */
  static async syncAllCredentials(): Promise<{
    google?: string;
    qwen?: QwenCredentials;
    aws?: AWSCredentials;
    ollama?: string;
    openai?: string;
    anthropic?: string;
    gemini?: string;
  }> {
    const results: any = {};

    // Google Cloud (for Gemini)
    const gcloudToken = await this.syncGoogleCredentials();
    if (gcloudToken) {
      results.google = gcloudToken;
    }

    // Aliyun (for Qwen)
    const qwenCreds = await this.syncQwenCredentials();
    if (qwenCreds) {
      results.qwen = qwenCreds;
    }

    // AWS
    const awsCreds = await this.syncAWSCredentials();
    if (awsCreds) {
      results.aws = awsCreds;
    }

    // Ollama
    const ollamaUrl = await this.syncOllamaCredentials();
    if (ollamaUrl) {
      results.ollama = ollamaUrl;
    }

    // Environment variables
    const openaiKey = await this.syncOpenAIEnvCredentials();
    if (openaiKey) {
      results.openai = openaiKey;
    }

    const anthropicKey = await this.syncAnthropicEnvCredentials();
    if (anthropicKey) {
      results.anthropic = anthropicKey;
    }

    const geminiKey = await this.syncGeminiEnvCredentials();
    if (geminiKey) {
      results.gemini = geminiKey;
    }

    return results;
  }

  /**
   * Print available credentials to console (for debugging).
   */
  static async printAvailableCredentials(): Promise<void> {
    const creds = await this.syncAllCredentials();
    
    console.log('\n🔐 Available Credentials (Auto-Detected)\n');
    
    const providers = [
      { name: 'Google Cloud (Gemini)', key: 'google', masked: true },
      { name: 'Aliyun (Qwen)', key: 'qwen', masked: false },
      { name: 'AWS (Bedrock)', key: 'aws', masked: false },
      { name: 'Ollama (Local)', key: 'ollama', masked: false },
      { name: 'OpenAI (env)', key: 'openai', masked: true },
      { name: 'Anthropic (env)', key: 'anthropic', masked: true },
      { name: 'Gemini (env)', key: 'gemini', masked: true },
    ];

    for (const provider of providers) {
      const value = (creds as any)[provider.key];
      if (value) {
        const displayValue = provider.masked 
          ? '✓ Configured' 
          : JSON.stringify(value);
        console.log(`  ✓ ${provider.name}: ${displayValue}`);
      } else {
        console.log(`  ○ ${provider.name}: Not found`);
      }
    }
    
    console.log('');
  }
}
