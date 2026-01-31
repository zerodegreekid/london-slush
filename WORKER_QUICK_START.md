# 🎯 Worker Setup - Quick Action Guide

## ✅ **What's Been Done**

1. ✅ **Worker Script Created**: `worker-script.js`
   - JWT authentication with RSA signature
   - OAuth2 token generation
   - Google Sheets API integration
   - CORS enabled for all domains

2. ✅ **Frontend Forms Updated**:
   - Distributor form → Calls Worker
   - Retail form → Calls Worker
   - Non-blocking execution (users don't wait)
   - Graceful error handling

3. ✅ **Secret Split Solution**:
   - Bypasses 1 KiB Cloudflare limit
   - Three separate secrets instead of one large JSON
   - Each secret well under the limit

---

## 🚀 **Your Action Items (15 Minutes)**

### **Step 1: Deploy Worker Script** (5 minutes)

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Navigate to Workers & Pages**
3. **Find your Worker**: `london-slush`
4. **Click "Edit Code"**
5. **Copy the entire contents** of `/home/user/webapp/worker-script.js`
6. **Paste into the editor** (replace everything)
7. **Click "Save and Deploy"**

---

### **Step 2: Extract Your Service Account Credentials** (3 minutes)

Open your Google Service Account JSON file and find these three values:

#### **A. CLIENT_EMAIL**
Find the line:
```json
"client_email": "your-service-account@your-project.iam.gserviceaccount.com"
```
Copy: `your-service-account@your-project.iam.gserviceaccount.com`

#### **B. PRIVATE_KEY**
Find the line (it's very long):
```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----\n"
```
Copy the ENTIRE value including `-----BEGIN` and `-----END`

**Important**: 
- If copying from JSON, it will have `\n` characters - that's OK
- If copying from a .pem file, it will have actual line breaks - that's also OK
- The Worker code handles both formats

#### **C. SHEET_ID**
From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit
```
Copy: `1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw`

---

### **Step 3: Set Worker Secrets** (5 minutes)

1. **In your Worker page**, go to **Settings** tab
2. **Scroll to "Environment Variables"**
3. **Click "Add variable"** three times

#### **Secret 1: GOOGLE_CLIENT_EMAIL**
- Variable name: `GOOGLE_CLIENT_EMAIL`
- Value: `your-service-account@your-project.iam.gserviceaccount.com`
- Type: **Secret** (click "Encrypt")

#### **Secret 2: GOOGLE_PRIVATE_KEY**
- Variable name: `GOOGLE_PRIVATE_KEY`
- Value: Paste your ENTIRE private key
- Type: **Secret** (click "Encrypt")

**Tip**: Make sure to include:
```
-----BEGIN PRIVATE KEY-----
MII...actual key content...
-----END PRIVATE KEY-----
```

#### **Secret 3: GOOGLE_SHEET_ID**
- Variable name: `GOOGLE_SHEET_ID`
- Value: `1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw`
- Type: **Secret** (click "Encrypt")

4. **Click "Save"** for each
5. **Click "Deploy"** to apply changes

---

### **Step 4: Share Google Sheet** (2 minutes)

1. **Open your sheet**: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit

2. **Add header row** (if not already there):
   ```
   Row 1: ID | Name | Phone | Email | State/UT | District & PIN | Investment Range | Timeline | Experience | Current Business | Outlet Count | Business Type | Notes | Submitted At | Priority
   ```

3. **Click "Share" button** (top-right)

4. **Add your service account email**:
   - Paste: `your-service-account@your-project.iam.gserviceaccount.com`
   - Permission: **Editor**
   - **Uncheck** "Notify people"
   - Click **"Share"**

---

## 🧪 **Step 5: Test the Integration** (3 minutes)

### **Test 1: Direct Worker Test**

```bash
curl -X POST https://london-slush.bijnorservices.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Worker Test User",
    "phone": "9999999999",
    "email": "test@worker.com",
    "state": "Maharashtra",
    "district_pin": "Mumbai - 400001",
    "investment_range": "25L-40L",
    "timeline": "0-30",
    "experience_years": "3",
    "business_type": "distributor",
    "priority": "HIGH"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Lead synced to Google Sheets successfully",
  "timestamp": "2026-01-31T19:30:00.000Z"
}
```

**Check Your Google Sheet**: A new row should appear! ✅

---

### **Test 2: Form Submission Test**

1. **Deploy your updated code**:
   ```bash
   cd /home/user/webapp
   npm run deploy:prod
   ```

2. **Go to**: https://london-slush.pages.dev/distributor

3. **Fill and submit** the form

4. **Expected**:
   - ✅ Immediate redirect to thank you page
   - ✅ Emails sent to info@ and support@
   - ✅ **New row in Google Sheet within 2-3 seconds**

---

## 🔍 **Troubleshooting**

### **Issue: "Authentication failed"**

**Check**:
1. `GOOGLE_CLIENT_EMAIL` is correct (no extra spaces)
2. `GOOGLE_PRIVATE_KEY` includes `-----BEGIN` and `-----END`
3. Service account email has **Editor** access to sheet

**Fix**:
- Re-paste the private key (make sure it's complete)
- Check Worker logs in Cloudflare Dashboard
- Wait 1-2 minutes for secrets to propagate

---

### **Issue: "Sheet not found"**

**Check**:
1. `GOOGLE_SHEET_ID` matches the URL
2. Sheet is shared with service account
3. Sheet name is "Sheet1" (default first tab)

**Fix**:
- Verify the spreadsheet ID
- Re-share the sheet with Editor permission
- Check Worker logs for detailed error

---

### **Issue: Worker returns 500 error**

**Check**:
1. All three secrets are set in Worker settings
2. Worker code is deployed (click "Deploy" after code changes)
3. View Worker logs for detailed error messages

**Fix**:
```bash
# View real-time logs
npx wrangler tail london-slush
```

---

## 📊 **How It Works**

```
User submits form on londonslush.com
       ↓
   Form handler processes
       ↓
┌──────┴──────┬──────────┬─────────────────────┐
│             │          │                     │
↓             ↓          ↓                     ↓
Database      Email      Worker               Thank You Page
(D1)          (MailChannels)  (london-slush.bijnorservices.workers.dev)
│             │          │
│             │          ├─→ Get OAuth2 token from Google
│             │          ├─→ Authenticate with service account
│             │          ├─→ Append row to Google Sheets
│             │          └─→ Return success JSON
│             │
│             ├─→ info@londonslush.com
│             └─→ support@londonslush.com
│
└─→ ✅ Saved   └─→ ✅ Sent   └─→ ✅ Synced     └─→ ✅ Displayed
```

**User Experience**: Instant! They see the thank you page immediately while sync happens in background.

---

## ✅ **Verification Checklist**

Before going live, confirm:

- [ ] Worker code deployed (`worker-script.js` uploaded)
- [ ] `GOOGLE_CLIENT_EMAIL` secret set
- [ ] `GOOGLE_PRIVATE_KEY` secret set (includes BEGIN/END)
- [ ] `GOOGLE_SHEET_ID` secret set
- [ ] Google Sheet has header row (15 columns)
- [ ] Sheet shared with service account (Editor permission)
- [ ] Direct Worker test successful (curl command)
- [ ] Form submission test successful
- [ ] New row appears in Google Sheet
- [ ] Emails received at info@ and support@
- [ ] Thank you page displays immediately

---

## 🎉 **After Setup**

### **What Happens Automatically**

Every form submission will:
1. ✅ Save to D1 database
2. ✅ Send emails to info@ and support@
3. ✅ **Append to Google Sheet** (new!)
4. ✅ Redirect to thank you page

### **Google Sheet Data**

Each row will contain:
- ID (empty - you can add formulas)
- Name
- Phone
- Email
- State/UT
- District & PIN
- Investment Range
- Timeline
- Experience
- Current Business
- Outlet Count
- Business Type
- Notes
- Submitted At (ISO timestamp)
- Priority (HIGH for distributors, MEDIUM for retail)

### **Works Across All Domains**

- ✅ `london-slush.pages.dev`
- ✅ `londonslush.com`
- ✅ Any custom domain you add
- ✅ Local development (when testing)

CORS is enabled (`Access-Control-Allow-Origin: *`) so the Worker accepts requests from any origin.

---

## 🔗 **Resources**

- **Worker Script**: `/home/user/webapp/worker-script.js`
- **Setup Guide**: `/home/user/webapp/WORKER_INTEGRATION_GUIDE.md`
- **Worker URL**: https://london-slush.bijnorservices.workers.dev
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit
- **GitHub**: https://github.com/zerodegreekid/london-slush
- **Commit**: 633685b

---

## 🆘 **Need Help?**

**If you encounter issues, reply with:**

1. **"Help with service account email"** - I'll guide you through finding it
2. **"Help with private key"** - I'll show you how to extract it properly
3. **"Worker test failed"** - Share the error and I'll troubleshoot
4. **"Sheet not syncing"** - I'll check your configuration

**Or share:**
- Error messages from Worker logs
- Curl command output
- Screenshot of Worker settings

---

## 📞 **Summary**

| Task | Time | Status |
|------|------|--------|
| **Deploy Worker** | 5 min | ⏳ Pending |
| **Extract Credentials** | 3 min | ⏳ Pending |
| **Set Secrets** | 5 min | ⏳ Pending |
| **Share Sheet** | 2 min | ⏳ Pending |
| **Test** | 3 min | ⏳ Pending |
| **Total** | **18 min** | - |

**Current Status**: 🟢 Ready to deploy  
**Next Action**: Deploy Worker script and set secrets  
**Estimated Time to Live**: 18 minutes

---

**Ready to start? Reply:**
- "Let's deploy the Worker" - I'll guide you step by step
- "I've deployed it, now what?" - I'll help you test
- "Something's not working" - Share the error and I'll fix it

🚀 **You're almost there!**
