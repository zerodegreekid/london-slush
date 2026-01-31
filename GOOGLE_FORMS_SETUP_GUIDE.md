# Google Forms Auto-Sync Setup Guide

## 📋 **STEP-BY-STEP SETUP**

### **Step 1: Create Google Form**

1. Go to https://forms.google.com
2. Click **"+ Blank"** to create a new form
3. Title: **"London Slush Leads"**
4. Description: **"Automated lead capture from website"**

### **Step 2: Add Form Fields**

Add these fields **in exact order**:

#### **Field 1: Name**
- Type: **Short answer**
- Question: **"Name"**
- Required: ✅ ON

#### **Field 2: Phone**
- Type: **Short answer**
- Question: **"Phone"**
- Required: ✅ ON

#### **Field 3: Email**
- Type: **Short answer**
- Question: **"Email"**
- Required: ❌ OFF

#### **Field 4: State/UT**
- Type: **Short answer** (we'll submit directly, not dropdown)
- Question: **"State/UT"**
- Required: ❌ OFF

#### **Field 5: District & PIN**
- Type: **Short answer**
- Question: **"District & PIN"**
- Required: ❌ OFF

#### **Field 6: Investment Range**
- Type: **Multiple choice**
- Question: **"Investment Range"**
- Options:
  - ₹15 Lakh – ₹25 Lakh
  - ₹25 Lakh – ₹40 Lakh
  - ₹40 Lakh – ₹50 Lakh+
- Required: ❌ OFF

#### **Field 7: Timeline**
- Type: **Multiple choice**
- Question: **"Timeline"**
- Options:
  - Within 1 month
  - 1-2 months
  - 2-3 months
  - 3+ months
- Required: ❌ OFF

#### **Field 8: Experience**
- Type: **Short answer**
- Question: **"Experience (years)"**
- Required: ❌ OFF

#### **Field 9: Outlet Count**
- Type: **Short answer**
- Question: **"Outlet Count"**
- Required: ❌ OFF

#### **Field 10: Current Business**
- Type: **Short answer**
- Question: **"Current Business"**
- Required: ❌ OFF

#### **Field 11: Business Type**
- Type: **Multiple choice**
- Question: **"Business Type"**
- Options:
  - distributor
  - retail
- Required: ❌ OFF

#### **Field 12: Notes**
- Type: **Paragraph**
- Question: **"Notes"**
- Required: ❌ OFF

### **Step 3: Get Pre-filled Link**

1. Click **three dots (⋮)** in top-right
2. Select **"Get pre-filled link"**
3. Fill in ALL fields with dummy data:
   - Name: Test
   - Phone: 9999999999
   - Email: test@test.com
   - State/UT: Maharashtra
   - District & PIN: Mumbai - 400001
   - Investment Range: ₹15 Lakh – ₹25 Lakh
   - Timeline: Within 1 month
   - Experience: 3
   - Outlet Count: 10
   - Current Business: Test Business
   - Business Type: distributor
   - Notes: Test notes
4. Click **"Get link"**
5. Click **"COPY LINK"**

### **Step 4: Extract Entry IDs**

The URL will look like this:
```
https://docs.google.com/forms/d/e/1FAIpQLSc...FORM_ID.../viewform?usp=pp_url&entry.123456789=Test&entry.987654321=9999999999&...
```

**Write down the entry IDs:**
- `entry.XXXXXX` for Name
- `entry.XXXXXX` for Phone
- `entry.XXXXXX` for Email
- etc.

### **Step 5: Link Form to Google Sheet**

1. In your Google Form, click **"Responses"** tab
2. Click green **spreadsheet icon** (📊)
3. Select **"Create a new spreadsheet"**
4. Name: **"London Slush Leads"**
5. Click **"Create"**
6. ✅ Done! Your sheet is now linked

The sheet will be created at:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

### **Step 6: Provide Entry IDs**

**Send me the complete pre-filled URL** or the **entry IDs**, and I'll update the code to automatically submit to your Google Form.

---

## 📝 **EXAMPLE**

If your pre-filled URL is:
```
https://docs.google.com/forms/d/e/1FAIpQLSc.../formResponse?entry.123456789=Test&entry.987654321=9999999999&entry.456789123=test@test.com...
```

The entry IDs are:
- Name: `entry.123456789`
- Phone: `entry.987654321`
- Email: `entry.456789123`
- etc.

---

## 🎯 **WHAT HAPPENS AFTER SETUP**

Once you provide the entry IDs:

1. I'll update the form submission handler
2. Every form submission will automatically:
   - ✅ Save to database
   - ✅ Send emails (info@ and support@)
   - ✅ Submit to Google Form
   - ✅ Auto-append to Google Sheet
3. Real-time sync to your Google Sheet ✅
4. No manual CSV export needed ✅

---

## ⚡ **QUICK SETUP SUMMARY**

```
1. Create Google Form ✅
2. Add 12 fields ✅
3. Get pre-filled link ✅
4. Extract entry IDs ✅
5. Link to Google Sheet ✅
6. Provide entry IDs to me ✅
7. I update the code ✅
8. Auto-sync working! ✅
```

**Time Required**: 5-10 minutes  
**Difficulty**: Easy ⭐⭐☆☆☆  
**Result**: Real-time auto-append to Google Sheets

---

## 📞 **NEXT STEP**

**After you create the form and get the pre-filled URL:**

1. Copy the complete URL
2. Send it to me
3. I'll extract the entry IDs and update the code
4. Auto-sync will be working!

**Or provide the entry IDs directly** in this format:
```
Name: entry.123456789
Phone: entry.987654321
Email: entry.456789123
State: entry.111111111
District: entry.222222222
Investment: entry.333333333
Timeline: entry.444444444
Experience: entry.555555555
Outlet Count: entry.666666666
Current Business: entry.777777777
Business Type: entry.888888888
Notes: entry.999999999
```

Ready when you are! 🚀
