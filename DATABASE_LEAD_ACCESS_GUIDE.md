# How to Check Leads Stored in Database - London Slush

## 📊 Current Setup Status

**Database Status**: ⚠️ Currently NOT configured  
**Current Lead Storage**: Email notifications only  
**Emails sent to**: 
- info@londonslush.com
- support@londonslush.com

---

## 🎯 Three Ways to Access Leads

### **Option 1: Email Inbox (CURRENTLY ACTIVE)** ⭐ Easiest
### **Option 2: Local Database (For Testing)** 🧪 Development
### **Option 3: Production D1 Database (Recommended)** 🚀 Best Long-term

---

## 📧 **Option 1: Check Leads via Email** (CURRENT METHOD)

### ✅ Advantages
- ✅ No database setup required
- ✅ Works immediately
- ✅ Emails sent to both addresses
- ✅ High-priority leads flagged
- ✅ Mobile-friendly (check on phone)

### 📥 Where to Check
All form submissions are sent to:

1. **info@londonslush.com** (Primary inbox)
2. **support@londonslush.com** (Support inbox)

### 📧 Email Format
**Subject**: 🚨 New Distributor Lead (HIGH PRIORITY): [Name]

**Email Contains**:
```
⭐ New Distributor Partnership Inquiry (HIGH VALUE)
🚨 HIGH PRIORITY LEAD - Investment Range: ₹15L-25L

Name: Test User
Phone: 8006999805
Email: test@example.com
State/UT: Maharashtra
District & PIN: Mumbai - 400001
Investment Range: ₹15 Lakh – ₹25 Lakh
Timeline: Within 1 month
Experience: 1-3 years
...

⚡ URGENT ACTION REQUIRED
Contact this HIGH-VALUE distributor lead within 4 hours via phone call.
```

### 📱 How to Access
1. Open Gmail (or your email client)
2. Search: `from:noreply@londonslush.com`
3. Or search: `subject:New Distributor Lead`
4. All leads will be listed chronologically

### 📊 Email Organization Tips
**Create Gmail Filters**:
1. Go to Gmail Settings → Filters
2. Create filter: `from:noreply@londonslush.com`
3. Apply label: "London Slush Leads"
4. Mark as important
5. Forward to CRM (optional)

---

## 🧪 **Option 2: Local Database (Development/Testing)**

### 🎯 Purpose
Test database functionality locally before deploying to production.

### Step 1: Check if Local DB Exists
```bash
cd /home/user/webapp

# Check for local D1 database files
ls -la .wrangler/state/v3/d1/
```

**Expected Output**:
```
# If database exists:
miniflare-D1DatabaseObject/
  └── [database-id].sqlite

# If NOT exists:
ls: cannot access '.wrangler/state/v3/d1/': No such file or directory
```

### Step 2: Enable D1 in wrangler.jsonc
```bash
cd /home/user/webapp
nano wrangler.jsonc
```

**Uncomment the D1 configuration**:
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "london-slush",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  
  // UNCOMMENT THIS SECTION:
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "london-slush-leads",
      "database_id": "local-test-db"  // For local testing
    }
  ]
}
```

### Step 3: Create Database Schema
Create migration file:
```bash
mkdir -p migrations
nano migrations/0001_create_leads_table.sql
```

**Migration SQL**:
```sql
-- migrations/0001_create_leads_table.sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,  -- Stores: "State - District - PIN"
  investment_range TEXT,
  timeline TEXT,
  current_business TEXT,
  experience_years TEXT,
  outlet_count TEXT,
  notes TEXT,
  business_type TEXT DEFAULT 'distributor',
  source_page TEXT DEFAULT '/distributor',
  priority TEXT DEFAULT 'high',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_business_type ON leads(business_type);
```

### Step 4: Apply Local Migration
```bash
cd /home/user/webapp

