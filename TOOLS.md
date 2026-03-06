# TOOLS.md - Echo's Capabilities

## Core Tools

Echo can execute these tools autonomously in Agent Mode.

---

## `run_command`

Execute a shell command on the local system.

**Parameters:**
- `command` (string) - The command to execute
- `timeout` (number, optional) - Timeout in ms (default: 30000)
- `cwd` (string, optional) - Working directory

**Example:**
```bash
echo chat "Count lines in all .ts files" --agent
# Executes: find . -name "*.ts" | xargs wc -l
```

**Safety:**
- Blocked: `rm -rf /`, `rm -rf *`, fork bombs, etc.
- Requires confirmation (unless --yolo)
- 30s default timeout
- 10MB max output

---

## `readFile`

Read contents of a file.

**Parameters:**
- `filePath` (string) - Path to the file

**Example:**
```bash
echo chat "Read package.json" --agent
```

**Safety:**
- No confirmation required
- Cannot read outside workspace without permission
- Max 1MB file size

---

## `writeFile`

Write content to a file.

**Parameters:**
- `filePath` (string) - Path to the file
- `content` (string) - Content to write

**Example:**
```bash
echo chat "Create a README.md with project description" --agent
```

**Safety:**
- Requires confirmation
- Creates parent directories automatically
- Backs up existing files

---

## `listFiles`

List files in a directory.

**Parameters:**
- `dirPath` (string, optional) - Directory path (default: ".")

**Example:**
```bash
echo chat "What files are in src/?" --agent
```

**Output:**
```
file       1234 package.json
dir           0 src
file       5678 tsconfig.json
```

---

## `deleteFile`

Delete a file or directory.

**Parameters:**
- `filePath` (string) - Path to delete
- `recursive` (boolean, optional) - Delete recursively (default: false)

**Example:**
```bash
echo chat "Delete the temp directory" --agent
```

**Safety:**
- Requires confirmation
- Cannot delete protected directories
- Use with extreme caution

---

## `executePython`

Execute Python code.

**Parameters:**
- `code` (string) - Python code to execute

**Example:**
```bash
echo chat "Calculate the sum of primes under 1000" --agent
```

**Safety:**
- Requires confirmation
- Runs in isolated temp file
- Auto-cleanup after execution
- 30s timeout

---

## `executeNode`

Execute Node.js code.

**Parameters:**
- `code` (string) - JavaScript/TypeScript code

**Example:**
```bash
echo chat "Parse this JSON and format it" --agent
```

**Safety:**
- Requires confirmation
- Runs in isolated temp file
- Auto-cleanup after execution
- 30s timeout

---

## Tool Execution Flow

```
User Request
    ↓
Echo Reasons (ReAct)
    ↓
Selects Tool
    ↓
Confirmation? ──No──→ Execute
    │                   ↓
   Yes              Show Result
    │                   ↓
User Confirms ──────────┘
```

---

## LSP Tools (Advanced)

For code refactoring across codebases.

### `findSymbolReferences`

Find all usages of a symbol.

**Parameters:**
- `symbolName` (string) - Symbol to find
- `cwd` (string, optional) - Working directory

**Example:**
```bash
echo chat "Find all references to UserService" --agent
```

---

### `renameSymbol`

Rename a symbol across all files.

**Parameters:**
- `oldName` (string) - Current name
- `newName` (string) - New name
- `cwd` (string, optional) - Working directory

**Example:**
```bash
echo chat "Rename getUser to fetchUser everywhere" --agent
```

**Safety:**
- Requires confirmation
- Shows files to be changed
- Can be undone with git

---

### `findSymbolDefinition`

Find where a symbol is defined.

**Parameters:**
- `symbolName` (string) - Symbol to find

**Example:**
```bash
echo chat "Where is authenticateUser defined?" --agent
```

---

## MCP Tools (Plugin System)

Echo can extend capabilities via MCP servers.

### Install MCP Skill
```bash
echo mcp install @echo/github
```

### Available MCP Servers
- `github` - GitHub API integration
- `filesystem` - Enhanced file operations
- `web-search` - Web search capabilities
- Custom servers via URL

---

## Tool Selection Logic

Echo chooses tools based on:

1. **Task Type**
   - Analysis → `readFile`, `listFiles`
   - Creation → `writeFile`, `run_command`
   - Modification → `readFile` + `writeFile`
   - Deletion → `deleteFile`
   - Calculation → `executePython`, `executeNode`

2. **Safety Level**
   - Read-only → No confirmation
   - Write operations → Confirmation required
   - Destructive → Strong warning + confirmation

3. **Efficiency**
   - Prefers native commands over scripts
   - Batches operations when possible
   - Caches results for repeated queries

---

## Best Practices

### For Echo
1. Read before writing
2. Show diff before modifying
3. Test commands before running
4. Backup before deleting
5. Explain what you're doing

### For Users
1. Use `--agent` for tool execution
2. Review confirmation prompts
3. Start with read-only tasks
4. Use `--yolo` only when trusted
5. Check git status after changes

---

_Tools are extensions of intent. Use them wisely._
