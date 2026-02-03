# ✅ QUICK ACTION CHECKLIST - GET EVERYTHING WORKING

**Goal**: Get Google Sheets sync + Emails working in ~20 minutes

---

## 🎯 **PRIORITY 1: Enable Auto-Deploy (5 minutes)**

**Why First?** Because nothing else matters until your latest code is deployed!

### **Steps:**

- [ ] **1.1** Open Cloudflare Dashboard: https://dash.cloudflare.com
- [ ] **1.2** Go to: Workers & Pages → **london-slush** → **Settings**
- [ ] **1.3** Find "Source" section → Click **"Connect to Git"**
- [ ] **1.4** Authorize Cloudflare → Select repo **zerodegreekid/london-slush**
- [ ] **1.5** Configure:
  - Branch: `main`
  - Build command: `npm run build`
  - Build output: `dist`
- [ ] **1.6** Click **"Save and Deploy"**
- [ ] **1.7** Wait 3-5 minutes for first build
- [ ] **1.8** Verify: Build status shows "Success ✓"

**✅ After this step:** Future git pushes will auto-deploy (no manual work!)

---

## 🎯 **PRIORITY 2: Setup Google Sheets Sync (10 minutes)**

**OPTION A: Google Apps Script (RECOMMENDED)**

- [ ] **2.1** Open Google Sheet: https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit
- [ ] **2.2** Verify headers exist: `Timestamp | Name | Email | Phone | Location | Investment | Type | Details`
- [ ] **2.3** Click: **Extensions** → **Apps Script**
- [ ] **2.4** Delete any existing code
- [ ] **2.5** Paste the Apps Script code from `GOOGLE_SHEETS_EMAIL_SOLUTIONS.md`
- [ ] **2.6** Click: **💾 Save**
- [ ] **2.7** Click: **Deploy** → **New deployment**
- [ ] **2.8** Select: **Web app**
- [ ] **2.9** Configure:
  - Execute as: **Me**
  - Who has access: **Anyone**
- [ ] **2.10** Click: **Deploy**
- [ ] **2.11** Copy the Web App URL (starts with `https://script.google.com/macros/s/...`)
- [ ] **2.12** Test it:
  - In Apps Script: Click **▶️ Run** → **testDoPost**
  - Check sheet for new test row
  - Check email for notification

**✅ After this step:** Your Google Apps Script is ready to receive data!

---

## 🎯 **PRIORITY 3: Update Website Code (3 minutes)**

- [ ] **3.1** Reply here with your Apps Script URL
- [ ] **3.2** I'll update the code automatically (replace Worker URL with Apps Script URL)
- [ ] **3.3** Commit the changes
- [ ] **3.4** Push to GitHub
- [ ] **3.5** Cloudflare auto-deploys (3-5 min)

**✅ After this step:** Forms will submit to Google Apps Script!

---

## 🎯 **PRIORITY 4: Test Everything (5 minutes)**

### **Test 1: Verify Deployment**

- [ ] **4.1** Run command:
```bash
curl -s https://londonslush.com/ | findstr "script.google.com"
```
- [ ] **4.2** Expected: Should show your Apps Script URL

### **Test 2: Test Distributor Form**

- [ ] **4.3** Visit: https://londonslush.com/distributor
- [ ] **4.4** Select: "0 years experience"
- [ ] **4.5** Verify: Network field disappears ✓
- [ ] **4.6** Fill form with test data
- [ ] **4.7** Submit form
- [ ] **4.8** Check: Google Sheet for new row (within 5 seconds)
- [ ] **4.9** Check: info@londonslush.com for email (within 30 seconds)

### **Test 3: Test Retail Form**

- [ ] **4.10** Visit: https://londonslush.com/retail
- [ ] **4.11** Select: "Individual Model"
- [ ] **4.12** Verify: Investment budget disappears ✓
- [ ] **4.13** Fill form with test data
- [ ] **4.14** Submit form
- [ ] **4.15** Check: Google Sheet for new row
- [ ] **4.16** Check: support@londonslush.com for email

### **Test 4: Verify Images**

- [ ] **4.17** Visit: https://londonslush.com/
- [ ] **4.18** Scroll to products section
- [ ] **4.19** Verify: All 9 product images load correctly

