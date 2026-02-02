# 🚀 Manual Upload Guide - Google Sheets Integration Fix

## Problem
- ✅ Code is correct in Git (commit 3cfb81f)
- ✅ Local build works (2 Worker URLs found)
- ❌ Cloudflare Pages deploys wrong build (0 Worker URLs)
- ❌ Form submissions DON'T sync to Google Sheets

## Solution: Manual Upload (5 minutes)

### Step 1: Download the Package
**File**: `london-slush-dist-ready.zip` (27 MB)
**Location**: `/home/user/webapp/london-slush-dist-ready.zip`
**Contents**: Complete `dist/` folder with verified Google Sheets integration

### Step 2: Upload to Cloudflare Pages

#### Option A: Dashboard Upload (Recommended)
1. Open: https://dash.cloudflare.com
2. Go to: **Workers & Pages** → **london-slush** [Pages]
3. Click: **Create deployment** (or **Upload assets**)
4. Select: **Upload assets** / **Direct upload**
5. Upload: `london-slush-dist-ready.zip`
6. Branch: `main` (or create new branch like `manual-deploy`)
7. Click: **Deploy**
8. Wait: ~30 seconds

#### Option B: Wrangler CLI (If you fix API token)
```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name=london-slush
```

### Step 3: Verify Deployment

#### Test 1: Check Worker Integration
```bash
curl -s https://londonslush.com/ | grep -c "london-slush.bijnorservices.workers.dev"
# Expected: 2 (currently: 0)
```

#### Test 2: Submit Test Form
1. Go to: https://londonslush.com/distributor
2. Fill out the form:
   - Name: Test Upload Deploy
   - Phone: 9999999999
   - Email: upload-test@londonslush.com
   - State: Karnataka
   - District: Bangalore - 560001
   - Investment: ₹15L - ₹25L
3. Submit
4. Check Google Sheet immediately:
   https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit

#### Test 3: API Endpoint
```bash
curl -X POST https://londonslush.com/api/submit-distributor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=API Upload Test&phone=8888888888&email=apiupload@test.com&state=Maharashtra&district_pin=Mumbai - 400001&investment_range=15L-25L&timeline=0-30&experience_years=2&current_business=Retail&outlet_count=1-5&business_type=distributor&notes=Testing after manual upload&source_page=/distributor"
```

## Current Status
- ✅ **Source Code**: Latest commit 3cfb81f includes Google Sheets Worker integration
- ✅ **Local Build**: `dist/_worker.js` contains 2 Worker URL references (verified)
- ✅ **Worker Script**: https://london-slush.bijnorservices.workers.dev is ACTIVE
- ✅ **Google Sheet**: Ready with 2-3 test entries
- ❌ **Production Deploy**: Cloudflare Pages serving OLD code (0 Worker URLs)
- ❌ **Google Sheets Sync**: NOT WORKING (needs new deployment)

## Why Manual Upload?
Cloudflare Pages automated builds have a caching/build environment issue:
- GitHub triggers build correctly
- Build completes successfully  
- But deployed `_worker.js` is from cached/old build
- Clearing build cache didn't fix it
- Manual upload bypasses this issue

## Expected Timeline
- Upload: ~1 minute
- Deploy: ~30 seconds
- CDN propagation: ~30 seconds
- Testing: ~2 minutes
- **Total: ~5 minutes**

## Need Help?
Tell me:
- "Ready to upload" → I'll provide download link
- "Where do I upload?" → I'll guide step-by-step
- "Uploaded, test now" → I'll run automated tests
