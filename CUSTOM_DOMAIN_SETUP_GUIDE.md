# Complete Guide: Deploy London Slush to londonslush.com

## 🎯 Overview

This guide will help you connect your existing Cloudflare Pages deployment (`london-slush.pages.dev`) to your custom domain `londonslush.com`.

**Current Status**: Site is live at https://london-slush.pages.dev/  
**Goal**: Make it accessible at https://londonslush.com and https://www.londonslush.com

---

## 📋 Prerequisites Checklist

Before we begin, ensure you have:

- [ ] Access to your domain registrar account (where you bought londonslush.com)
- [ ] Your Cloudflare account login credentials
- [ ] The domain londonslush.com is already registered and owned by you
- [ ] Admin access to modify DNS settings

---

## 🚀 Deployment Steps

### Step 1: Add Custom Domain to Cloudflare Pages

#### 1.1 Access Cloudflare Dashboard
1. Go to https://dash.cloudflare.com/
2. Log in with your Cloudflare account
3. Click on **"Workers & Pages"** in the left sidebar
4. Find and click on your **"london-slush"** project

#### 1.2 Add Custom Domain
1. In your project, click the **"Custom domains"** tab
2. Click **"Set up a custom domain"** button
3. Enter your domain: `londonslush.com`
4. Click **"Continue"**
5. Cloudflare will show you DNS records to add

**Note**: You'll also want to add `www.londonslush.com` as a second custom domain (repeat steps 2-5).

---

### Step 2: Configure DNS Settings

You have **TWO OPTIONS** here - choose the one that applies to you:

---

#### **OPTION A: Domain is ALREADY on Cloudflare** ✅ (Recommended)

If londonslush.com is already managed by Cloudflare:

1. Go to your Cloudflare Dashboard
2. Click on **"Websites"** in the left sidebar
3. Select **londonslush.com** from your domains list
4. Click **"DNS"** in the left menu
5. Add the following DNS records:

**For Root Domain** (londonslush.com):
- Type: `CNAME`
- Name: `@` (or leave blank for root)
- Target: `london-slush.pages.dev`
- Proxy status: **Proxied** (orange cloud)

**For WWW Subdomain** (www.londonslush.com):
- Type: `CNAME`
- Name: `www`
- Target: `london-slush.pages.dev`
- Proxy status: **Proxied** (orange cloud)

6. Click **"Save"** for each record
7. **DNS propagation**: Should be instant to 5 minutes since it's already on Cloudflare

---

#### **OPTION B: Domain is NOT on Cloudflare** 🔄

If your domain is registered elsewhere (GoDaddy, Namecheap, Google Domains, etc.):

You have two sub-options:

##### **Option B1: Transfer DNS to Cloudflare** ✅ (Best Performance)

1. **Add Domain to Cloudflare**:
   - Go to Cloudflare Dashboard
   - Click **"Add site"**
   - Enter `londonslush.com`
   - Select **"Free"** plan
   - Click **"Add site"**

2. **Cloudflare will scan your existing DNS records**:
   - Review the records it found
   - Click **"Continue"**

3. **Update Nameservers at Your Registrar**:
   - Cloudflare will show you 2 nameservers like:
     ```
     celine.ns.cloudflare.com
     doug.ns.cloudflare.com
     ```
   - Log in to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS/Nameserver settings
   - Replace existing nameservers with Cloudflare's nameservers
   - Save changes

4. **Wait for DNS Propagation**:
   - Usually takes 2-24 hours
   - Check status at: https://dash.cloudflare.com/

5. **Once Active, Add DNS Records** (see Option A steps above)

##### **Option B2: Use CNAME at Your Current Registrar** ⚠️ (Limited)

**Note**: Some registrars don't support CNAME at root domain.

1. Log in to your domain registrar
2. Find DNS settings for londonslush.com
3. Add these records:

**For Root Domain**:
- Type: `A` record (or `CNAME` if supported)
- Name: `@` or blank
- Value: 
  - If A record: Get IP from `ping london-slush.pages.dev`
  - If CNAME: `london-slush.pages.dev`

**For WWW**:
- Type: `CNAME`
- Name: `www`
- Value: `london-slush.pages.dev`

4. Save and wait 24-48 hours for propagation

