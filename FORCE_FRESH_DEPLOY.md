# 🔥 FORCE FRESH DEPLOYMENT - Clear Cloudflare Cache

## Current Issue
- Deployments are happening ✓
- But production serves OLD cached code ✗
- Google Sheets integration NOT working ✗

## Root Cause
**Cloudflare Pages aggressive caching** - Even after deployment, old `_worker.js` is cached at the CDN edge.

---

## 🎯 Solution: 3-Step Process

### STEP 1: Purge Cloudflare Cache (CRITICAL)

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select your domain**: Click on `londonslush.com`
3. **Navigate to Caching**:
   - Left sidebar → **Caching** → **Configuration**
4. **Purge Everything**:
   - Click **"Purge Everything"** button
   - Confirm the purge
   - Wait 10-15 seconds

### STEP 2: Deploy from Your Local dist/ Folder

**Open Command Prompt on your computer:**

```bash
# 1. Navigate to your dist/ folder
cd C:\path\to\your\dist
# Example: cd C:\Users\YourName\Downloads\dist

# 2. Login to Cloudflare (if not already)
npx wrangler login

# 3. Deploy with --commit-dirty flag to force fresh upload
npx wrangler pages deploy . --project-name=london-slush --branch=main --commit-dirty

# 4. Wait 1-2 minutes for deployment
```

### STEP 3: Verify Deployment

After deployment completes, tell me: **"Cache purged, deployed"**

I'll run these verification tests:
1. ✅ Worker Integration URLs (should be 2)
2. ✅ Google Sheets sync (POST to API)
3. ✅ Form submission (check Google Sheet)

---

## 🔧 Alternative: Use Cloudflare Pages Dashboard

If CLI doesn't work:

### Option A: Purge Cache + Retry Deployment
1. **Purge cache** (steps above)
2. **Go to**: https://dash.cloudflare.com → Workers & Pages → london-slush
3. **Click**: Settings tab
4. **Find**: "Deployments" or "Source" section
5. **Click**: "Retry deployment" or "Redeploy" for the latest deployment
6. Wait 1-2 minutes

### Option B: Delete and Recreate Deployment
1. **Purge cache** (steps above)
2. **Go to**: Workers & Pages → london-slush → Deployments
3. **Delete** the latest deployment
4. **Push** a new commit to GitHub (empty commit works):
   ```bash
   git commit --allow-empty -m "Force fresh deployment"
   git push origin main
   ```
5. Wait for auto-deploy (2-3 minutes)

---

## 📋 Why This Happens

**Cloudflare Pages caching layers:**
1. ✅ GitHub code is correct (commit 3cfb81f)
2. ✅ Build process runs successfully
3. ❌ But CDN edge cache serves OLD `_worker.js`
4. ❌ Cache purge is REQUIRED to clear it

**This is why:**
- Your local `dist/` has correct files ✓
- GitHub has correct code ✓
- But production serves old version ✗

---

## ⏱️ Timeline

- **Purge cache**: 10-15 seconds
- **Deploy from local**: 1-2 minutes
- **CDN propagation**: 30 seconds
- **Verification**: 1 minute
- **Total**: ~4 minutes

---

## 🎯 What to Do RIGHT NOW

**STEP 1**: Purge Cloudflare cache (REQUIRED)
1. https://dash.cloudflare.com
2. Select `londonslush.com` domain
3. Caching → Configuration
4. Purge Everything → Confirm

**STEP 2**: Deploy from your local dist/ folder
```bash
cd path\to\your\dist
npx wrangler pages deploy . --project-name=london-slush --branch=main --commit-dirty
```

**STEP 3**: Reply "Cache purged, deployed"

---

## 🆘 Need Help?

Reply with:
- **"Purging cache now"** → I'll wait for you to complete
- **"Can't find Purge button"** → I'll guide you with screenshots
- **"CLI not working"** → I'll provide alternative methods
- **"Show me the Caching section"** → I'll describe it in detail

---

## 🔗 Quick Links

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Domain**: londonslush.com
- **Pages Project**: london-slush
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit

---

## ✅ Expected Result After Fix

After purging cache and deploying:
- ✅ Worker Integration: 2 URLs found
- ✅ API Endpoint: HTTP 302 (redirect to thank you page)
- ✅ Google Sheets: New entries appear immediately
- ✅ Email notifications: Sent to info@ and support@londonslush.com
- ✅ Both retail and distributor forms: Working perfectly

**Let me know when you're ready to purge the cache!** 🔥