# Apply migration to local database
npx wrangler d1 migrations apply london-slush-leads --local
```

**Expected Output**:
```
🌀 Mapping SQL input into an array of statements
🌀 Parsing 1 statements
🌀 Executing on local database london-slush-leads (local-test-db) from .wrangler/state/v3/d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
├ [#1] CREATE TABLE IF NOT EXISTS leads ...
│
└ Done!
```

### Step 5: Rebuild and Restart
```bash
cd /home/user/webapp
npm run build
pm2 restart london-slush
```

### Step 6: Submit Test Lead
```bash
# Submit a test form
curl -X POST http://localhost:3000/api/submit-distributor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Test Lead Local&phone=9999999999&email=test@local.com&state=Delhi&district_pin=New Delhi - 110001&investment_range=15L-25L&experience_years=3&timeline=0-30&business_type=distributor&source_page=/distributor"
```

### Step 7: Query Local Database
```bash
cd /home/user/webapp

# View all leads
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT * FROM leads ORDER BY created_at DESC LIMIT 10"
```

**Expected Output**:
```
┌────┬─────────────────┬─────────────┬───────────────────┬──────────────────────────────┬──────────────────┬──────────┬─────────────────┬─────────────────┬──────────────┬───────┬───────────────┬──────────────┬──────────┬─────────────────────┐
│ id │ name            │ phone       │ email             │ city                         │ investment_range │ timeline │ current_business│ experience_years│ outlet_count │ notes │ business_type │ source_page  │ priority │ created_at          │
├────┼─────────────────┼─────────────┼───────────────────┼──────────────────────────────┼──────────────────┼──────────┼─────────────────┼─────────────────┼──────────────┼───────┼───────────────┼──────────────┼──────────┼─────────────────────┤
│ 1  │ Test Lead Local │ 9999999999  │ test@local.com    │ Delhi - New Delhi - 110001   │ 15L-25L          │ 0-30     │                 │ 3               │              │       │ distributor   │ /distributor │ high     │ 2026-01-31 18:00:00 │
└────┴─────────────────┴─────────────┴───────────────────┴──────────────────────────────┴──────────────────┴──────────┴─────────────────┴─────────────────┴──────────────┴───────┴───────────────┴──────────────┴──────────┴─────────────────────┘
```

### Useful Local Database Commands

**View all leads**:
```bash
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT * FROM leads ORDER BY created_at DESC"
```

**Count total leads**:
```bash
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT COUNT(*) as total_leads FROM leads"
```

**View leads by investment range**:
```bash
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT name, phone, investment_range, created_at FROM leads WHERE investment_range = '15L-25L' ORDER BY created_at DESC"
```

**View today's leads**:
```bash
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT name, phone, email, city FROM leads WHERE date(created_at) = date('now') ORDER BY created_at DESC"
```

**Export to CSV** (pipe to file):
```bash
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT * FROM leads" \
  --json > leads_export.json
```

---

## 🚀 **Option 3: Production D1 Database (Recommended)**

### ✅ Advantages
- ✅ Scalable (handles millions of leads)
- ✅ Free up to 5GB storage
- ✅ Global replication (fast worldwide)
- ✅ SQL queryable from dashboard
- ✅ Backup and export capabilities
- ✅ API access for integrations

### Step 1: Create Production D1 Database
```bash
cd /home/user/webapp

# Create production database
npx wrangler d1 create london-slush-leads
```

**Expected Output**:
```
✅ Successfully created DB 'london-slush-leads'!

[[d1_databases]]
binding = "DB"
database_name = "london-slush-leads"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**⚠️ IMPORTANT**: Copy the `database_id` from the output!

### Step 2: Update wrangler.jsonc
```bash
nano wrangler.jsonc
```

**Update configuration**:
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
      "database_id": "PASTE-YOUR-DATABASE-ID-HERE"  // ⚠️ Replace with actual ID
    }
  ]
}
```

### Step 3: Create Migrations (Same as Local)
```bash
mkdir -p migrations
nano migrations/0001_create_leads_table.sql
```

**(Use the same SQL from Option 2, Step 3)**

### Step 4: Apply Production Migration
```bash
cd /home/user/webapp

