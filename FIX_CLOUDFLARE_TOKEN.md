# 🔧 Fix Cloudflare API Token Permissions

## Issue
Your current Cloudflare API token doesn't have sufficient permissions to create/deploy Pages projects.

**Error:** `Authentication error [code: 10000]`

---

## ✅ Solution: Update API Token Permissions

### Step 1: Go to Cloudflare API Tokens Page

1. **Visit:** https://dash.cloudflare.com/profile/api-tokens
2. **Log in** with: bijnorservices@gmail.com

### Step 2: Edit Your Existing Token (or Create New)

#### Option A: Edit Existing Token

1. Find your current API token in the list
2. Click **"Edit"** button
3. Update permissions as shown below

#### Option B: Create New Token (RECOMMENDED)

1. Click **"Create Token"** button
2. Click **"Use template"** next to **"Edit Cloudflare Workers"**
3. Or click **"Create Custom Token"**

### Step 3: Set Required Permissions

Your token needs these permissions:

#### **Account Permissions:**
```
Account Settings: Read
Cloudflare Pages: Edit
```

#### **Zone Permissions:**
```
Zone Settings: Read
DNS: Edit (optional, for custom domains)
```

#### **Specific Configuration:**
```
Account: Bijnor Services Account (51ed45e6432a02c7b33e76aa6b3d1d5f)
Zone Resources: All zones (or specific zone if you prefer)
Client IP Address Filtering: [Leave empty]
TTL: Forever (or set expiry as preferred)
```

### Step 4: Copy the New Token

1. Click **"Continue to summary"**
2. Click **"Create Token"**
3. **COPY THE TOKEN** (you'll only see it once!)
4. Save it securely

---

## 🔄 Update Token in Sandbox

Once you have the new token, come back and tell me. I'll help you update it with:

```bash
# I'll run this command with your new token
export CLOUDFLARE_API_TOKEN="your-new-token-here"
echo "export CLOUDFLARE_API_TOKEN='your-new-token-here'" >> ~/.bashrc
```

---

## 🎯 Alternative: Use Cloudflare Dashboard (No CLI)

If you prefer, you can deploy directly via the Cloudflare Dashboard:

### Step 1: Create Pages Project in Dashboard

1. Go to: https://dash.cloudflare.com/
2. Select your account: **Bijnor Services Account**
3. Click **"Workers & Pages"** in sidebar
4. Click **"Create application"**
5. Click **"Pages"** tab
6. Click **"Upload assets"**

### Step 2: Upload Your Build

1. **Project name:** `london-slush`
2. **Production branch:** `main`
3. Click **"Select from computer"**
4. Navigate to `/home/user/webapp/dist/`
5. Select ALL files in dist directory
6. Click **"Deploy site"**

### Step 3: Wait for Deployment

- ⏱️ Upload time: 2-5 minutes (8.6 MB video)
- You'll get a URL: `https://random-id.london-slush.pages.dev`

---

## 📦 What to Upload

Make sure you upload ALL files from `/home/user/webapp/dist/`:

```
_routes.json          (151 bytes)
_worker.js            (111 KB)
hero-video.mp4        (8.6 MB)
logo.svg              (208 KB)
logo.psd              (844 KB)
dance-with-slush.jpg  (60 KB)
fabulous-juicy-slush.jpg (120 KB)
fusion-raspberry-green.jpg (90 KB)
icy-coca.jpg          (90 KB)
promo-video.mp4       (6.3 MB)
rainbow-slush.jpg     (25 KB)
slush-blue-drinks.jpg (113 KB)
slush-pink-drink.jpg  (64 KB)
slush-pink-grape.jpg  (66 KB)
slush-varieties.jpg   (53 KB)
```

**Total size:** ~16 MB

---

## ✅ After Deployment

Once deployed (via CLI or Dashboard), you'll get:

- **Production URL:** `https://london-slush.pages.dev`
- **Deploy ID URL:** `https://[random-id].london-slush.pages.dev`

Test these URLs:
- ✅ Homepage: `https://london-slush.pages.dev`
- ✅ Retail: `https://london-slush.pages.dev/retail`
- ✅ Distributor: `https://london-slush.pages.dev/distributor`
- ✅ Logo: `https://london-slush.pages.dev/logo.svg`
- ✅ Video: `https://london-slush.pages.dev/hero-video.mp4`

---

## 🌐 Connect Your Domain (After Deployment)

Follow the steps in `CLOUDFLARE_DEPLOYMENT_GUIDE.md` Part 2.

---

## 📞 Need Help?

Tell me which method you prefer:

1. **Method A:** Fix API token and deploy via CLI
2. **Method B:** Upload via Cloudflare Dashboard (simpler, no token issues)

I recommend **Method B** for the first deployment - it's simpler and avoids token issues!