---

### Step 3: Verify DNS Configuration

Use these tools to check if DNS is configured correctly:

#### Online DNS Lookup Tools:
1. **DNS Checker**: https://dnschecker.org/
   - Enter: `londonslush.com`
   - Type: `CNAME`
   - Click **"Search"**
   - Should show: `london-slush.pages.dev`

2. **WhatsMyDNS**: https://whatsmydns.net/
   - Enter: `londonslush.com`
   - Type: `CNAME`
   - Check global propagation

#### Command Line (Optional):
```bash
# Check root domain
dig londonslush.com

# Check www subdomain
dig www.londonslush.com

# Check CNAME
dig londonslush.com CNAME
```

---

### Step 4: Enable HTTPS/SSL

Cloudflare automatically provisions SSL certificates, but you need to verify:

#### 4.1 Check SSL Status
1. Go to Cloudflare Dashboard
2. Click **"Workers & Pages"**
3. Click your **"london-slush"** project
4. Click **"Custom domains"** tab
5. Check that your domains show **"Active"** status with a green checkmark
6. Should say **"Certificate: Active"**

#### 4.2 SSL/TLS Settings (if domain on Cloudflare)
1. Go to **"Websites"** → **londonslush.com**
2. Click **"SSL/TLS"** in left menu
3. Set encryption mode to: **"Full (strict)"**
4. Enable **"Always Use HTTPS"**
5. Enable **"Automatic HTTPS Rewrites"**

#### 4.3 Test HTTPS
After SSL activates (5-10 minutes):
- Visit: https://londonslush.com
- Look for padlock 🔒 icon in browser
- Certificate should be valid

---

### Step 5: Set Up Redirects

To ensure both `londonslush.com` and `www.londonslush.com` work:

#### 5.1 Using Cloudflare Page Rules (if domain on Cloudflare)

1. Go to **"Websites"** → **londonslush.com**
2. Click **"Rules"** → **"Page Rules"**
3. Click **"Create Page Rule"**

**Rule 1: Redirect WWW to Root** (or vice versa)
- URL: `www.londonslush.com/*`
- Setting: **"Forwarding URL"** → **"301 Permanent Redirect"**
- Destination: `https://londonslush.com/$1`
- Save

**OR**

**Rule 2: Redirect Root to WWW**
- URL: `londonslush.com/*`
- Setting: **"Forwarding URL"** → **"301 Permanent Redirect"**
- Destination: `https://www.londonslush.com/$1`
- Save

**Choose ONE approach** (either force WWW or force non-WWW).

#### 5.2 Update Canonical URL in Code

Update the canonical URL in your site to match your choice:

```bash
# If you want londonslush.com (no www)
cd /home/user/webapp
# Edit renderer.tsx to use https://londonslush.com/
```

---

### Step 6: Test Everything

#### 6.1 Test URLs
Visit all these URLs and verify they work:
- [ ] https://londonslush.com
- [ ] https://www.londonslush.com
- [ ] http://londonslush.com (should redirect to https)
- [ ] http://www.londonslush.com (should redirect to https)

#### 6.2 Test Pages
- [ ] Homepage: https://londonslush.com/
- [ ] Products section: https://londonslush.com/#products
- [ ] Retail page: https://londonslush.com/retail
- [ ] Distributor page: https://londonslush.com/distributor

#### 6.3 Test Functionality
- [ ] WhatsApp button works
- [ ] Call button works
- [ ] Email link works
- [ ] Social media links work
- [ ] Navigation menu works
- [ ] Mobile menu toggles correctly

#### 6.4 Test on Different Devices
- [ ] Desktop browser (Chrome, Firefox, Safari)
- [ ] Mobile browser (iOS Safari, Android Chrome)
- [ ] Tablet

---

### Step 7: Update Google Search Console (Optional but Recommended)

1. Go to: https://search.google.com/search-console/
2. Click **"Add property"**
3. Enter: `https://londonslush.com`
4. Verify ownership (Cloudflare makes this easy)
5. Submit sitemap: `https://londonslush.com/sitemap.xml` (if you have one)

---

### Step 8: Update Social Media & Marketing Materials

Update your custom domain everywhere:

**Online**:
- [ ] Facebook page
- [ ] Instagram bio
- [ ] YouTube channel
- [ ] Google My Business
- [ ] LinkedIn company page

**Offline**:
- [ ] Business cards
- [ ] Brochures
- [ ] Email signatures
- [ ] Letterheads

---

## 🔧 Troubleshooting

### Issue 1: "DNS_PROBE_FINISHED_NXDOMAIN"
**Cause**: DNS not configured or not propagated yet  
**Solution**: 
- Verify DNS records are correct
- Wait 24-48 hours for propagation
- Clear browser cache

### Issue 2: "SSL Certificate Error"
**Cause**: SSL not provisioned yet  
**Solution**:
- Wait 10-15 minutes for Cloudflare to issue certificate
- Check SSL/TLS settings in Cloudflare
- Ensure "Full (strict)" mode is enabled

### Issue 3: "Too Many Redirects"
**Cause**: Conflicting redirect rules  
**Solution**:
- Check Cloudflare Page Rules
- Ensure SSL mode is "Full (strict)" not "Flexible"
- Remove duplicate redirect rules

### Issue 4: "Domain Not Resolving"
**Cause**: DNS propagation incomplete  
**Solution**:
- Use https://dnschecker.org/ to check global propagation
- Wait up to 48 hours
- Try clearing local DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Issue 5: "www Works but Root Doesn't" (or vice versa)
**Cause**: Missing DNS record  
**Solution**:
- Add both CNAME records (@ and www)
- Set up proper redirects in Cloudflare Page Rules

---

## 📱 Quick Command Reference

### Check DNS Status:
```bash
# Check if domain points to Cloudflare
dig londonslush.com NS

# Check CNAME record
dig londonslush.com CNAME

# Check A record
dig londonslush.com A

# Test website response
curl -I https://londonslush.com
```

### Force DNS Refresh:
```bash
# Windows
ipconfig /flushdns

# macOS
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches
```

---

## ⏱️ Expected Timeline

| Step | Time Required |
|------|---------------|
| Add custom domain in Cloudflare | 2 minutes |
| Configure DNS (if already on Cloudflare) | 5-10 minutes |
| Configure DNS (if transferring nameservers) | 2-24 hours |
| SSL certificate provisioning | 5-15 minutes |
| DNS propagation worldwide | Up to 48 hours |
| Full go-live | 30 mins - 48 hours |

---

## ✅ Final Checklist

Before announcing your new domain:

- [ ] londonslush.com loads correctly
- [ ] www.londonslush.com works
- [ ] HTTPS is working (padlock visible)
- [ ] All pages load (homepage, retail, distributor)
- [ ] All buttons and links work
- [ ] Mobile version works
- [ ] Contact information is correct
- [ ] Company details show GLEN AQUA LIMITED
- [ ] Social media links work
- [ ] WhatsApp and Call buttons work

---

## 🆘 Need Help?

**Cloudflare Support**:
- Documentation: https://developers.cloudflare.com/pages/
- Community: https://community.cloudflare.com/
- Support: https://dash.cloudflare.com/ → "Support" → "Get help"

**Common Registrars DNS Help**:
- GoDaddy: https://www.godaddy.com/help/change-nameservers-664
- Namecheap: https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/
- Google Domains: https://support.google.com/domains/answer/3290309

---

## 📝 Next Steps After Going Live

1. **Monitor Performance**: Check Cloudflare Analytics
2. **Set Up Monitoring**: Use UptimeRobot or similar service
3. **Create Sitemap**: Generate and submit to Google Search Console
4. **Set Up Analytics**: Add Google Analytics if needed
5. **Test Forms**: Ensure lead forms work correctly
6. **Backup Regularly**: Use the ProjectBackup tool
7. **Monitor Logs**: Check for any errors in Cloudflare logs

---

**Created**: January 31, 2026  
**Last Updated**: January 31, 2026  
**Status**: Ready for Implementation

---

## 🎉 Congratulations!

Once complete, your London Slush franchise website will be live at:
- **https://londonslush.com** - Your primary domain
- **https://www.londonslush.com** - Alternative access
- **https://london-slush.pages.dev** - Cloudflare Pages (backup)

Your site will be fully functional, secure (HTTPS), and accessible worldwide!