# Apply migration to PRODUCTION database (no --local flag)
npx wrangler d1 migrations apply london-slush-leads
```

**Expected Output**:
```
🌀 Mapping SQL input into an array of statements
🌀 Parsing 1 statements
🌀 Executing on remote database london-slush-leads (a1b2c3d4-e5f6-7890-abcd-ef1234567890):
├ [#1] CREATE TABLE IF NOT EXISTS leads ...
│
└ Done!
```

### Step 5: Deploy to Production
```bash
cd /home/user/webapp

# Build and deploy
npm run build
npm run deploy:prod

# Or manually:
# wrangler pages deploy dist --project-name london-slush
```

### Step 6: View Production Leads

#### **Method 1: Wrangler CLI (Terminal)**
```bash
# View all leads
npx wrangler d1 execute london-slush-leads \
  --command="SELECT * FROM leads ORDER BY created_at DESC LIMIT 20"

# Count total leads
npx wrangler d1 execute london-slush-leads \
  --command="SELECT COUNT(*) as total FROM leads"

# View today's leads
npx wrangler d1 execute london-slush-leads \
  --command="SELECT name, phone, email, city, created_at FROM leads WHERE date(created_at) = date('now')"
```

#### **Method 2: Cloudflare Dashboard (Web UI)** ⭐ Easiest

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/
   - Login with your account

2. **Navigate to Workers & Pages**
   - Click: "Workers & Pages" in left sidebar

3. **Select D1 Databases**
   - Click: "D1" tab at the top

4. **Open Your Database**
   - Find: "london-slush-leads"
   - Click on it

5. **Query Console**
   - Click: "Console" tab
   - You'll see a SQL query box

6. **Run Queries**
   ```sql
   -- View all leads
   SELECT * FROM leads ORDER BY created_at DESC LIMIT 50;
   
   -- Count by investment range
   SELECT investment_range, COUNT(*) as count 
   FROM leads 
   GROUP BY investment_range;
   
   -- View high-priority leads
   SELECT name, phone, email, city, investment_range
   FROM leads 
   WHERE priority = 'high'
   ORDER BY created_at DESC;
   ```

#### **Method 3: Cloudflare API (Programmatic)**
```bash
# Get your Account ID from dashboard
# Get your API Token from: Profile → API Tokens

curl "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/d1/database/YOUR_DATABASE_ID/query" \
  -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM leads ORDER BY created_at DESC LIMIT 10"
  }'
```

---

## 📊 **Useful SQL Queries for Lead Management**

### View Recent Leads
```sql
SELECT 
  name, 
  phone, 
  email, 
  city, 
  investment_range,
  created_at
FROM leads 
ORDER BY created_at DESC 
LIMIT 20;
```

### Count Leads by Investment Range
```sql
SELECT 
  investment_range, 
  COUNT(*) as count
FROM leads 
GROUP BY investment_range
ORDER BY count DESC;
```

### View Today's Leads
```sql
SELECT * 
FROM leads 
WHERE date(created_at) = date('now')
ORDER BY created_at DESC;
```

### View Leads by State
```sql
SELECT 
  city,  -- Contains "State - District - PIN"
  name,
  phone,
  investment_range
FROM leads 
WHERE city LIKE '%Maharashtra%'
ORDER BY created_at DESC;
```

### High-Value Leads (40L+)
```sql
SELECT 
  name, 
  phone, 
  email, 
  investment_range,
  experience_years,
  created_at
FROM leads 
WHERE investment_range = '40L-50L+'
ORDER BY created_at DESC;
```

### Export All Leads (CSV Format)
```bash
# Using wrangler with JSON output
npx wrangler d1 execute london-slush-leads \
  --command="SELECT * FROM leads ORDER BY created_at DESC" \
  --json > all_leads.json

