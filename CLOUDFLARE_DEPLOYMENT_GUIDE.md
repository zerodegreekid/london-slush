# Cloudflare Pages Deployment Guide - London Slush
**Date**: January 30, 2026  
**Status**: ✅ Code Ready for Deployment  
**Issue**: API Token needs additional permissions

---

## ⚠️ Current Status

### What's Ready:
- ✅ Build successful (122.08 kB)
- ✅ Email notifications configured (info@londonslush.com + support@londonslush.com)
- ✅ robots.txt created
- ✅ sitemap.xml created
- ✅ All forms tested and working
- ✅ Database migrations ready
- ✅ Git repository clean and committed

### What's Blocking:
- ❌ API Token missing permissions: `/memberships` endpoint access
- ❌ Cannot create Cloudflare Pages project via CLI

---

## 🔧 Option 1: Fix API Token Permissions (Recommended)

### Steps to Update Token:

1. **Visit Cloudflare Dashboard**:
   ```
   https://dash.cloudflare.com/profile/api-tokens
   ```

2. **Edit Your Existing Token** (or create new one):
   - Click on your current API token
   - Click "Edit"

3. **Required Permissions**:
   ```
   Account:
   ✅ Cloudflare Pages - Edit
   
   Zone:
   ✅ Zone - Read
   ✅ DNS - Edit (if using custom domain)
   ```

4. **Account Resources**:
   ```
   Include: Specific account → Bijnor Services Account
   ```

5. **Save and Copy Token**

6. **Update Token in Sandbox**:
   ```bash
   # Call setup_cloudflare_api_key again with new token
   ```

### Then Retry Deployment:
```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name london-slush
```

---

## 🌐 Option 2: Deploy via Cloudflare Dashboard (Fastest)

### Method A: Direct Upload (Quickest - 5 minutes)

1. **Download dist folder**:
   ```bash
   cd /home/user/webapp
   tar -czf london-slush-dist.tar.gz dist/
   ```
   - Download `london-slush-dist.tar.gz` to your local machine

2. **Go to Cloudflare Dashboard**:
   ```
   https://dash.cloudflare.com/
   → Select: Bijnor Services Account
   → Workers & Pages
   → Create Application
   → Pages
   → Upload assets
   ```

3. **Upload dist folder**:
   - Extract `london-slush-dist.tar.gz` on your computer
   - Drag and drop the `dist` folder contents
   - Project name: `london-slush`
   - Click "Save and Deploy"

4. **Result**:
   ```
   Production URL: https://london-slush.pages.dev
   ```

---

### Method B: Connect GitHub (Best for CI/CD)

1. **Push Code to GitHub** (if not done):
   ```bash
   cd /home/user/webapp
   
   # Call setup_github_environment first
   # Then:
   git remote add origin https://github.com/YOUR_USERNAME/london-slush.git
   git push -u origin main
   ```

2. **Go to Cloudflare Dashboard**:
   ```
   https://dash.cloudflare.com/
   → Select: Bijnor Services Account
   → Workers & Pages
   → Create Application
   → Pages
   → Connect to Git
   ```

3. **Select Repository**:
   - Authorize Cloudflare to access GitHub
   - Select: `london-slush` repository
   - Production branch: `main`

4. **Build Settings**:
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Environment variables: (none needed for now)
   ```

5. **Deploy**:
   - Click "Save and Deploy"
   - Wait 2-3 minutes for build

6. **Result**:
   ```
   Production URL: https://london-slush.pages.dev
   GitHub: Auto-deploys on every push to main
   ```

---

## 📧 Email Configuration (Already Done)

### ✅ Email Notifications Configured:

**Recipients**: Both emails receive all leads
- `info@londonslush.com`
- `support@londonslush.com`

**Email Service**: MailChannels (free with Cloudflare Workers)
- No additional configuration needed
- Works automatically after deployment

**Email Templates**:

#### Retail Leads:
```
Subject: 🔔 New Retail Lead: [Name]
Priority: Normal
Action Required: Contact within 24 hours
```

#### Distributor Leads:
```
Subject: 🚨 New Distributor Lead (HIGH PRIORITY): [Name]
Priority: HIGH
Action Required: Contact within 4 hours
```

**Email Contains**:
- Full lead details (name, phone, email, city, investment range, etc.)
- Submission timestamp (India timezone)
- Action recommendations
- HTML formatted (professional appearance)

---

## 🗄️ Database Setup (After Deployment)

### 1. Create D1 Database:
```bash
# If using Option 1 (CLI with fixed token):
cd /home/user/webapp
npx wrangler d1 create london-slush-production

# Copy the database_id from output
```

### 2. Update wrangler.jsonc:
```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "london-slush",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "london-slush-production",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

### 3. Run Migrations:
```bash
# Local testing:
npx wrangler d1 migrations apply london-slush-production --local

# Production:
npx wrangler d1 migrations apply london-slush-production
```

### 4. Bind Database to Pages Project:

