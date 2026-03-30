# Extension Registry Completion Plan

## Context
Echoctl ExtensionRegistry has been implemented with:
- Unified registry for MCP, plugins, skills, APIs
- Full CLI commands (add, remove, list, enable, disable, reload, auth, sync, search, info)
- MCP client integration that auto-registers MCP server tools
- In-memory storage (extensions disappear on restart)

## Remaining Tasks

### Task 1: Extension Persistence
**Goal:** Save extensions to config file so they persist across restarts

**Requirements:**
1. Create `~/.config/echo-cli/extensions.json` config file
2. Save extension metadata on add/enable/disable/remove
3. Load extensions on CLI startup
4. Support auth credentials (encrypted or separate secure storage)

**Files to modify:**
- `src/commands/extension.ts` - Add save/load functions
- `src/index.ts` - Load extensions on startup
- New: `src/storage/extensions.ts` - Persistence layer

**Test:**
```bash
echo extension add test-api https://api.example.com
# Restart CLI
echo extension list
# Should still show test-api
```

---

### Task 2: Claude Skill Importer
**Goal:** Import skills from Claude Desktop/Claude Code

**Requirements:**
1. Read Claude skill config from `~/.claude.json` or `~/.config/claude/skills.json`
2. Parse skill definitions
3. Convert to Extension format
4. Register in ExtensionRegistry

**Files to create:**
- `src/skills/claude-importer.ts` - Claude skill importer

**Test:**
```bash
echo extension sync --claude
# Should import Claude skills as extensions
```

---

### Task 3: Gemini Skill Importer
**Goal:** Import extensions from Gemini CLI

**Requirements:**
1. Read Gemini extensions from `~/.gemini/extensions.json` or similar
2. Parse extension definitions
3. Convert to Extension format
4. Register in ExtensionRegistry

**Files to create:**
- `src/skills/gemini-importer.ts` - Gemini extension importer

**Test:**
```bash
echo extension sync --gemini
# Should import Gemini extensions
```

---

## Acceptance Criteria

All tasks must:
1. ✅ Build without errors
2. ✅ Pass existing tests
3. ✅ Not break existing functionality
4. ✅ Include error handling
5. ✅ Use TypeScript types properly

## Execution Order

1. **Task 1** (Persistence) - Foundation for others
2. **Task 2** (Claude Importer) - Most popular AI assistant
3. **Task 3** (Gemini Importer) - Google AI ecosystem

Each task should be reviewed for:
- Spec compliance (does it meet requirements?)
- Code quality (clean, tested, typed?)
