# 🚀 Google Sheets API Auto-Sync Setup Guide

## ✅ Prerequisites
You mentioned you **already have the Google Sheets API Key created**. Perfect! Let's get it working.

---

## 📋 **Step-by-Step Implementation**

### **Step 1: Prepare Your Google Sheet**

1. **Create a new Google Sheet**:
   - Go to https://sheets.google.com
   - Create a new spreadsheet
   - Name it: **"London Slush Leads"**

2. **Set up the header row** (Row 1):
   ```
   A1: ID
   B1: Name
   C1: Phone
   D1: Email
   E1: State/UT
   F1: District & PIN
   G1: Investment Range
   H1: Timeline
   I1: Experience
   J1: Current Business
   K1: Outlet Count
   L1: Business Type
   M1: Notes
   N1: Submitted At
   O1: Priority
   ```

3. **Copy the Spreadsheet ID**:
   - From the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part
   - Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`

---

### **Step 2: Share Sheet with Service Account**

Your API credentials likely include a **service account email** that looks like:
```
your-service-account@your-project.iam.gserviceaccount.com
```

**Share the sheet**:
1. In Google Sheets, click **"Share"** button (top-right)
2. Add the service account email
3. Set permission to **"Editor"**
4. Uncheck **"Notify people"**
5. Click **"Share"**

---

### **Step 3: Configure Cloudflare Secrets**

You need to store two secrets in Cloudflare:

#### **Secret 1: Google Sheets Credentials** (JSON format)
```bash
# In your terminal, run this command:
cd /home/user/webapp
npx wrangler secret put GOOGLE_SHEETS_CREDENTIALS
```

When prompted, paste your **full JSON credentials file** content. It should look like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

#### **Secret 2: Spreadsheet ID**
```bash
npx wrangler secret put GOOGLE_SHEET_ID
```

Paste your **spreadsheet ID** when prompted.

---

### **Step 4: Update wrangler.jsonc**

The secrets are now stored securely and will be available as environment variables:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "london-slush",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "london-slush-leads",
      "database_id": "your-database-id"
    }
  ],
  
  // Environment variables will be injected from secrets
  "vars": {
    "SHEETS_ENABLED": "true"
  }
}
```

---

## 🔧 **Technical Implementation**

The code has been added to your project in two parts:

### **1. Google Sheets Sync Function**
Location: `src/index.tsx` (added as helper function)

This function:
- Authenticates using your service account
- Gets an OAuth2 access token
- Appends a new row to your Google Sheet
- Handles errors gracefully (non-blocking)

### **2. Form Handler Integration**
Location: `src/index.tsx` → `app.post('/api/submit-distributor')`