**✅ After this step:** Everything should be working!

---

## 🚨 **TROUBLESHOOTING**

### **Issue: Auto-Deploy Not Working**

**Symptoms:**
- No new deployments appearing in Cloudflare
- Code changes not going live

**Fix:**
1. Check: Cloudflare Dashboard → Pages → london-slush → Deployments
2. Look for: Build errors in logs
3. Common issue: Build command wrong
   - Should be: `npm run build`
   - NOT: `npm run dev`

---

### **Issue: Apps Script Returns Error**

**Symptoms:**
- Form submits but no data in sheet
- Console shows 403 or 401 error

**Fix:**
1. Re-deploy Apps Script:
   - Deploy → **New deployment** (don't reuse old one)
   - Set "Who has access" to **Anyone**
2. Clear browser cache and try again

---

### **Issue: Emails Not Arriving**

**Symptoms:**
- Data appears in sheet
- No emails received

**Fix:**
1. Check: Spam/Junk folders
2. In Apps Script, click: **▶️ Run** → **testDoPost**
3. Check: **Executions** log for errors
4. Verify: `MailApp.sendEmail()` permissions approved
   - First time: Authorize the script to send emails

---

### **Issue: Forms Not Submitting**

**Symptoms:**
- Click submit, nothing happens
- Console shows fetch error

**Fix:**
1. Open browser console (F12)
2. Look for error messages
3. Verify: Apps Script URL is correct in code
4. Test: Visit Apps Script URL directly in browser
   - Should show: "Script function not found: doGet"
   - If 404: Deployment failed

---

## 📊 **PROGRESS TRACKER**

**Current Status:**

| Task | Status | Notes |
|------|--------|-------|
| GitHub Auto-Deploy | ⏳ **PENDING** | Need to enable in Cloudflare |
| Code Deployed | ❌ **NOT DONE** | Waiting for auto-deploy |
| Apps Script Created | ⏳ **PENDING** | User needs to create |
| Website Code Updated | ⏳ **PENDING** | Waiting for Apps Script URL |
| Google Sheets Sync | ❌ **NOT WORKING** | Depends on above |
| Email Notifications | ❌ **NOT WORKING** | Depends on above |
| Forms Logic | ❌ **NOT WORKING** | Code not deployed |
| Images | ❌ **NOT VISIBLE** | Code not deployed |

**Target Status (After Completion):**

| Task | Status |
|------|--------|
| GitHub Auto-Deploy | ✅ **ENABLED** |
| Code Deployed | ✅ **DONE** |
| Apps Script Created | ✅ **DONE** |
| Website Code Updated | ✅ **DONE** |
| Google Sheets Sync | ✅ **WORKING** |
| Email Notifications | ✅ **WORKING** |
| Forms Logic | ✅ **WORKING** |
| Images | ✅ **VISIBLE** |

---

## ⏱️ **ESTIMATED TIME**

```
Priority 1: Enable Auto-Deploy        [5 min] ✅
Priority 2: Setup Apps Script         [10 min] ⏳
Priority 3: Update Website Code       [3 min] ⏳
Priority 4: Test Everything           [5 min] ⏳
─────────────────────────────────────────────
TOTAL TIME TO COMPLETION              [23 min]
```

---

## 🎯 **WHAT TO DO RIGHT NOW**

**START WITH PRIORITY 1:**

1. Open: https://dash.cloudflare.com
2. Enable GitHub auto-deploy
3. Wait for first build (3-5 min)
4. Reply: "Auto-deploy enabled - build complete!"

**THEN PRIORITY 2:**

5. Create Apps Script
6. Copy Web App URL
7. Reply: "Apps Script ready - URL is [paste]"

**I'll handle the rest!**

---

## 📞 **REPLY OPTIONS**

Choose ONE:

1. ✅ **"Starting Priority 1 now"** - Enabling auto-deploy
2. ✅ **"Priority 1 done - build succeeded"** - Ready for Priority 2
3. ✅ **"Apps Script URL: [paste]"** - Ready for Priority 3
4. ✅ **"Everything deployed - testing now"** - Ready for Priority 4
5. ⚠️ **"Having issues - [describe problem]"** - I'll help debug

---

**🚀 Let's get this done! Start with Priority 1 and report back!**
