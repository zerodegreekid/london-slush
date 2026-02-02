# 📤 Upload dist/ Files to Cloudflare Pages Dashboard

## Step-by-Step Instructions

### 1. Click on the london-slush Pages Project
From your current screenshot:
- Click on **"london-slush"** (the first one)
- Make sure it shows: `london-slush.pages.dev + 2 other domains`
- This will open the project details page

### 2. Look for the "Create deployment" Button
On the project details page, you should see:
- **Blue button** in the top-right: **"Create deployment"** or **"Upload assets"**
- Click this button

### 3. Choose "Direct Upload" Tab
After clicking, you'll see upload options:
- Select **"Direct upload"** or **"Upload assets"** tab
- This allows you to drag & drop files

### 4. Upload ALL Files from dist/
**CRITICAL**: Upload the CONTENTS of dist/, not the dist/ folder itself

Files to upload (from your local dist/ folder):
```
✅ _worker.js (157 KB) ← Most important!
✅ _routes.json (1 KB)
✅ static/ (entire folder)
✅ All images (.jpg files)
✅ hero-video.mp4 (8.7 MB)
✅ logo files (.png, .psd)
✅ robots.txt
✅ sitemap.xml
```

### 5. Configure Deployment Settings
- **Production branch**: `main`
- **Build command**: Leave EMPTY
- **Build output directory**: Leave EMPTY

### 6. Click "Save and Deploy"
- Wait 30-60 seconds
- Status should show: **"Success"**
- You'll get a URL like: `https://abc123.london-slush.pages.dev`

### 7. After Deployment
Reply with: **"Deployed, test now"**

I'll verify:
1. ✅ Worker integration is live
2. ✅ Google Sheets sync is working
3. ✅ Form submissions captured

---

## Visual Guide

**Your current screen** → Click **"london-slush"** (Pages project)
↓
**Project details page** → Look for **"Create deployment"** button (top-right)
↓
**Upload modal** → Select **"Direct upload"** tab
↓
**Drag & drop area** → Upload ALL files from your local dist/ folder
↓
**Configure** → Set branch to `main`, leave build settings empty
↓
**Deploy** → Click "Save and Deploy"
↓
**Success!** → Tell me "Deployed, test now"

---

## Quick Links
- **Current screen**: Workers & Pages overview
- **Target project**: london-slush (Pages) - `london-slush.pages.dev`
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit
- **Live site**: https://londonslush.com

---

## Need Help?
- **"Clicked, what's next?"** → Send screenshot of next page
- **"Can't find button"** → Send screenshot after clicking project
- **"Want CLI instead"** → I'll guide you through terminal deployment
