/**
 * Auto-Auth Sync - Zero-Friction Authentication
 * Automatically detects and syncs credentials from existing CLI tools
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runCommand } from '../tools/runCommand';

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

  static async syncGoogleCredentials(): Promise<string | null> {
    try {
      const res = await runCommand('gcloud', ['auth', 'print-access-token']);
      if (!res.success) {
        return null;
      }
      return res.stdout.trim();
    } catch (error) {
      return null;
    }
  }

  static async syncQwenCredentials(): Promise<QwenCredentials | null> {
    try {
      const configPath = path.join(os.homedir(), '.aliyun', 'config.json');

      if (!fs.existsSync(configPath)) {
        return null;
      }

      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);

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

  static async syncOllamaCredentials(): Promise<string | null> {
    try {
      const res = await runCommand('curl', ['-s', 'http://localhost:11434/api/tags']);
      if (!res.success) {
        return null;
      }
      // If we get a response, ollama is running
      return 'http://localhost:11434';
    } catch (error) {
      return null;
    }
  }

  static async syncOpenAIEnvCredentials(): Promise<string | null> {
    return process.env.OPENAI_API_KEY || null;
  }

  static async syncAnthropicEnvCredentials(): Promise<string | null> {
    return process.env.ANTHROPIC_API_KEY || null;
  }

  static async syncGeminiEnvCredentials(): Promise<string | null> {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }

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

    const gcloudToken = await this.syncGoogleCredentials();
    if (gcloudToken) {
      results.google = gcloudToken;
    }

    const qwenCreds = await this.syncQwenCredentials();
    if (qwenCreds) {
      results.qwen = qwenCreds;
    }

    const awsCreds = await this.syncAWSCredentials();
    if (awsCreds) {
      results.aws = awsCreds;
    }

    const ollamaUrl = await this.syncOllamaCredentials();
    if (ollamaUrl) {
      results.ollama = ollamaUrl;
    }

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
