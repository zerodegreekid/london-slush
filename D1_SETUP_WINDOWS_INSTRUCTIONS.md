# 🚀 D1 DATABASE SETUP - Windows Instructions

## ✅ **Database Created Successfully!**

Database ID: `e25f3c19-6394-4b7e-933d-51408cc29013`

---

## 📋 **NEXT STEPS ON YOUR WINDOWS MACHINE**

### **Step 1: Pull Latest Changes**

```bash
cd C:\Users\~SR~\Documents\GitHub\london-slush
git pull origin main
```

This will get:
- ✅ Updated `wrangler.jsonc` with D1 config
- ✅ Migration file: `migrations/0001_create_leads_table.sql`

---

### **Step 2: Apply Database Migrations**

```bash
npx wrangler d1 migrations apply london-slush-leads
```

**When prompted, type:** `y` (to confirm)

**Expected output:**
```
🌀 Executing on london-slush-leads (e25f3c19-6394-4b7e-933d-51408cc29013):
🌀 To execute on your local DB, remove the --remote flag from your wrangler command.
🚣 Executed 0001_create_leads_table.sql migration
✅ Successfully applied 1 migration
```

---

### **Step 3: Verify Database Tables**

```bash
npx wrangler d1 execute london-slush-leads --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected output:**
```
┌──────────────────────┐
│ name                 │
├──────────────────────┤
│ leads                │
│ form_submissions     │
│ d1_migrations        │
└──────────────────────┘
```

---

### **Step 4: Deploy to Pages with D1**

```bash
npm run build
npx wrangler pages deploy dist --project-name=london-slush
```

---

### **Step 5: Add D1 Binding in Cloudflare Dashboard**

**CRITICAL**: Pages deployment won't have D1 access until you bind it in the Dashboard.

1. **Go to:** https://dash.cloudflare.com

2. **Navigate to:**
   - Workers & Pages → **london-slush** (Pages project)
   - Click: **Settings** tab

3. **Add D1 Binding:**
   - Scroll to: **Functions** section → **D1 database bindings**
   - Click: **Add binding**
   - Variable name: `DB`
   - D1 Database: Select `london-slush-leads`
   - Click: **Save**

**IMPORTANT:** After adding the binding, you may need to redeploy:
```bash
npx wrangler pages deploy dist --project-name=london-slush
```

---

### **Step 6: Test Form Submission**

1. **Visit:** https://londonslush.com/distributor

2. **Fill form with test data:**
   - Name: Test User
   - Phone: 9876543210
   - Email: test@londonslush.com
   - Business type: Distributor
   - Fill other required fields

3. **Submit form**

4. **Check if saved to database:**
   ```bash
   npx wrangler d1 execute london-slush-leads --command="SELECT id, name, phone, email, created_at FROM leads ORDER BY created_at DESC LIMIT 5"
   ```

**Expected output:**
```
┌────┬───────────┬────────────┬─────────────────────┬─────────────────────┐
│ id │ name      │ phone      │ email               │ created_at          │
├────┼───────────┼────────────┼─────────────────────┼─────────────────────┤
│ 1  │ Test User │ 9876543210 │ test@londonslush... │ 2026-02-03 22:15:32 │
└────┴───────────┴────────────┴─────────────────────┴─────────────────────┘
```

---

## ✅ **SUCCESS CRITERIA**

After completing all steps, verify:

- [ ] Migrations applied successfully
- [ ] Database tables created (leads, form_submissions)
- [ ] D1 binding added in Dashboard
- [ ] Pages redeployed
- [ ] Test form submission saved to database

---

## 🚨 **TROUBLESHOOTING**

### **If form submission NOT saved:**

1. **Check D1 binding:**
   - Dashboard → Workers & Pages → london-slush → Settings → Functions
   - Verify `DB` binding exists

2. **Check browser console:**
   - Visit form page
   - Press F12
   - Submit form
   - Look for errors in Console tab

3. **Check database:**
   ```bash
   npx wrangler d1 execute london-slush-leads --command="SELECT COUNT(*) as total FROM leads"
   ```

---

## 🎯 **AFTER D1 IS WORKING**

Once you confirm leads are being saved (Step 6), we'll immediately set up:

### **Next Priority 1: Google Sheets Worker Secrets** (10 min)
Configure automatic sync to your spreadsheet

### **Next Priority 2: Email Notifications** (5 min)
Get notified when new leads submit

---

## 💬 **REPLY AFTER EACH STEP**

- ✅ **"Step 1: Pulled latest changes"**
- ✅ **"Step 2: Migrations applied successfully"**
- ✅ **"Step 3: Tables verified - 3 tables created"**
- ✅ **"Step 4: Pages deployed"**
- ✅ **"Step 5: D1 binding added in Dashboard"**
- ✅ **"Step 6: Test submission saved! Database working!"**

---

## ⏱️ **Timeline**

| Step | Duration | Total |
|------|----------|-------|
| Pull changes | 30s | 0.5 min |
| Apply migrations | 1 min | 1.5 min |
| Verify tables | 30s | 2 min |
| Deploy Pages | 1 min | 3 min |
| Add D1 binding | 2 min | 5 min |
| Test submission | 2 min | **7 min** |

**Start with Step 1: `git pull origin main`** 🚀
