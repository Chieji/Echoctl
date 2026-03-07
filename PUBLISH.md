# 🚀 Push to GitHub & Publish Guide

## Current Status
✅ All code committed locally
✅ Ready to push and publish

---

## Option 1: Push via HTTPS (Recommended)

```bash
cd /home/kali/echoctl

# Set remote URL to HTTPS
git remote set-url origin https://github.com/chieji/echoctl.git

# Push to GitHub
git push -u origin main

# When prompted, enter your GitHub credentials
# Username: 
# Password: Your GitHub Personal Access Token
```

### Get GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy the token
5. Use as password when pushing

---

## Option 2: Push via SSH

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "chieji4thson+github@gmail.com"

# Add to GitHub
# 1. Copy the key: cat ~/.ssh/id_ed25519.pub
# 2. Go to https://github.com/settings/keys
# 3. Click "New SSH key" and paste

# Set remote URL to SSH
git remote set-url origin git@github.com:chieji/echoctl.git

# Push
git push -u origin main
```

---

## After Pushing

### 1. Verify on GitHub
- Go to https://github.com/chieji/echoctl
- Check all files are there
- Verify CI/CD workflow is in `.github/workflows/`

### 2. Create NPM Account (if you don't have)
- Go to https://www.npmjs.com/signup
- Verify email

### 3. Get NPM Token
- Go to https://www.npmjs.com/settings/your-username/tokens
- Create "Automation" token
- Copy token (starts with `npm_...`)

### 4. Add NPM Token to GitHub Secrets
- Go to repo Settings → Secrets and variables → Actions
- New repository secret
- Name: `NPM_TOKEN`
- Value: `npm_xxxxx...`

### 5. Create GitHub Release
- Go to https://github.com/chieji/echoctl/releases
- Create release
- Tag: `v1.0.0`
- Title: "Echo CLI v1.0.0 - Initial Release"
- CI/CD will automatically publish to NPM!

---

## Manual NPM Publish (Alternative)

```bash
# Login to NPM
npm login

# Test publish (dry run)
npm publish --dry-run

# Actual publish
npm publish --access public

# Verify
npm view echo-ai-cli
```

---

## Verify Installation

```bash
# After publishing, test installation
npm install -g echo-ai-cli

# Test commands
echo --help
echo dashboard
echo auth status
```

---

## Checklist

- [ ] Push to GitHub
- [ ] Verify all files on GitHub
- [ ] Create NPM account
- [ ] Add NPM_TOKEN to GitHub secrets
- [ ] Create GitHub release v1.0.0
- [ ] Verify NPM publish
- [ ] Test global install
- [ ] Announce release!

---

_You're almost there! 🚀_
