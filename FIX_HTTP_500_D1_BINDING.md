# 🔧 FIX: HTTP 500 Error - D1 Binding Not Working

## 🔍 **PROBLEM DIAGNOSED**

The API endpoint is returning **HTTP 500 (Internal Server Error)** because:
- ❌ `wrangler.jsonc` had `"main": "dist/_worker.js"` (Worker config)
- ❌ But you're deploying to **Pages**, not Workers
- ❌ D1 binding not being passed correctly to Pages Functions

---

## ✅ **SOLUTION**

**On your Windows machine:**

### **Step 1: Update wrangler.jsonc**

**Open:** `C:\Users\~SR~\Documents\GitHub\london-slush\wrangler.jsonc`

**Replace ALL content with:**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "london-slush",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "london-slush-leads",
      "database_id": "e25f3c19-6394-4b7e-933d-51408cc29013"
    }
  ]
}
```

**Key change:** Replaced `"main": "dist/_worker.js"` with `"pages_build_output_dir": "./dist"`

---

### **Step 2: Rebuild and Redeploy**

```bash
npm run build
npx wrangler pages deploy dist --project-name=london-slush --commit-dirty=true
```

---

### **Step 3: Verify D1 Binding Still Exists**

In Cloudflare Dashboard:
1. Workers & Pages → **london-slush** → **Settings**
2. Scroll to: **Functions** → **D1 database bindings**
3. Verify:
   - Variable name: `DB`
   - Database: `london-slush-leads`

**If missing**, add it again.

---

### **Step 4: Test API Endpoint**

```bash
curl -I https://londonslush.com/api/submit-distributor
```

**Expected NOW:** `HTTP/2 405` (Method Not Allowed) - this is GOOD! Means endpoint exists.

**Bad:** `HTTP/2 500` or `Connection reset` - means still broken

---

### **Step 5: Test Full Form Submission**

```bash
curl -X POST https://londonslush.com/api/submit-distributor \
  -d "name=TestUser" \
  -d "phone=9876543210" \
  -d "email=test@test.com" \
  -d "business_type=distributor" \
  -d "city=TestCity" \
  -d "state=TestState" \
  -d "investment_range=15L-25L" \
  -d "timeline=0-30" \
  -d "experience_years=5" \
  -d "current_business=Cafe" \
  -d "outlet_count=1" \
  -d "notes=Test"
```

**Expected:** Should redirect (HTTP 302) or return success

---

### **Step 6: Check Database**

```bash
npx wrangler d1 execute london-slush-leads --command="SELECT id, name, phone, created_at FROM leads ORDER BY created_at DESC LIMIT 5"
```

**Expected:** Should show your test submission!

---

## 📊 **WHAT CHANGED**

### **Before (WRONG):**
```jsonc
{
  "name": "london-slush",
  "main": "dist/_worker.js",        // ❌ Worker config
  "d1_databases": [...]
}
```

**Result:** Deployed as Worker, but Pages expects Functions syntax → D1 binding fails → HTTP 500

### **After (CORRECT):**
```jsonc
{
  "name": "london-slush",
  "pages_build_output_dir": "./dist", // ✅ Pages config
  "d1_databases": [...]
}
```

**Result:** Deployed as Pages, `_worker.js` runs as Pages Function → D1 binding works → Forms save to database ✅

---

## 🎯 **WHY THIS MATTERS**

**Cloudflare Pages vs Workers:**

| Feature | Pages | Workers |
|---------|-------|---------|
| Config | `pages_build_output_dir` | `main` |
| Functions | `_worker.js` auto-detected | Explicit `main` file |
| D1 Binding | Via Dashboard + wrangler.jsonc | Via wrangler.jsonc only |
| Static Files | Built-in CDN | Need assets config |

Your app uses **`@hono/vite-cloudflare-pages`** = designed for **Pages**, not Workers!

---

## ⏱️ **TIMELINE**

| Step | Duration |
|------|----------|
| Update wrangler.jsonc | 1 min |
| Rebuild + Deploy | 3 min |
| Verify binding | 1 min |
| Test API | 1 min |
| Check database | 1 min |
| **TOTAL** | **7 min** |

---

## 💬 **REPLY AFTER REDEPLOYMENT**

- ✅ **"Config updated, redeployed - API returns HTTP 405 now"** → Great!
- ✅ **"Test submission saved to database!"** → Perfect! Next: Google Sheets
- ⚠️ **"Still HTTP 500"** → We'll check logs
- ❌ **"Error: [paste error]"** → I'll help fix

**Update config and redeploy now!** 🚀
