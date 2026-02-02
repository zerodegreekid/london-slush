# London Slush - Critical Bug Diagnostic Report
**Date:** 2026-02-02  
**Priority:** HIGH  
**Status:** IN PROGRESS

## 🚨 CRITICAL ISSUE: Google Sheets Sync Not Working

### Root Cause Analysis

#### Problem 1: Separate Worker Deployment Issue
**Current Architecture:**
- Frontend sends POST to: `https://london-slush.bijnorservices.workers.dev`
- This is a **SEPARATE Cloudflare Worker** (not the Pages Worker)
- The Worker at `bijnorservices.workers.dev` needs to be deployed separately
- **Status:** Worker returns HTTP 405 (Method Not Allowed) on GET, but POST should work

#### Problem 2: Google Sheets Credentials Configuration
**Required Setup:**
1. The separate Worker needs Google Service Account credentials configured as secrets
2. Credentials must include:
   - `GOOGLE_SHEETS_CREDENTIALS` (full JSON)
   - `GOOGLE_SHEET_ID` (1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw)
   - `SHEETS_ENABLED=true`

#### Problem 3: CORS Configuration
**Status:** CORS is enabled in the Pages Worker but needs verification on the separate Worker

---

## 🔍 DETAILED FINDINGS

### 1. Google Sheets Worker Integration

**Current Code Flow:**
```typescript
// In index.tsx (Lines 334 & 485)
const response = await fetch('https://london-slush.bijnorservices.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(workerData)
})
```

**Issue:**
- The separate Worker (`london-slush.bijnorservices.workers.dev`) is **NOT deployed** or **NOT configured**
- This Worker should:
  1. Accept POST requests with lead data
  2. Authenticate with Google OAuth2
  3. Append data to Google Sheets
  4. Return success/failure response

**Solution Required:**
Create and deploy a separate Cloudflare Worker specifically for Google Sheets sync.

---

### 2. Form Conditional Logic Issues

#### A. Distributor Form - "Existing Network Size" Field
**Location:** Lines 2808-2835 in index.tsx

**Current Behavior:**
- Field is always visible and optional
- No logic to hide when user selects "New to distribution" (experience_years=0)

**Required Fix:**
Add JavaScript to:
1. Listen to changes on `name="experience_years"` select
2. When value is "0" (New to distribution):
   - Hide or disable the "Existing Network Size" field
   - Clear any selected value
3. When value is not "0":
   - Show and enable the field

**Implementation:**
```html
<script>
document.addEventListener('DOMContentLoaded', () => {
  const experienceSelect = document.querySelector('select[name="experience_years"]');
  const networkContainer = document.getElementById('network-container');
  const networkSelect = document.querySelector('select[name="outlet_count"]');
  
  experienceSelect.addEventListener('change', (e) => {
    if (e.target.value === '0') {
      networkContainer.style.display = 'none';
      networkSelect.value = '';
      networkSelect.removeAttribute('required');
    } else {
      networkContainer.style.display = 'block';
      networkSelect.setAttribute('required', 'required');
    }
  });
});
</script>
```

#### B. Retail Form - Partnership Model Logic
**Location:** Lines 1890-2050 in index.tsx

**Current Behavior:**
- Two models shown: Partnership (₹0) and Individual (₹2.5L-₹5L)
- No conditional field showing for Individual Model

**Required Fix:**
1. Add a hidden "Partnership Model" select field in the retail form
2. Add "Raw Material Cost" field (initially hidden)
3. Add JavaScript to:
   - When "Individual Model" is selected:
     - Show "Raw Material Cost" field with asterisks (*****) 
     - Clear/void any "Total Cost" or "Investment Cost" fields
   - When "Partnership Model" is selected:
     - Hide "Raw Material Cost" field