# Convert to CSV using jq (if installed)
cat all_leads.json | jq -r '
  (.[0] | keys_unsorted) as $keys |
  $keys, 
  (.[] | [.[$keys[]]] | @csv)
' > all_leads.csv
```

---

## 🎯 **Recommended Setup** (Best of Both Worlds)

### **Phase 1: Current (Email Only)** ✅ Already Working
- ✅ Forms submit successfully
- ✅ Emails sent to info@ and support@
- ✅ No database setup required
- ✅ Zero maintenance

**Good for**: Quick start, testing, low volume

### **Phase 2: Add Production Database** (Next Step)
1. Create production D1 database
2. Update wrangler.jsonc
3. Apply migrations
4. Deploy to production
5. Keep email notifications too!

**Benefits**:
- ✅ Both email AND database storage
- ✅ Queryable lead history
- ✅ Export and analytics capabilities
- ✅ Backup and redundancy

---

## 📱 **Quick Access Cheatsheet**

### Email (Current Method)
```
✅ Check: info@londonslush.com
✅ Check: support@londonslush.com
✅ Search: "New Distributor Lead"
```

### Local Database (Testing)
```bash
# View leads
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT * FROM leads ORDER BY created_at DESC LIMIT 10"

# Count leads
npx wrangler d1 execute london-slush-leads --local \
  --command="SELECT COUNT(*) FROM leads"
```

### Production Database
```bash
# View leads (remove --local)
npx wrangler d1 execute london-slush-leads \
  --command="SELECT * FROM leads ORDER BY created_at DESC LIMIT 20"

# Or use Cloudflare Dashboard:
# https://dash.cloudflare.com/ → D1 → london-slush-leads → Console
```

---

## 🚨 **Troubleshooting**

### "Database not found"
**Solution**: Create database first:
```bash
npx wrangler d1 create london-slush-leads
```

### "Table doesn't exist"
**Solution**: Run migrations:
```bash
# Local
npx wrangler d1 migrations apply london-slush-leads --local

# Production
npx wrangler d1 migrations apply london-slush-leads
```

### "No leads showing up"
**Check**:
1. Is form submitting? (Check thank you page redirect)
2. Are emails arriving? (Check both inboxes)
3. Is database enabled in wrangler.jsonc?
4. Did migrations run successfully?

### "Permission denied"
**Solution**: Verify Cloudflare API authentication:
```bash
npx wrangler whoami
```

---

## 📚 **Next Steps**

### Immediate (Keep Current Setup)
✅ Continue using email notifications  
✅ Check leads in info@londonslush.com  
✅ Check leads in support@londonslush.com

### Short-term (Recommended)
1. Create production D1 database
2. Enable in wrangler.jsonc
3. Run migrations
4. Deploy to production
5. Start collecting leads in DB + Email

### Long-term (Advanced)
1. Build admin dashboard for lead management
2. Add CRM integration (Zoho, Salesforce)
3. Set up automated lead scoring
4. Create analytics and reports
5. Add export and backup automation

---

## ✨ **Summary**

**Current Status**: ✅ Leads sent to email (working perfectly)

**Check Leads Now**:
1. Open: info@londonslush.com
2. Open: support@londonslush.com
3. Search: "New Distributor Lead"

**Enable Database** (Optional but Recommended):
1. Run: `npx wrangler d1 create london-slush-leads`
2. Update: wrangler.jsonc with database ID
3. Run: migrations
4. Deploy to production
5. Query leads via CLI or dashboard

**Need Help?** Reply with:
- "Set up local database" → I'll guide you step-by-step
- "Set up production database" → I'll create it for you
- "Build admin dashboard" → I'll create a lead management UI
- "Export all leads" → I'll show you how

---

**Last Updated**: January 31, 2026  
**Status**: Email notifications working perfectly ✅