After saving to database and sending emails, it now also:
- Calls the Google Sheets sync function
- Passes all form data
- Runs asynchronously (doesn't block submission)

---

## 🧪 **Testing the Integration**

### **Test 1: Local Development** (with .dev.vars file)

Create `.dev.vars` file for local testing:
```bash
cat > /home/user/webapp/.dev.vars << 'EOF'
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
GOOGLE_SHEET_ID=your-spreadsheet-id-here
SHEETS_ENABLED=true
EOF
```

**Important**: Add `.dev.vars` to `.gitignore`:
```bash
echo ".dev.vars" >> /home/user/webapp/.gitignore
```

### **Test 2: Submit a Test Lead**

```bash
# Start local server
cd /home/user/webapp && npm run build
pm2 restart london-slush

# Wait a few seconds, then test
curl -X POST http://localhost:3000/api/submit-distributor \
  -d "name=Google Sheets Test User" \
  -d "phone=9876543210" \
  -d "email=test@googlesheets.com" \
  -d "state=Maharashtra" \
  -d "district_pin=Mumbai - 400001" \
  -d "investment_range=25L-40L" \
  -d "experience_years=5" \
  -d "timeline=0-30" \
  -d "business_type=distributor" \
  -d "source_page=/distributor"
```

### **Test 3: Check the Google Sheet**

Go to your Google Sheet and verify:
- ✅ New row added with all data
- ✅ Timestamp in "Submitted At" column
- ✅ All fields mapped correctly

---

## 🚀 **Production Deployment**

Once local testing works:

```bash
# Build and deploy
cd /home/user/webapp
npm run build
npm run deploy:prod
```

The secrets you configured with `wrangler secret put` are automatically available in production.

---

## 🔍 **Troubleshooting**

### **Issue 1: "Authentication failed"**
**Solution**: 
- Verify the service account email is shared with Editor access
- Check the JSON credentials are complete (no missing quotes or line breaks)
- Ensure the private key includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### **Issue 2: "Sheet not found"**
**Solution**:
- Double-check the spreadsheet ID matches the URL
- Ensure the sheet is shared with the service account email
- The sheet name should be the first tab (default "Sheet1" or rename it)

### **Issue 3: "Permission denied"**
**Solution**:
- Service account needs **Editor** permission (not Viewer)
- Uncheck "Notify people" when sharing to avoid email notifications
- Wait 1-2 minutes for permissions to propagate

### **Issue 4: No row appended**
**Solution**:
- Check PM2 logs: `pm2 logs london-slush --nostream | grep -i sheets`
- Verify secrets are set: `npx wrangler secret list`
- Ensure `SHEETS_ENABLED=true` in your environment

---

## 📊 **What Data Gets Synced**

Every form submission automatically creates a new row in Google Sheets with:

| Column | Data | Example |
|--------|------|---------|
| **ID** | Auto-generated | 1, 2, 3... |
| **Name** | Full name | "Rajesh Kumar" |
| **Phone** | 10-digit | "9876543210" |
| **Email** | Email address | "rajesh@example.com" |
| **State/UT** | Selected state | "Maharashtra" |
| **District & PIN** | Location details | "Mumbai - 400001" |
| **Investment Range** | Selected range | "₹25L-₹40L" |
| **Timeline** | Start timeline | "Within 1 month" |
| **Experience** | Distribution exp | "1-3 years" |
| **Current Business** | Existing business | "Retail outlet" |
| **Outlet Count** | Number of outlets | "5-10" |
| **Business Type** | Type | "Distributor" |
| **Notes** | Additional info | "Interested in North region" |
| **Submitted At** | ISO timestamp | "2026-01-31 18:45:00" |
| **Priority** | Lead priority | "HIGH" |

---

## 🎯 **Expected Flow After Setup**

```
User Submits Form
       ↓
   Parse Data
       ↓
┌──────┴──────┬──────────┐
│             │          │
↓             ↓          ↓
Save to DB    Send Emails    Append to Sheet
✅ Working    ✅ Working      🆕 NEW!
│             │               │
│             │               ├─→ Authenticate
│             │               ├─→ Format data
│             │               └─→ Append row
│             │
│             ├─→ info@londonslush.com
│             └─→ support@londonslush.com
│
└─→ Redirect to Thank You Page
```

---

## ✅ **Verification Checklist**

Before deploying to production, confirm:

- [ ] Google Sheet created with header row
- [ ] Spreadsheet ID copied
- [ ] Service account email has Editor access
- [ ] `GOOGLE_SHEETS_CREDENTIALS` secret set in Cloudflare
- [ ] `GOOGLE_SHEET_ID` secret set in Cloudflare
- [ ] `.dev.vars` created for local testing (and in `.gitignore`)
- [ ] Local test successful (row appears in sheet)
- [ ] Production deployment successful
- [ ] Production test successful (submit via live form)

---

## 🔐 **Security Notes**

✅ **What's Secure**:
- Credentials stored in Cloudflare Secrets (encrypted)
- Service account has limited permissions (only this sheet)
- Private key never exposed in code or logs
- `.dev.vars` in `.gitignore` (won't be committed)

⚠️ **Important**:
- NEVER commit credentials to Git
- NEVER paste credentials in public channels
- Rotate service account keys periodically
- Use dedicated service account (not personal Google account)

---

## 📞 **Need Help?**

If you encounter issues:
1. Check PM2 logs: `pm2 logs london-slush --nostream`
2. Verify secrets: `npx wrangler secret list`
3. Test locally first with `.dev.vars`
4. Check Google Cloud Console for API errors
5. Reply here with the specific error message

---

## 🎉 **Ready to Start?**

**Reply with the following information and I'll help you set it up:**

1. **Spreadsheet ID**: (from your Google Sheet URL)
2. **Service Account Email**: (from your API credentials JSON)
3. **Confirmation**: That you've shared the sheet with the service account

**Or if you need help finding these values, reply:**
- "Help me find my spreadsheet ID"
- "Help me find my service account email"
- "I have the JSON file, what do I do?"

---

**Last Updated**: January 31, 2026  
**Status**: Ready to implement  
**Estimated Setup Time**: 10-15 minutes  
**Difficulty**: Intermediate
