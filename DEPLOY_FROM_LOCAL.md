# 🚀 Deploy London Slush from Your Local Machine

## Prerequisites
- You have the `dist/` folder on your local computer
- Node.js installed on your machine

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt
- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Mac**: Press `Cmd + Space`, type `terminal`, press Enter

### 2. Navigate to Your dist/ Folder
```bash
cd path/to/your/dist/folder
# Example Windows: cd C:\Users\YourName\Downloads\dist
# Example Mac: cd ~/Downloads/dist
```

### 3. Install Wrangler (if not installed)
```bash
npm install -g wrangler
```

### 4. Login to Cloudflare
```bash
npx wrangler login
```
This will open a browser window. Click "Allow" to authenticate.

### 5. Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy . --project-name=london-slush --branch=main
```

### 6. Wait for Deployment
- Deployment takes about 1-2 minutes
- You'll see a URL like: `https://abc123.london-slush.pages.dev`

### 7. Verify Deployment
After deployment completes, tell me: **"Deployed, test now"**

I'll verify:
1. ✅ Worker integration is live
2. ✅ Google Sheets sync is working
3. ✅ Form submissions are captured

---

## Troubleshooting

### If "wrangler login" fails:
Use API token instead:
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Create a token with **Cloudflare Pages - Edit** permission
3. Set environment variable:
   ```bash
   # Windows
   set CLOUDFLARE_API_TOKEN=your-token-here
   
   # Mac/Linux
   export CLOUDFLARE_API_TOKEN=your-token-here
   ```
4. Run deploy command again

### If deploy fails with "project not found":
The project name might be different. Try:
```bash
npx wrangler pages project list
```
Then use the exact project name from the list.

---

## Expected Timeline
- Installation: ~30 seconds
- Login: ~10 seconds
- Deploy: ~90 seconds
- Verification: ~60 seconds
- **Total: ~3 minutes** ⏱️

---

## What This Fixes
- ✅ Form submissions auto-sync to Google Sheets
- ✅ Real-time lead capture
- ✅ Email notifications active
- ✅ Both retail and distributor forms working

---

## Quick Links
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit
- **Your Site**: https://londonslush.com

---

## Need Help?
Reply with:
- **"Starting local deploy"** → I'll guide you through each step
- **"Login failing"** → I'll help with authentication
- **"Command not found"** → I'll help install Node.js/Wrangler
- **"Found upload button"** → I'll guide you through dashboard upload
