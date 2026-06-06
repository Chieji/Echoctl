import os from 'node:os';
import path from 'node:path';

const getHomeDir = () => os.homedir();

// XDG-compliant paths for credential storage
export const CONFIG_DIR = process.env.XDG_CONFIG_HOME 
  ? path.join(process.env.XDG_CONFIG_HOME, 'echoctl')
  : path.join(getHomeDir(), '.config', 'echoctl');

export const DATA_DIR = process.env.XDG_DATA_HOME
  ? path.join(process.env.XDG_DATA_HOME, 'echoctl')
  : path.join(getHomeDir(), '.local', 'share', 'echoctl');

// Primary auth config file location
export const AUTH_CONFIG_PATH = path.join(DATA_DIR, 'auth.json');

// Fallback config location (for backwards compatibility)
export const FALLBACK_AUTH_CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
