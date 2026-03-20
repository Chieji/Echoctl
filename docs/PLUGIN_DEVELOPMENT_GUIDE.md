# Echoctl Plugin Development Guide

**Version:** 1.0  
**Last Updated:** 2026-03-20

---

## Table of Contents

1. [Overview](#overview)
2. [Plugin Structure](#plugin-structure)
3. [Creating Your First Plugin](#creating-your-first-plugin)
4. [Plugin API Reference](#plugin-api-reference)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [Publishing Your Plugin](#publishing-your-plugin)

---

## Overview

Plugins extend Echoctl's functionality by adding new tools, providers, and hooks. They are modular, self-contained packages that can be independently developed, tested, and deployed.

### Key Features

- **Easy Integration**: Plugins are automatically discovered and loaded
- **Modular Design**: Each plugin is independent and can be developed separately
- **Hook System**: Plugins can hook into Echoctl's lifecycle events
- **Tool Registration**: Add new tools that integrate with external services
- **Provider Support**: Extend AI provider capabilities

---

## Plugin Structure

A typical Echoctl plugin has the following structure:

```
my-plugin/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
├── tests/
│   └── index.test.ts
├── README.md
└── .gitignore
```

### package.json

```json
{
  "name": "@echoctl/my-plugin",
  "version": "1.0.0",
  "description": "My awesome Echoctl plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "publish": "npm publish"
  },
  "echo": {
    "plugin": true
  },
  "dependencies": {
    "echoctl": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## Creating Your First Plugin

### Step 1: Initialize Plugin Project

```bash
mkdir my-plugin
cd my-plugin
npm init -y
npm install --save-dev typescript @types/node
```

### Step 2: Create Plugin Entry Point

**src/index.ts:**

```typescript
import { Plugin } from 'echoctl';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My awesome plugin',
  author: 'Your Name',

  async initialize() {
    console.log('✓ My plugin initialized');
  },

  async destroy() {
    console.log('✓ My plugin destroyed');
  },

  tools: {
    myTool: {
      name: 'my-plugin:myTool',
      description: 'My first tool',
      args: {
        name: { type: 'string', description: 'User name' },
      },
      async execute(args: any) {
        return {
          success: true,
          message: `Hello, ${args.name}!`,
        };
      },
    },
  },

  hooks: {
    'tool:executed': [
      async (toolName: string, result: any) => {
        console.log(`Tool executed: ${toolName}`);
      },
    ],
  },
};

export default myPlugin;
```

### Step 3: Build and Test

```bash
npm run build
npm test
```

### Step 4: Install in Echoctl

```bash
# Copy to plugins directory
cp -r . ~/.echo/plugins/my-plugin

# Or install from npm
npm install @echoctl/my-plugin
```

---

## Plugin API Reference

### Plugin Interface

```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  tools?: Record<string, Tool>;
  providers?: Record<string, Provider>;
  hooks?: Record<string, Function[]>;
}
```

### Tool Interface

```typescript
interface Tool {
  name: string;
  description: string;
  args: Record<string, Argument>;
  execute: (args: any) => Promise<any>;
}
```

### Argument Types

```typescript
type ArgumentType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object';

interface Argument {
  type: ArgumentType;
  description: string;
  required?: boolean;
  default?: any;
  enum?: any[];
}
```

### Available Hooks

| Hook Name | Parameters | Description |
|---|---|---|
| `plugin:loaded` | `pluginName: string` | Called when plugin is loaded |
| `plugin:unloaded` | `pluginName: string` | Called when plugin is unloaded |
| `tool:executed` | `toolName: string, result: any` | Called after tool execution |
| `tool:failed` | `toolName: string, error: Error` | Called when tool fails |
| `config:changed` | `key: string, value: any` | Called when config changes |

---

## Examples

### Example 1: Weather Plugin

```typescript
import { Plugin } from 'echoctl';

export const weatherPlugin: Plugin = {
  name: 'weather',
  version: '1.0.0',
  description: 'Get weather information',

  tools: {
    getCurrentWeather: {
      name: 'weather:getCurrentWeather',
      description: 'Get current weather for a location',
      args: {
        location: { type: 'string', description: 'City name' },
        units: { type: 'string', enum: ['metric', 'imperial'], default: 'metric' },
      },
      async execute(args: any) {
        const { location, units } = args;
        const apiKey = process.env.WEATHER_API_KEY;

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${apiKey}`
        );

        const data = await response.json();

        return {
          success: true,
          location: data.name,
          temperature: data.main.temp,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
        };
      },
    },
  },
};

export default weatherPlugin;
```

### Example 2: Database Plugin

```typescript
import { Plugin } from 'echoctl';
import { createConnection } from 'mysql2/promise';

export const databasePlugin: Plugin = {
  name: 'database',
  version: '1.0.0',
  description: 'Database operations',

  tools: {
    query: {
      name: 'database:query',
      description: 'Execute a database query',
      args: {
        sql: { type: 'string', description: 'SQL query' },
        params: { type: 'array', description: 'Query parameters' },
      },
      async execute(args: any) {
        try {
          const connection = await createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          });

          const [results] = await connection.execute(args.sql, args.params || []);
          await connection.end();

          return {
            success: true,
            results,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
  },
};

export default databasePlugin;
```

### Example 3: Notification Plugin

```typescript
import { Plugin } from 'echoctl';

export const notificationPlugin: Plugin = {
  name: 'notifications',
  version: '1.0.0',
  description: 'Send notifications via multiple channels',

  tools: {
    sendEmail: {
      name: 'notifications:sendEmail',
      description: 'Send an email',
      args: {
        to: { type: 'string', description: 'Recipient email' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body' },
      },
      async execute(args: any) {
        // Implementation
        return { success: true };
      },
    },

    sendSMS: {
      name: 'notifications:sendSMS',
      description: 'Send an SMS',
      args: {
        phone: { type: 'string', description: 'Phone number' },
        message: { type: 'string', description: 'Message text' },
      },
      async execute(args: any) {
        // Implementation
        return { success: true };
      },
    },
  },

  hooks: {
    'tool:executed': [
      async (toolName: string, result: any) => {
        if (toolName.startsWith('notifications:') && result.success) {
          console.log(`✓ Notification sent: ${toolName}`);
        }
      },
    ],
  },
};

export default notificationPlugin;
```

---

## Best Practices

### 1. Error Handling

Always return a consistent error structure:

```typescript
return {
  success: false,
  error: error.message,
  code: 'ERROR_CODE',
};
```

### 2. Environment Variables

Use environment variables for sensitive data:

```typescript
const apiKey = process.env.MY_PLUGIN_API_KEY;
if (!apiKey) {
  throw new Error('MY_PLUGIN_API_KEY environment variable is required');
}
```

### 3. Input Validation

Validate all inputs before processing:

```typescript
if (!args.email || !args.email.includes('@')) {
  return { success: false, error: 'Invalid email address' };
}
```

### 4. Logging

Use consistent logging patterns:

```typescript
console.log(`✓ Plugin action completed: ${action}`);
console.warn(`⚠️  Plugin warning: ${message}`);
console.error(`✗ Plugin error: ${error}`);
```

### 5. Documentation

Include comprehensive documentation in your plugin:

```typescript
tools: {
  myTool: {
    name: 'my-plugin:myTool',
    description: 'Clear, concise description of what this tool does',
    args: {
      param1: { 
        type: 'string', 
        description: 'What this parameter does',
        required: true,
      },
    },
    async execute(args: any) {
      // Implementation
    },
  },
}
```

### 6. Testing

Write comprehensive tests for your plugin:

```typescript
import { myPlugin } from './index';

describe('My Plugin', () => {
  it('should execute myTool successfully', async () => {
    const result = await myPlugin.tools.myTool.execute({ name: 'World' });
    expect(result.success).toBe(true);
    expect(result.message).toBe('Hello, World!');
  });
});
```

---

## Publishing Your Plugin

### Step 1: Prepare for Publication

```bash
npm run build
npm test
```

### Step 2: Update package.json

Ensure your `package.json` has:

```json
{
  "name": "@echoctl/my-plugin",
  "version": "1.0.0",
  "repository": "https://github.com/yourusername/echoctl-my-plugin",
  "keywords": ["echoctl", "plugin"],
  "echo": {
    "plugin": true
  }
}
```

### Step 3: Publish to npm

```bash
npm publish
```

### Step 4: Register in Plugin Registry

Submit your plugin to the [Echoctl Plugin Registry](https://github.com/Chieji/Echoctl/wiki/Plugin-Registry) by creating a pull request.

---

## Troubleshooting

### Plugin Not Loading

1. Check that `package.json` has `"echo": { "plugin": true }`
2. Verify plugin is in correct directory: `~/.echo/plugins/`
3. Check logs: `LOG_LEVEL=debug echoctl`

### Tool Not Executing

1. Verify tool name format: `pluginName:toolName`
2. Check that all required arguments are provided
3. Review error message for details

### Environment Variables Not Found

1. Verify variable is set: `echo $MY_VAR`
2. Check `.env` file if using dotenv
3. Restart Echoctl after setting variables

---

## Support & Community

- **GitHub Issues**: [Report bugs](https://github.com/Chieji/Echoctl/issues)
- **Discussions**: [Ask questions](https://github.com/Chieji/Echoctl/discussions)
- **Plugin Registry**: [Browse plugins](https://github.com/Chieji/Echoctl/wiki/Plugin-Registry)

---

**Happy plugin development! 🚀**
