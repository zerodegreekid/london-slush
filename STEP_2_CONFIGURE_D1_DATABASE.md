# 📊 STEP 2: Configure D1 Database Bindings

**Prerequisites**: Step 1 (Auto-deploy) must be complete

**Time Required**: 5 minutes

---

## 🎯 **What We're Doing:**

Right now, your D1 database works **locally** but production doesn't know about it. We need to:

1. Create a production D1 database
2. Tell Cloudflare Pages to use it
3. Run migrations to create tables

---

## 📝 **STEP 2.1: Create Production D1 Database** [2 min]

### **Option A: Using Wrangler CLI (From Your Machine)**

Open Command Prompt and run:

```bash
cd C:\Users\~SR\Documents\GitHub\london-slush
npx wrangler d1 create london-slush-leads
```

**Expected Output:**
```
✅ Successfully created DB 'london-slush-leads'

[[d1_databases]]
binding = "DB"
database_name = "london-slush-leads"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

Copy this into your wrangler.jsonc file
```

**IMPORTANT**: Copy the `database_id` - you'll need it in Step 2.2!

---

## 📝 **STEP 2.2: Update wrangler.jsonc** [2 min]

I'll do this for you automatically once you provide the `database_id`.

**Current wrangler.jsonc:**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "london-slush",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"]
}
```

**Updated wrangler.jsonc (with D1 binding):**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "london-slush",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  // Add D1 database binding
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "london-slush-leads",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

---

## 📝 **STEP 2.3: Check for Migrations** [1 min]

Let me verify if migrations exist:

```bash
ls migrations/
```

**If migrations exist**: We'll run them in Step 2.4
**If no migrations**: We'll create them from your local schema

---

## 📝 **STEP 2.4: Run Migrations on Production** [2 min]

After database is created and wrangler.jsonc is updated, run:

```bash
cd C:\Users\~SR\Documents\GitHub\london-slush
npx wrangler d1 migrations apply london-slush-leads
```

**Expected Output:**
```
Migrations to be applied:
├ 0001_initial_schema.sql
└ 0002_create_leads_table.sql

Applying migrations...
✅ Successfully applied 2 migrations
```

**This creates all tables** (leads, form_submissions, etc.) in production database.

---

## 🔍 **STEP 2.5: Verify Production Database** [1 min]

Check if tables were created:

```bash
npx wrangler d1 execute london-slush-leads --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected Output:**
```
┌─────────────────────┐
│ name                │
├─────────────────────┤
│ leads               │
│ form_submissions    │
│ d1_migrations       │
│ sqlite_sequence     │
└─────────────────────┘
```

---

## 📝 **STEP 2.6: Push Updated Config to GitHub** [2 min]

After I update wrangler.jsonc for you:

```bash
cd C:\Users\~SR\Documents\GitHub\london-slush
git add wrangler.jsonc
git commit -m "Configure D1 database for production"
git push origin main
```

Cloudflare will auto-deploy (3-5 min) with D1 database configured.

---

## ✅ **Success Indicators:**

After completing Step 2, you should have:

- [x] Production D1 database created
- [x] `database_id` added to wrangler.jsonc
- [x] Migrations run successfully
- [x] Tables exist in production database
- [x] Config pushed to GitHub
- [x] Auto-deploy completed

---

## 📞 **After Completing Step 2:**

Reply with:

✅ **"D1 configured - database_id is: [paste ID]"**
   → I'll update wrangler.jsonc and push to GitHub

⚠️ **"Error creating database: [paste error]"**
   → I'll help debug

---

## 🔧 **Troubleshooting:**

### **Error: "Authentication failed"**

**Fix:**
```bash
npx wrangler login
```
Follow the browser prompt to authenticate.

### **Error: "No migrations found"**

**Fix:**
I'll create migrations from your local schema and push them to GitHub.

### **Error: "Database already exists"**

**Fix:**
List existing databases:
```bash
npx wrangler d1 list
```
Use the existing `database_id` instead of creating new one.

---

**🚀 Ready to start Step 2? Let me know when Step 1 is complete!**
