# 🔒 GitHub Token Setup for Echo CLI Publishing

## Step 1: Delete Exposed Token

**IMMEDIATE ACTION REQUIRED:**

1. Go to https://github.com/settings/tokens
2. Find the token that starts with `github_pat_11BRUK3RI0...`
3. Click "Delete"
4. Confirm deletion

## Step 2: Create New Token

1. Go to https://github.com/settings/tokens/new
2. **Note:** `Echo CLI Publishing`
3. **Expiration:** Choose your preference (recommend 90 days)
4. **Select scopes:**
   - ✅ `read:packages` - Download packages
   - ✅ `write:packages` - Upload packages
   - ✅ `repo` - Full control of private repositories (if using private repo)

5. Click "Generate token"
6. **Copy the token immediately** (you can't see it again!)

## Step 3: Set Environment Variable

**Temporary (current session only):**
```bash
export GITHUB_TOKEN="github_pat_YOUR_NEW_TOKEN_HERE"
```

**Permanent (add to shell config):**

For bash:
```bash
echo 'export GITHUB_TOKEN="github_pat_YOUR_NEW_TOKEN_HERE"' >> ~/.bashrc
source ~/.bashrc
```

For zsh:
```bash
echo 'export GITHUB_TOKEN="github_pat_YOUR_NEW_TOKEN_HERE"' >> ~/.zshrc
source ~/.zshrc
```

## Step 4: Verify Setup

```bash
# Check token is set
echo $GITHUB_TOKEN

# Should show: github_pat_... (not empty!)

# Test npm config
npm config get @chieji:registry
# Should show: https://npm.pkg.github.com
```

## Step 5: Publish to GitHub Packages

```bash
cd /home/kali/echoctl

# Build the project
npm run build

# Publish
npm publish

# If you get 401/403, check your token:
npm config get //npm.pkg.github.com/:_authToken
```

## Step 6: Install from GitHub Packages

```bash
# Configure npm to use GitHub Packages
npm config set @chieji:registry https://npm.pkg.github.com

# Install
npm install -g @chieji/echo-ai-cli

# Test
echoctl --help
```

## 🔒 Security Best Practices

1. **Never commit tokens** - `.npmrc` is in `.gitignore` ✅
2. **Use environment variables** - Token from env var ✅
3. **Rotate tokens regularly** - Set a reminder!
4. **Use minimum scopes** - Only `read:packages` and `write:packages` ✅

## 📝 Notes

- Package will be published to: https://github.com/users/chieji/packages/npm/package/echo-ai-cli
- Package name: `@chieji/echo-ai-cli`
- Registry: https://npm.pkg.github.com

## Troubleshooting

**401 Unauthorized:**
```bash
# Token is wrong or expired
export GITHUB_TOKEN="your_new_token"
```

**403 Forbidden:**
```bash
# Token doesn't have write:packages scope
# Create new token with correct scopes
```

**404 Not Found:**
```bash
# Package doesn't exist yet (first publish)
# Or wrong scope on token
npm publish
```

---

**Ready to publish? Follow steps 1-5 above!** 🚀