**Implementation:**
Add to retail form:
```html
<div>
  <label class="block text-gray-700 font-semibold mb-2">Preferred Partnership Model *</label>
  <select name="partnership_model" id="partnership-model-select" required class="...">
    <option value="">Select model</option>
    <option value="partnership">Partnership Model (₹0 - Profit Sharing)</option>
    <option value="individual">Individual Model (₹2.5L-₹5L - Own Machine)</option>
  </select>
</div>

<div id="raw-material-cost-container" style="display: none;">
  <label class="block text-gray-700 font-semibold mb-2">Raw Material Cost (Monthly) *</label>
  <input type="text" name="raw_material_cost" value="*****" readonly class="..." />
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const modelSelect = document.getElementById('partnership-model-select');
  const rawMaterialContainer = document.getElementById('raw-material-cost-container');
  
  modelSelect.addEventListener('change', (e) => {
    if (e.target.value === 'individual') {
      rawMaterialContainer.style.display = 'block';
    } else {
      rawMaterialContainer.style.display = 'none';
    }
  });
});
</script>
```

---

### 3. Image Loading Issues

**Potential Causes:**
1. **Case Sensitivity:** Cloudflare Pages is case-sensitive
   - HTML: `/Blue-Berry.jpg`
   - File: `/blue-berry.jpg`
   - Result: 404 error

2. **Path Issues:** 
   - All images should use absolute paths starting with `/`
   - Example: `/blue-berry.jpg` not `blue-berry.jpg`

3. **Missing Images:**
   - Verify all referenced images exist in `dist/` folder

**Solution:**
1. Audit all image references in source code
2. Ensure exact case match with filenames in `public/` folder
3. Use absolute paths with leading `/`

---

## 🎯 ACTION PLAN

### Priority 1: Create Separate Google Sheets Worker ✅ RECOMMENDED
**Option A: Dedicated Worker (Best Practice)**
1. Create `workers/sheets-sync/src/index.ts`
2. Implement POST endpoint with OAuth2 + Google Sheets API
3. Configure secrets via `wrangler secret put`
4. Deploy to `london-slush.bijnorservices.workers.dev`

**Option B: Embedded Solution (Quick Fix)**
1. Remove external Worker calls
2. Implement Google Sheets sync directly in Pages Worker
3. Configure secrets in Pages environment

### Priority 2: Implement Form Conditional Logic
1. Add JavaScript for Distributor form (experience → network)
2. Add JavaScript for Retail form (model → raw material cost)
3. Test both forms thoroughly

### Priority 3: Fix Image Loading
1. Audit image paths
2. Verify case sensitivity
3. Test on production

---

## 📊 TESTING CHECKLIST

### Google Sheets Sync
- [ ] Worker receives POST requests
- [ ] OAuth2 token generation works
- [ ] Data appends to Sheet correctly
- [ ] Error handling returns proper responses
- [ ] CORS headers allow frontend requests

### Distributor Form
- [ ] "New to distribution" hides network field
- [ ] Experienced distributors see network field
- [ ] Form submits correctly in both cases
- [ ] Data reaches Google Sheets

### Retail Form
- [ ] Individual Model shows raw material cost
- [ ] Partnership Model hides raw material cost
- [ ] Form submits correctly in both cases
- [ ] Data reaches Google Sheets

### Images
- [ ] All product images load on refresh
- [ ] No 404 errors in browser console
- [ ] Images render correctly across all pages

---

## 🚀 DEPLOYMENT STRATEGY

1. **Fix code in src/index.tsx**
2. **Build:** `npm run build`
3. **Test locally:** `npx wrangler pages dev dist --ip 0.0.0.0 --port 3000`
4. **Deploy:** `npx wrangler pages deploy dist --project-name=london-slush --branch=main --no-bundle`
5. **Verify:** Test all functionality on production
6. **Purge Cache:** Cloudflare Dashboard → Caching → Purge Everything

---

## 📝 NEXT STEPS

**Immediate:**
1. Choose Worker deployment strategy (Option A or B)
2. Implement form conditional logic
3. Audit and fix image paths

**Follow-up:**
1. Monitor Google Sheets for incoming data
2. Test form submissions thoroughly
3. Document final configuration

---

**Report Generated:** 2026-02-02  
**Engineer:** AI Developer  
**Contact:** support@londonslush.com
