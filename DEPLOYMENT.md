# DEPLOYMENT.md - Publishing Echo CLI

## Prerequisites

1. **NPM Account**
   - Create account at https://www.npmjs.com
   - Verify email

2. **Get NPM Token**
   - Go to Account Settings → Access Tokens
   - Create "Automation" token
   - Copy token (starts with `npm_`)

3. **GitHub Setup**
   - Add NPM token to GitHub Secrets
   - Go to repo Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` = your npm token

---

## Pre-Publish Checklist

### 1. Update Version
```bash
# In package.json, update version
"version": "1.0.0"  # Use semantic versioning
```

### 2. Test Locally
```bash
cd /home/kali/echoctl

# Clean build
rm -rf dist
npm run build

# Test all commands
node dist/index.js --help
node dist/index.js dashboard
node dist/index.js auth status
```

### 3. Update Documentation
- [ ] README.md has correct version
- [ ] CHANGELOG.md updated
- [ ] All features documented

---

## Publish to NPM

### Option A: Manual Publish

```bash
# 1. Login to NPM
npm login

# 2. Dry run (optional)
npm publish --dry-run

# 3. Publish
npm publish --access public

# 4. Verify
npm view echo-ai-cli
```

### Option B: GitHub Actions (Automatic)

When you create a GitHub Release:
1. Go to Releases → Create Release
2. Tag version: `v1.0.0`
3. CI/CD will automatically:
   - Build
   - Test
   - Publish to NPM
   - Create release assets

---

## Post-Publish

### 1. Verify Installation
```bash
# Install globally
npm install -g echo-ai-cli

# Test
echo --help
echo dashboard
```

### 2. Announce
- Twitter/X
- Reddit (r/commandline, r/typescript)
- Dev.to / Hashnode
- Product Hunt

---

## Update Workflow

### For Updates
```bash
# 1. Make changes
# 2. Update version in package.json
# 3. Update CHANGELOG.md
# 4. Commit and push
git add .
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main --tags

# 5. Create GitHub Release
# 6. NPM publish happens automatically
```

---

## Troubleshooting

### NPM Publish Fails

**"E403 Forbidden"**
- Check token permissions
- Ensure package name isn't taken

**"E400 Bad Request"**
- Check package.json format
- Ensure all required fields present

**Build Errors**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## Package Size Optimization

If package is too large:
1. Add `.npmignore`:
```
src/
tests/
.git/
.github/
*.md
!README.md
```

2. Update `files` in package.json:
```json
"files": [
  "dist",
  "README.md",
  "LICENSE"
]
```

---

## Success Metrics

After publishing, track:
- NPM downloads: `npm view echo-ai-cli downloads`
- GitHub stars
- Issues/PRs
- User feedback

---

_Ready to share Echo with the world! 🚀_
