import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const BoxSDK = require('box-node-sdk').default || require('box-node-sdk').BoxSDK || require('box-node-sdk');
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getConfig } from '../../utils/config.js';
import chalk from 'chalk';

/**
 * BoxStore - Handles synchronization of Echo memory with Box.com
 */
export class BoxStore {
  private sdk: any;
  private client: any;
  private folderId: string = '0'; // Default to root
  private initialized: boolean = false;

  constructor() {
    try {
      this.sdk = new BoxSDK({
        clientID: '',
        clientSecret: '',
      });
    } catch (error: any) {
      // If Box SDK is not a valid constructor (or missing), gracefully disable cloud sync
      console.error(
        chalk.yellow(
          `⚠ Box SDK not available, disabling Box cloud sync: ${error?.message ?? String(error)}`
        )
      );
      this.sdk = null;
    }
  }

  /**
   * Initialize the Box client
   */
  async init(): Promise<boolean> {
    const config = getConfig().getBoxConfig();
    // If SDK failed to initialize, treat Box sync as disabled
    if (!this.sdk) {
      return false;
    }
    if (!config || !config.enabled || !config.developerToken) {
      return false;
    }

    try {
      this.client = this.sdk.getBasicClient(config.developerToken);
      this.folderId = config.folderId || '0';
      
      // Verify connection by getting folder info
      await this.client.folders.get(this.folderId);
      
      this.initialized = true;
      return true;
    } catch (error: any) {
      console.error(chalk.red(`✗ Box initialization failed: ${error.message}`));
      return false;
    }
  }

  /**
   * Sync local brain.json to Box
   */
  async uploadMemory(localPath: string): Promise<boolean> {
    if (!this.initialized && !(await this.init())) return false;

    try {
      const content = await readFile(localPath);
      const fileName = 'echo_brain.json';

      // Check if file already exists in Box
      const folderItems = await this.client.folders.getItems(this.folderId);
      const existingFile = folderItems.entries.find((item: any) => item.name === fileName);

      if (existingFile) {
        // Update existing file
        await this.client.files.uploadNewFileVersion(existingFile.id, new Uint8Array(content));
      } else {
        // Upload new file
        await this.client.files.uploadFile(this.folderId, fileName, new Uint8Array(content));
      }

      return true;
    } catch (error: any) {
      console.error(chalk.red(`✗ Box upload failed: ${error.message}`));
      return false;
    }
  }

  /**
   * Sync Box memory to local brain.json
   */
  async downloadMemory(localPath: string): Promise<boolean> {
    if (!this.initialized && !(await this.init())) return false;

    try {
      const fileName = 'echo_brain.json';
      const folderItems = await this.client.folders.getItems(this.folderId);
      const file = folderItems.entries.find((item: any) => item.name === fileName);

      if (!file) {
        return false;
      }

      const stream = await this.client.files.getReadStream(file.id);
      
      return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('end', async () => {
          const content = Buffer.concat(chunks);
          await writeFile(localPath, new Uint8Array(content));
          resolve(true);
        });
        stream.on('error', (err: any) => reject(err));
      });
    } catch (error: any) {
      console.error(chalk.red(`✗ Box download failed: ${error.message}`));
      return false;
    }
  }

  /**
   * Store a learning experience log on Box
   */
  async logExperience(title: string, data: any): Promise<void> {
    if (!this.initialized && !(await this.init())) return;

    try {
      const logFileName = `experience_${Date.now()}.json`;
      const content = JSON.stringify({
        title,
        timestamp: new Date().toISOString(),
        data,
      }, null, 2);

      await this.client.files.uploadFile(this.folderId, logFileName, content);
    } catch (e) {
      // Background logging failure shouldn't crash the app
    }
  }
}

/**
 * Singleton instance
 */
let boxStoreInstance: BoxStore | null = null;

export function getBoxStore(): BoxStore {
  if (!boxStoreInstance) {
    boxStoreInstance = new BoxStore();
  }
  return boxStoreInstance;
}
