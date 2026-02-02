# 📤 How to Upload via Settings Tab

## From Your Current Screen

You're on: **Workers & Pages / london-slush / Deployments**

### Option 1: Check the Settings Tab
1. Click **"Settings"** tab (at the top, next to "Custom domains")
2. Scroll down to find:
   - **"Build settings"** section
   - Or **"Source"** section
   - Or **"Direct upload"** toggle/option
3. Look for:
   - **"Switch to Direct Upload"** button
   - **"Upload assets"** option
   - **"Manual deployment"** settings

### Option 2: Three-Dot Menu (Right Side)
In the "All deployments" section, I can see a three-dot menu (**...**) on the right side.
1. Click the **three dots (...)** next to "View details"
2. Look for options like:
   - **"Upload new version"**
   - **"Create deployment"**
   - **"Direct upload"**

### Option 3: Wrangler CLI (FASTEST - 2 minutes)
Since Cloudflare's dashboard doesn't always show the upload button clearly, use the CLI:

**From your local machine** (where you have the dist/ folder):

```bash
# 1. Open Command Prompt or Terminal
# Windows: Win+R → type "cmd" → Enter
# Mac: Cmd+Space → type "terminal" → Enter

# 2. Navigate to your dist/ folder
cd path\to\your\dist
# Example: cd C:\Users\YourName\Downloads\dist

# 3. Login to Cloudflare (first time only)
npx wrangler login
# This opens a browser - click "Allow"

# 4. Deploy directly
npx wrangler pages deploy . --project-name=london-slush --branch=main

# 5. Done! Wait 1-2 minutes, then tell me "Deployed, test now"
```

---

## Why CLI is Better Here

The Cloudflare dashboard sometimes hides the direct upload option when:
- Automatic deployments are enabled from GitHub
- The project was initially created via GitHub integration
- You're viewing the default "Deployments" tab

**Using Wrangler CLI bypasses all these UI limitations** and deploys directly.

---

## What to Do Next

**Choose one:**

1. **"Check Settings tab"** → Click Settings, send screenshot
2. **"Found three-dot menu"** → Click ..., send screenshot  
3. **"Use CLI"** → I'll guide you step-by-step through the commands
4. **"Need CLI setup help"** → I'll help install Node.js/Wrangler

**My Recommendation**: Use **Option 3 (CLI)** - it's the fastest and most reliable way (about 2 minutes total).

---

## Quick Reference

- **Current commit**: 3cfb81f (28 minutes ago)
- **Commit message**: "Clear build cache - force fresh deployment with Google Sheets integration"
- **Production URL**: https://londonslush.com
- **Pages URL**: https://london-slush.pages.dev
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit

---

## Files You Need to Upload (via CLI)

From your local dist/ folder:
```
✅ _worker.js (157 KB) ← Google Sheets integration
✅ _routes.json (1 KB)
✅ static/style.css
✅ All images (.jpg)
✅ hero-video.mp4 (8.7 MB)
✅ logo files
✅ robots.txt
✅ sitemap.xml
```
