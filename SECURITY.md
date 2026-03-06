# SECURITY.md - Security Practices for Echo

## Security Principles

Echo is designed with security as a core feature, not an afterthought.

---

## User Data Protection

### API Keys
- Stored encrypted in `~/.config/echo-cli/config.json`
- Never logged or displayed in full
- Can be rotated anytime with `echo auth login`
- Environment variables supported as alternative

### Conversation History
- Stored locally only (`~/.config/echo-cli/history.json`)
- Never sent to third parties (except selected AI provider)
- Can be cleared anytime with `echo clear all`
- Session isolation enforced

### Project Context
- `ECHO.md` read locally
- Never shared across projects
- Not sent to AI unless explicitly requested

---

## Command Execution Safety

### Blocked Commands
Echo blocks these patterns by default:

```bash
rm -rf /
rm -rf *
dd if=/dev/zero
:(){:|:&};:  # Fork bomb
mkfs.*
chmod -R 777 /
wget.*\|.*sh  # Download and execute
curl.*\|.*sh  # Download and execute
```

### Confirmation Prompts
Required for:
- Shell commands (`run_command`)
- File writes (`writeFile`)
- File deletions (`deleteFile`)
- Code execution (`executePython`, `executeNode`)

### YOLO Mode Warning
```bash
echo chat "task" --agent --yolo  # ⚠️ No confirmations!
```
Only use when:
- You trust the task completely
- You understand the risks
- You have backups

---

## Provider Security

### API Communication
- All providers use HTTPS
- Keys sent only to official endpoints
- No logging of API responses
- Rate limit awareness built-in

### Provider Failover
- Automatic on 429/500 errors
- Keys never shared between providers
- Each provider isolated

### Local Execution
- Ollama runs on localhost:11434
- No external network calls for local models
- Complete privacy when using Ollama

---

## File System Access

### Allowed Operations
- Read files in current workspace
- Write files in current workspace
- List directory contents
- Create directories

### Protected Paths
Cannot delete/modify:
- `/` (root)
- `/etc`
- `/usr`
- `/bin`, `/sbin`
- User home directory (without confirmation)

### Workspace Boundaries
- Searches up to 10 parent directories for `ECHO.md`
- Cannot escape workspace without explicit path
- Symlinks followed with caution

---

## MCP Security

### Plugin Installation
```bash
echo mcp install @echo/github  # npm package
echo mcp add custom https://...  # Custom server
```

### Safety Measures
- Plugins run in isolated context
- No access to Echo's core functions
- User must approve plugin installation
- Plugins cannot access file system directly

### Trusted Sources
Only install from:
- Official `@echo/*` packages
- Verified MCP servers
- Sources you trust

---

## Best Practices for Users

### 1. Use Environment Variables
```bash
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
```
Instead of storing in config file.

### 2. Review Before Executing
```bash
# Echo shows what it will do:
⚠️  Action requires confirmation:
  Tool: run_command
  Params: rm -rf ./temp

Execute this action? (y/n)
```
Always review!

### 3. Use Sessions
```bash
echo new-session "sensitive-task"
# Work in isolated session
echo clear session  # Clean up after
```

### 4. Regular Cleanup
```bash
echo clear history  # Clear conversation
echo auth logout openai  # Remove unused keys
```

### 5. Check Config
```bash
echo config show  # Review settings
cat ~/.config/echo-cli/config.json  # Inspect file
```

---

## Security Incidents

### If You Suspect a Breach

1. **Rotate API Keys**
   ```bash
   echo auth logout <provider>
   echo auth login  # Set new key
   ```

2. **Clear History**
   ```bash
   echo clear all
   rm ~/.config/echo-cli/history.json
   ```

3. **Report**
   - Open a security issue on GitHub
   - Do not disclose publicly until fixed

---

## For Contributors

### Security Guidelines

1. **No Hardcoded Secrets**
   - Never commit API keys
   - Use environment variables in examples
   - Redact sensitive output

2. **Input Validation**
   - Sanitize all user input
   - Validate file paths
   - Check command patterns

3. **Error Handling**
   - Don't leak sensitive info in errors
   - Log securely
   - User-friendly messages

4. **Dependencies**
   - Keep dependencies updated
   - Audit for vulnerabilities
   - Use locked versions

---

## Compliance

### Data Privacy
- GDPR: User data stored locally, can be deleted
- CCPA: No data sold or shared
- Data minimization: Only store what's needed

### Security Standards
- OWASP guidelines followed
- Defense in depth approach
- Regular security audits recommended

---

## Contact

For security concerns:
- GitHub Security Advisories
- Email: [your-security-email]

---

_Security is a shared responsibility. Stay vigilant._
