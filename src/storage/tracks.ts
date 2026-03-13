/**
 * Track Management - Development Track Isolation
 * Allows switching between different project contexts
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

/**
 * Track representation
 */
export interface Track {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  currentSessionId: string | null;
  config: {
    defaultProvider?: string;
    contextLength?: number;
    autoApproveTools?: string[];
  };
  metadata: Record<string, any>;
}

/**
 * Tracks database structure
 */
export interface TracksDatabase {
  tracks: Track[];
  currentTrackId: string | null;
}

/**
 * Configuration constants
 */
const CONFIG = {
  CONFIG_DIR: join(homedir(), '.config', 'echo-cli'),
  DB_FILE: 'tracks.json',
} as const;

/**
 * TracksStore class - manages development tracks
 */
export class TracksStore {
  private db: Low<TracksDatabase>;
  private initialized: boolean = false;

  constructor() {
    // Ensure config directory exists
    if (!existsSync(CONFIG.CONFIG_DIR)) {
      mkdirSync(CONFIG.CONFIG_DIR, { recursive: true });
    }

    const dbPath = join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
    this.db = new Low<TracksDatabase>(new JSONFile<TracksDatabase>(dbPath), {
      tracks: [],
      currentTrackId: null,
    });
  }

  /**
   * Initialize database (load from disk)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.db.read();
      if (!this.db.data) {
        this.db.data = { tracks: [], currentTrackId: null };
      }
      await this.db.write();
      this.initialized = true;
    } catch (error: any) {
      console.error('Warning: Tracks database error, recreating...', error.message);
      this.db.data = { tracks: [], currentTrackId: null };
      await this.db.write();
      this.initialized = true;
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Create a new track
   */
  async create(name: string, description?: string): Promise<Track> {
    await this.ensureInitialized();

    const track: Track = {
      id: uuidv4(),
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentSessionId: null,
      config: {},
      metadata: {},
    };

    this.db.data!.tracks.push(track);
    
    // If first track, make it current
    if (this.db.data!.tracks.length === 1) {
      this.db.data!.currentTrackId = track.id;
    }

    await this.db.write();
    return track;
  }

  /**
   * Get a track by ID
   */
  get(id: string): Track | null {
    if (!this.db.data) return null;
    return this.db.data.tracks.find(t => t.id === id) || null;
  }

  /**
   * Get current track
   */
  getCurrentTrack(): Track | null {
    if (!this.db.data || !this.db.data.currentTrackId) {
      return null;
    }
    return this.get(this.db.data.currentTrackId);
  }

  /**
   * Get or create default track
   */
  async getOrCreateDefault(): Promise<Track> {
    await this.ensureInitialized();

    let current = this.getCurrentTrack();
    if (!current) {
      // Create default track
      current = await this.create('Default', 'Default development track');
    }
    return current;
  }

  /**
   * List all tracks
   */
  list(limit?: number): Track[] {
    if (!this.db.data) return [];
    
    let tracks = [...this.db.data.tracks].sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (limit) {
      tracks = tracks.slice(0, limit);
    }
    
    return tracks;
  }

  /**
   * Switch to a track
   */
  async switch(trackId: string): Promise<boolean> {
    await this.ensureInitialized();

    const track = this.get(trackId);
    if (!track) {
      return false;
    }

    this.db.data!.currentTrackId = trackId;
    await this.db.write();
    return true;
  }

  /**
   * Switch to track by name
   */
  async switchByName(name: string): Promise<boolean> {
    await this.ensureInitialized();

    const track = this.db.data!.tracks.find(
      t => t.name.toLowerCase() === name.toLowerCase()
    );

    if (!track) {
      return false;
    }

    this.db.data!.currentTrackId = track.id;
    await this.db.write();
    return true;
  }

  /**
   * Update track
   */
  async update(id: string, updates: Partial<Track>): Promise<boolean> {
    await this.ensureInitialized();

    const track = this.get(id);
    if (!track) {
      return false;
    }

    Object.assign(track, {
      ...updates,
      updatedAt: Date.now(),
    });

    await this.db.write();
    return true;
  }

  /**
   * Delete a track
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();

    const index = this.db.data!.tracks.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    // Don't delete last track
    if (this.db.data!.tracks.length === 1) {
      throw new Error('Cannot delete the last track');
    }

    this.db.data!.tracks.splice(index, 1);

    // If deleting current track, switch to another
    if (this.db.data!.currentTrackId === id) {
      this.db.data!.currentTrackId = this.db.data!.tracks[0].id;
    }

    await this.db.write();
    return true;
  }

  /**
   * Set track config
   */
  async setConfig(trackId: string, config: Partial<Track['config']>): Promise<boolean> {
    await this.ensureInitialized();

    const track = this.get(trackId);
    if (!track) {
      return false;
    }

    track.config = { ...track.config, ...config };
    track.updatedAt = Date.now();
    await this.db.write();
    return true;
  }

  /**
   * Get track config
   */
  getConfig(trackId: string): Track['config'] | null {
    const track = this.get(trackId);
    return track?.config || null;
  }

  /**
   * Set current session for track
   */
  async setCurrentSession(trackId: string, sessionId: string | null): Promise<boolean> {
    await this.ensureInitialized();

    const track = this.get(trackId);
    if (!track) {
      return false;
    }

    track.currentSessionId = sessionId;
    track.updatedAt = Date.now();
    await this.db.write();
    return true;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTracks: number;
    currentTrack: string | null;
    tracks: Array<{ name: string; sessions: number }>;
  } {
    if (!this.db.data) {
      return { totalTracks: 0, currentTrack: null, tracks: [] };
    }

    const currentTrack = this.db.data.tracks.find(
      t => t.id === this.db.data.currentTrackId
    );

    return {
      totalTracks: this.db.data.tracks.length,
      currentTrack: currentTrack?.name || null,
      tracks: this.db.data.tracks.map(t => ({
        name: t.name,
        sessions: t.currentSessionId ? 1 : 0,
      })),
    };
  }

  /**
   * Export track as JSON
   */
  export(trackId: string): string {
    const track = this.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }
    return JSON.stringify(track, null, 2);
  }

  /**
   * Import track from JSON
   */
  async import(json: string): Promise<Track> {
    await this.ensureInitialized();

    try {
      const data = JSON.parse(json) as Track;
      
      if (!data.name) {
        throw new Error('Invalid track format: missing name');
      }

      const track: Track = {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentSessionId: null,
        config: data.config || {},
        metadata: data.metadata || {},
      };

      this.db.data!.tracks.push(track);
      await this.db.write();
      return track;
    } catch (error: any) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Get database file path
   */
  getDbPath(): string {
    return join(CONFIG.CONFIG_DIR, CONFIG.DB_FILE);
  }
}

/**
 * Singleton instance
 */
let tracksStoreInstance: TracksStore | null = null;

export function getTracksStore(): TracksStore {
  if (!tracksStoreInstance) {
    tracksStoreInstance = new TracksStore();
  }
  return tracksStoreInstance;
}