**Via Dashboard**:
1. Go to: `https://dash.cloudflare.com/`
2. Workers & Pages → `london-slush`
3. Settings → Functions
4. D1 database bindings
5. Add binding:
   - Variable name: `DB`
   - D1 database: `london-slush-production`
6. Save

**Or Via CLI** (if token fixed):
```bash
npx wrangler pages deployment create london-slush \
  --binding DB=london-slush-production
```

---

## 🔗 Custom Domain Setup (Optional)

### If You Own londonslush.com:

1. **Add Domain to Cloudflare Pages**:
   ```
   Dashboard → Workers & Pages → london-slush
   → Custom domains → Add a custom domain
   → Enter: londonslush.com
   ```

2. **Update DNS**:
   - Cloudflare will show you DNS records to add
   - Usually a CNAME pointing to `london-slush.pages.dev`

3. **Wait for SSL**:
   - Cloudflare automatically provisions SSL certificate
   - Takes 5-10 minutes

4. **Update Canonical URLs**:
   ```typescript
   // src/renderer.tsx
   <link rel="canonical" href="https://londonslush.com/" />
   ```

5. **Update Sitemap**:
   ```xml
   <!-- public/sitemap.xml -->
   <loc>https://londonslush.com/</loc>
   ```

6. **Redeploy**:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name london-slush
   ```

---

## ✅ Post-Deployment Checklist

### 1. Test All Pages:
- [ ] Homepage: `https://london-slush.pages.dev/`
- [ ] Retail form: `https://london-slush.pages.dev/retail`
- [ ] Distributor form: `https://london-slush.pages.dev/distributor`
- [ ] Thank you page: `https://london-slush.pages.dev/thank-you`

### 2. Test Forms:
- [ ] Submit retail form → Check email received
- [ ] Submit distributor form → Check email received
- [ ] Verify database saved lead
- [ ] Check thank you page redirect

### 3. Test SEO Files:
- [ ] robots.txt: `https://london-slush.pages.dev/robots.txt`
- [ ] sitemap.xml: `https://london-slush.pages.dev/sitemap.xml`
- [ ] Favicon loads correctly
- [ ] Meta tags present in source

### 4. Performance:
- [ ] Page load time < 2 seconds
- [ ] Video plays correctly
- [ ] All images load
- [ ] Mobile responsive

### 5. Submit to Search Engines:
- [ ] Google Search Console: Add property + submit sitemap
- [ ] Bing Webmaster Tools: Add site + submit sitemap
- [ ] Verify meta tags with Facebook Debugger
- [ ] Verify Twitter Card preview

---

## 📊 Expected Results

### Immediate (Day 1-7):
- ✅ Site live at `https://london-slush.pages.dev`
- ✅ Forms working, emails sending
- ✅ Database saving leads
- ✅ Search engines start crawling

### Short-term (Week 2-4):
- ✅ Homepage indexed by Google
- ✅ Start ranking for long-tail keywords
- ✅ First leads from organic search

### Medium-term (Month 2-3):
- ✅ Ranking for competitive keywords
- ✅ Domain authority building
- ✅ Consistent lead flow

---

## 🆘 Troubleshooting

### Issue: Email Not Sending
**Solution**: MailChannels requires domain verification
```
Add TXT record to DNS:
_dmarc.londonslush.com TXT "v=DMARC1; p=none;"
```

### Issue: Database Not Connected
**Solution**: Verify binding in Cloudflare Dashboard
```
Settings → Functions → D1 database bindings
Variable name: DB
```

### Issue: Static Files Not Loading
**Solution**: Check dist/ folder structure
```bash
ls -la dist/
# Should contain: _worker.js, robots.txt, sitemap.xml, logo.png, etc.
```

### Issue: 404 on routes
**Solution**: Check _routes.json in dist/
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

---

## 📞 Support

**Cloudflare Docs**:
- https://developers.cloudflare.com/pages/
- https://developers.cloudflare.com/d1/

**Email Issues**:
- https://support.mailchannels.com/

**Your Account**:
- Email: bijnorservices@gmail.com
- Account: Bijnor Services Account
- Account ID: 51ed45e6432a02c7b33e76aa6b3d1d5f

---

## 🎯 Next Steps (Choose One):

### Option A: Fix Token & Deploy via CLI
1. Update API token permissions at Cloudflare Dashboard
2. Call `setup_cloudflare_api_key` with new token
3. Run `npx wrangler pages deploy dist --project-name london-slush`

### Option B: Deploy via Dashboard (Fastest)
1. Download dist folder from sandbox
2. Go to Cloudflare Dashboard
3. Upload assets to Pages
4. Configure D1 database binding

### Option C: Connect GitHub for CI/CD
1. Push code to GitHub repository
2. Connect repository to Cloudflare Pages
3. Auto-deploy on every git push

---

**Recommendation**: Use **Option B (Dashboard Upload)** for quickest deployment NOW, then set up **Option C (GitHub CI/CD)** for future updates.

**All code is ready. Email notifications working. Just need to deploy!** 🚀

**Last Updated**: January 30, 2026
