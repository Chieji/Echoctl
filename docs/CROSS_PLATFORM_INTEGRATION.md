# Cross-Platform Plugin Integration Guide

**Version:** 1.0  
**Last Updated:** 2026-03-20

---

## Overview

Echoctl now supports seamless integration with multiple AI CLI platforms through three powerful bridges:

1. **MCP Bridge**: Model Context Protocol compatibility for Claude Code and other MCP-compatible tools
2. **CLI Sync Bridge**: Synchronization with Gemini CLI, Qwen, and other AI assistants
3. **Universal Skill Registry**: Centralized skill sharing and discovery across platforms

---

## Table of Contents

1. [MCP Integration](#mcp-integration)
2. [CLI Synchronization](#cli-synchronization)
3. [Universal Skill Registry](#universal-skill-registry)
4. [Setup Instructions](#setup-instructions)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)

---

## MCP Integration

### What is MCP?

The **Model Context Protocol (MCP)** is a standardized protocol for AI assistants to interact with tools and resources. Echoctl's MCP Bridge makes all your Echoctl plugins available to Claude Code and other MCP-compatible clients.

### Features

- **Tool Registration**: Expose Echoctl tools as MCP-compatible tools
- **Resource Management**: Share files and data as MCP resources
- **Prompt Templates**: Provide reusable prompt templates
- **Bidirectional Sync**: Import MCP tools from other servers

### Enable MCP Bridge

```bash
# Start Echoctl with MCP server
echoctl start --enable-mcp

# Or configure in config.json
{
  "mcp": {
    "enabled": true,
    "port": 3002,
    "serverName": "echoctl-mcp"
  }
}
```

### Use Echoctl Tools in Claude Code

```bash
# In Claude Code, add Echoctl as MCP server
claude config add-mcp-server \
  --name echoctl \
  --url http://localhost:3002 \
  --type stdio
```

Now all Echoctl tools are available in Claude Code!

### Example: Using GitHub Plugin in Claude

```
@claude: Use the echoctl GitHub plugin to list repositories for "Chieji"
```

Claude will automatically:
1. Discover the `github:listRepos` tool via MCP
2. Call it with the appropriate arguments
3. Display results in the conversation

---

## CLI Synchronization

### Supported CLIs

| CLI | Status | Auto-Sync |
|---|---|---|
| **Gemini CLI** | ✅ Supported | Yes |
| **Qwen** | ✅ Supported | Yes |
| **Claude Code** | ✅ Supported | Yes |
| **OpenAI CLI** | ✅ Supported | Yes |

### How It Works

1. Echoctl detects installed CLI tools
2. Automatically syncs available tools/skills
3. Converts them to Echoctl plugins
4. Enables cross-platform execution

### Enable CLI Sync

```bash
# Auto-detect and sync all CLIs
echoctl sync-cli --auto

# Or sync specific CLI
echoctl sync-cli gemini
echoctl sync-cli qwen

# Setup auto-sync (every 60 minutes)
echoctl sync-cli --auto-sync --interval 60
```

### Configuration

Edit `~/.echo/config.json`:

```json
{
  "cliSync": {
    "enabled": true,
    "autoSync": true,
    "syncInterval": 60,
    "clis": {
      "gemini": { "enabled": true },
      "qwen": { "enabled": true },
      "claude": { "enabled": true }
    }
  }
}
```

### Example: Using Gemini Tools in Echoctl

```bash
# After syncing Gemini CLI
echoctl list-tools --source gemini

# Output:
# gemini:analyze-image
# gemini:generate-text
# gemini:code-review
# ...

# Execute a synced tool
echoctl exec gemini:analyze-image --image-path ./photo.jpg
```

---

## Universal Skill Registry

### What is the Universal Skill Registry?

A centralized hub for discovering, sharing, and synchronizing skills across all supported platforms.

### Features

- **Centralized Discovery**: Find skills from all platforms in one place
- **Cross-Platform Sharing**: Share skills between Echoctl, Gemini, Qwen, and Claude
- **Automatic Sync**: Keep your skills synchronized across devices
- **Community Contributions**: Contribute and discover community-created skills

### Registries

Echoctl connects to multiple registries:

| Registry | Type | URL |
|---|---|---|
| **Echoctl Official** | Official | https://registry.echoctl.dev |
| **MCP Registry** | Community | https://registry.modelcontextprotocol.io |
| **Community Skills** | Community | https://community.echoctl.dev/skills |

### Commands

```bash
# List all available skills
echoctl skill list

# Search skills
echoctl skill search --tag "github"
echoctl skill search --name "api"
echoctl skill search --source "gemini"

# Get skill details
echoctl skill info github-plugin

# Install a skill
echoctl skill install github-plugin

# Share your skill
echoctl skill share my-plugin --registry echoctl-official

# Create a skill collection
echoctl skill collection create "Web Development" \
  --skills github-plugin,http-plugin,slack-plugin

# Get recommendations
echoctl skill recommend --installed github-plugin,slack-plugin
```

### Skill Metadata

Each skill includes:

```json
{
  "id": "github-plugin",
  "name": "GitHub Plugin",
  "version": "1.0.0",
  "description": "GitHub repository management",
  "author": "Manus AI",
  "license": "MIT",
  "tags": ["github", "vcs", "automation"],
  "source": "echoctl",
  "tools": {
    "listRepos": { ... },
    "createIssue": { ... }
  },
  "dependencies": [],
  "metadata": {
    "registryId": "echoctl-official",
    "downloads": 1234,
    "rating": 4.8
  }
}
```

---

## Setup Instructions

### Prerequisites

- Echoctl 1.0+
- Node.js 18+
- Optional: Gemini CLI, Qwen, Claude Code

### Step 1: Enable All Bridges

```bash
# Edit ~/.echo/config.json
{
  "bridges": {
    "mcp": { "enabled": true, "port": 3002 },
    "cliSync": { "enabled": true, "autoSync": true },
    "skillRegistry": { "enabled": true }
  }
}
```

### Step 2: Start Echoctl

```bash
echoctl start
```

You should see:

```
✓ MCP Bridge initialized on port 3002
✓ CLI Sync Bridge initialized
✓ Universal Skill Registry initialized
✓ Syncing Gemini CLI...
✓ Syncing Qwen...
✓ All bridges ready!
```

### Step 3: Verify Integration

```bash
# Check MCP server
echoctl mcp status

# Check synced CLIs
echoctl sync-cli status

# Check skill registry
echoctl skill registry status
```

---

## Examples

### Example 1: GitHub Workflow Across Platforms

**In Claude Code:**
```
@claude: Using Echoctl's GitHub plugin, create an issue in the Echoctl repository
```

**In Gemini CLI:**
```
gemini create-github-issue --repo Echoctl --title "New Feature"
```

**In Echoctl:**
```bash
echoctl exec github:createIssue --owner Chieji --repo Echoctl --title "New Feature"
```

### Example 2: Multi-Platform Automation

```bash
# 1. Fetch data from Gemini
echoctl exec gemini:analyze-code --file main.ts

# 2. Process with Echoctl HTTP plugin
echoctl exec http:post --url https://api.example.com --data "..."

# 3. Send results to Slack
echoctl exec slack:sendMessage --channel "#updates" --text "..."

# 4. Log to GitHub
echoctl exec github:createIssue --title "Analysis Complete"
```

### Example 3: Sharing Custom Skill

```bash
# Create custom skill
mkdir my-skill
cd my-skill
npm init -y
npm install echoctl

# Implement skill
cat > index.ts << 'EOF'
export const mySkill = {
  name: 'my-skill',
  tools: { /* ... */ }
};
EOF

# Build
npm run build

# Share to community registry
echoctl skill share . --registry community-skills

# Now others can install it
echoctl skill install my-skill
```

---

## Troubleshooting

### MCP Server Not Starting

```bash
# Check if port 3002 is available
lsof -i :3002

# Change port in config
{
  "mcp": { "port": 3003 }
}

# Restart
echoctl restart
```

### CLI Sync Not Finding Tools

```bash
# Verify CLI is installed
which gemini
which qwen

# Check if CLI is in PATH
echo $PATH

# Manually sync
echoctl sync-cli gemini --verbose
```

### Skill Registry Connection Failed

```bash
# Check internet connection
ping registry.echoctl.dev

# Check firewall
# Ensure port 443 is open for HTTPS

# Retry sync
echoctl skill registry sync --force
```

### MCP Tools Not Appearing in Claude

```bash
# Verify MCP server is running
echoctl mcp status

# Check Claude MCP configuration
claude config list-mcp-servers

# Re-add Echoctl MCP server
claude config remove-mcp-server echoctl
claude config add-mcp-server \
  --name echoctl \
  --url http://localhost:3002
```

---

## Advanced Configuration

### Custom MCP Server

```typescript
// custom-mcp-server.ts
import { mcpBridge } from 'echoctl';

// Register custom tools
mcpBridge.registerTool({
  name: 'my-tool',
  description: 'My custom tool',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  }
});

// Start server
mcpBridge.startServer({ port: 3002 });
```

### Custom Skill Registry

```typescript
import { universalSkillRegistry } from 'echoctl';

// Register custom registry
universalSkillRegistry.registerRegistry({
  id: 'my-registry',
  name: 'My Skills',
  url: 'https://my-registry.example.com',
  type: 'remote'
});

// Sync from custom registry
universalSkillRegistry.syncRegistry('my-registry');
```

---

## Best Practices

1. **Regular Sync**: Keep CLI tools synchronized regularly
2. **Version Management**: Use semantic versioning for skills
3. **Documentation**: Document all custom tools and skills
4. **Testing**: Test skills across platforms before sharing
5. **Security**: Never share skills with embedded credentials

---

## Support

- **GitHub Issues**: [Report bugs](https://github.com/Chieji/Echoctl/issues)
- **Discussions**: [Ask questions](https://github.com/Chieji/Echoctl/discussions)
- **Email**: support@echoctl.dev

---

**Happy cross-platform automation! 🚀**
