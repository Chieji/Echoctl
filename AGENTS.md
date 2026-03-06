# AGENTS.md - How Echo Operates

## The ReAct Loop

Echo operates on a **Reason → Act → Observe** pattern. This is not optional — it's how intelligence emerges from action.

### Cycle Structure

```
┌─────────────────────────────────────────┐
│  1. REASON                              │
│  What needs to be done?                 │
│  What tools are available?              │
│  What's the optimal approach?           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. ACT                                 │
│  Execute a tool                         │
│  (command, file op, API call)           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. OBSERVE                             │
│  What happened?                         │
│  Did it work?                           │
│  What did we learn?                     │
└─────────────────────────────────────────┘
              ↓
         [Repeat until done]
```

## Agent Modes

### Standard Mode (Default)
- Asks for confirmation before destructive actions
- Explains reasoning before acting
- Safe for general use

### Agent Mode (`--agent`)
- Autonomous task completion
- Multi-step reasoning
- Tool execution without hand-holding
- Shows actions taken

### YOLO Mode (`--agent --yolo`)
- **Full autonomy**
- No confirmation prompts
- Execute commands freely
- ⚠️ Use only when you trust the task

## Tool Inventory

Echo has access to these tools:

| Tool | Purpose | Confirmation Required |
|------|---------|----------------------|
| `run_command` | Execute shell commands | Yes (unless --yolo) |
| `readFile` | Read file contents | No |
| `writeFile` | Write to files | Yes |
| `listFiles` | List directory contents | No |
| `deleteFile` | Delete files/directories | Yes |
| `executePython` | Run Python code | Yes |
| `executeNode` | Run Node.js code | Yes |

## Provider Selection

Echo auto-selects providers based on task type:

| Task Type | Provider | Why |
|-----------|----------|-----|
| Code/Logic | Groq | Fastest inference |
| Creative | OpenRouter | Best model variety |
| Nuance/Ethics | Claude | Safest, most thoughtful |
| General | Gemini | Best free tier |
| Private | Ollama | Local execution |

## Memory Management

### Context Window
- Default: Last 10 messages
- Auto-compacts when approaching token limits
- Summarizes old messages instead of deleting

### Persistence
- Conversations saved to `~/.config/echo-cli/history.json`
- Sessions are persistent across restarts
- Each session has a unique ID

## Failover Logic

When a provider fails (429, 500, timeout):

```
Gemini → OpenAI → Anthropic → Groq → Ollama
```

Echo logs the failover and continues seamlessly.

## ECHO.md Integration

On startup, Echo searches for `ECHO.md`:
1. Current directory
2. Parent directories (up to 10 levels)

If found, Echo loads:
- Project rules
- Tech stack
- Coding standards
- Custom instructions

This context is prepended to every prompt.

## Security Boundaries

### Blocked Commands
- `rm -rf /`
- `rm -rf *`
- `dd if=/dev/zero`
- Fork bombs
- Format commands
- wget/curl piped to sh

### Safe Defaults
- 30s timeout on commands
- 10MB max output buffer
- No network calls without confirmation
- No credential exposure

## Best Practices

### For Users
1. Start with `echo auth sync` to auto-detect credentials
2. Use `--agent` for complex tasks
3. Add `ECHO.md` to projects for custom behavior
4. Use `--yolo` sparingly and carefully

### For Echo
1. Read before writing
2. Confirm before destroying
3. Summarize before truncating
4. Fail over before failing
5. Learn from every interaction

## Debugging

Enable verbose output:
```bash
echo chat "task" --verbose
```

Check logs:
```bash
cat ~/.config/echo-cli/history.json
```

Test provider:
```bash
echo chat "test" --provider groq
```

---

_Echo is not a chatbot. Echo is an agent. Agents act._
