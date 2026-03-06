# PLUGINS.md - Universal Plugin Sync

Echo supports importing plugins, skills, and extensions from **Claude Code**, **Gemini CLI**, **Qwen Code**, and other AI CLI platforms.

---

## Quick Start

```bash
# Sync all plugins from all platforms
echo plugin sync-all

# Sync from specific platform
echo plugin sync-from claude
echo plugin sync-from gemini
echo plugin sync-from qwen

# List installed plugins
echo plugin list
```

---

## Supported Platforms

### 🟦 Claude Code

**Location:** `~/.claude/`

**Imports:**
- Skills from `~/.claude/skills/`
- Plugins from `~/.claude/plugins/`
- MCP servers from `~/.claude/mcp.json`

**Example:**
```bash
# If you have Claude skills installed
echo plugin sync-from claude

# Output:
# ✓ Claude: Imported 3 skill(s)
```

---

### 🟩 Gemini CLI

**Location:** `~/.gemini/`

**Imports:**
- Extensions from `~/.gemini/extensions/`
- Config from `~/.gemini/config.json`
- MCP servers from `~/.gemini/mcp.json`

**Example:**
```bash
# If you have Gemini extensions
echo plugin sync-from gemini

# Output:
# ✓ Gemini: Imported 2 extension(s)
```

---

### 🟥 Qwen Code

**Location:** `~/.qwen/`

**Imports:**
- Extensions from `~/.qwen/<name>/qwen-extension.json`
- Skills from `~/.qwen/skill/`
- MCP servers from `~/.qwen/mcp.json`

**Example:**
```bash
# If you have Qwen plugins
echo plugin sync-from qwen

# Output:
# ✓ Qwen: Imported 5 plugin(s)
```

---

### 🟪 MCP Servers

**Locations:**
- `~/.claude/mcp.json`
- `~/.gemini/mcp.json`
- `~/.qwen/mcp.json`
- `~/.config/mcp.json`

**Example:**
```bash
# MCP servers are included in universal sync
echo plugin sync-all
```

---

## Plugin Commands

### Sync All
```bash
echo plugin sync-all
```
Scans all platforms and imports available plugins.

### Sync From Platform
```bash
echo plugin sync-from claude
echo plugin sync-from gemini
echo plugin sync-from qwen
```
Sync from a specific platform only.

### List Plugins
```bash
echo plugin list
```
Shows all installed plugins grouped by platform.

### Install from NPM
```bash
echo plugin install @echo/github
```
Install an Echo plugin from npm.

### Uninstall Plugin
```bash
echo plugin uninstall plugin-name
```
Remove a plugin.

### Enable/Disable
```bash
echo plugin enable plugin-name
echo plugin disable plugin-name
```
Toggle plugin without uninstalling.

---

## Plugin Storage

**Location:** `~/.config/echo-cli/plugins/`

**Files:**
- `index.json` - Plugin registry
- `<package>/` - Installed npm packages

---

## Compatibility

### What Gets Imported

| Platform | Skills | Extensions | MCP | Config |
|----------|--------|------------|-----|--------|
| Claude | ✓ | ✓ | ✓ | ✓ |
| Gemini | ✓ | ✓ | ✓ | ✓ |
| Qwen | ✓ | ✓ | ✓ | ✓ |
| MCP | - | - | ✓ | - |

### What Doesn't Transfer

- Platform-specific API keys (sync separately with `echo auth sync`)
- Proprietary features not supported by Echo
- Platform-specific UI themes

---

## Creating Echo Plugins

### Plugin Structure

```
my-plugin/
├── package.json
├── index.js
├── plugin.json
└── README.md
```

### plugin.json Format

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My Echo plugin",
  "platform": "echo",
  "tools": ["custom-tool"],
  "prompts": ["custom-prompt"],
  "config": {
    "apiKey": "optional-config"
  }
}
```

### Publishing

```bash
# Publish to npm
npm publish

# Users install with
echo plugin install your-plugin
```

---

## Troubleshooting

### "No plugins found"
- Make sure you're logged into the platform (Claude, Gemini, Qwen)
- Check that plugins are installed in the correct directory
- Run `echo plugin sync-all` to scan all platforms

### "Plugin failed to load"
- Check plugin is compatible with Echo
- Verify plugin.json format
- Check for missing dependencies

### "MCP server not connecting"
- Verify server URL is correct
- Check server is running
- Ensure network access is allowed

---

## Best Practices

1. **Sync Regularly** - Run `echo plugin sync-all` monthly to get updates
2. **Review Before Installing** - Check what will be imported
3. **Disable Unused** - Use `echo plugin disable` instead of uninstalling
4. **Backup Config** - Copy `~/.config/echo-cli/plugins/index.json`

---

## Security

### Plugin Safety

- Plugins run in isolated context
- Cannot access Echo core functions
- Require user approval to install
- No automatic execution

### Trusted Sources

Only install from:
- Official `@echo/*` packages
- Verified plugin developers
- Sources you trust

---

## Examples

### Full Sync Workflow

```bash
# 1. Sync all platforms
echo plugin sync-all

# 2. Review what was imported
echo plugin list

# 3. Disable unused
echo plugin disable old-skill

# 4. Install new plugin
echo plugin install @echo/github

# 5. Verify
echo plugin list
```

### Platform Migration

Moving from Claude to Echo:

```bash
# 1. Install Echo CLI
npm install -g echo-ai-cli

# 2. Sync Claude skills
echo plugin sync-from claude

# 3. Verify import
echo plugin list

# 4. Start using Echo
echo chat "Hello" --agent
```

---

_Plugin sync makes it easy to bring your skills from any platform to Echo._
