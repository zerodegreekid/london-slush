// Google Forms Auto-Sync Integration
// Add this to your form submission handler in src/index.tsx

/**
 * Submit lead to Google Forms (auto-appends to Google Sheet)
 * This runs after email sending and database save
 */
async function submitToGoogleForm(formData: any) {
  try {
    // ⚠️ UPDATE THESE VALUES AFTER CREATING YOUR GOOGLE FORM
    const GOOGLE_FORM_ID = 'YOUR_FORM_ID_HERE' // Get from form URL
    const ENTRY_IDS = {
      name: 'entry.XXXXXX',           // Replace XXXXXX with actual entry ID
      phone: 'entry.XXXXXX',          // Replace XXXXXX with actual entry ID
      email: 'entry.XXXXXX',          // Replace XXXXXX with actual entry ID
      state: 'entry.XXXXXX',          // Replace XXXXXX with actual entry ID
      district_pin: 'entry.XXXXXX',   // Replace XXXXXX with actual entry ID
      investment_range: 'entry.XXXXXX', // Replace XXXXXX with actual entry ID
      timeline: 'entry.XXXXXX',       // Replace XXXXXX with actual entry ID
      experience_years: 'entry.XXXXXX', // Replace XXXXXX with actual entry ID
      outlet_count: 'entry.XXXXXX',   // Replace XXXXXX with actual entry ID
      current_business: 'entry.XXXXXX', // Replace XXXXXX with actual entry ID
      business_type: 'entry.XXXXXX',  // Replace XXXXXX with actual entry ID
      notes: 'entry.XXXXXX'           // Replace XXXXXX with actual entry ID
    }

    const googleFormUrl = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`
    
    const googleFormData = new URLSearchParams({
      [ENTRY_IDS.name]: formData.name || '',
      [ENTRY_IDS.phone]: formData.phone || '',
      [ENTRY_IDS.email]: formData.email || '',
      [ENTRY_IDS.state]: formData.state || '',
      [ENTRY_IDS.district_pin]: formData.district_pin || '',
      [ENTRY_IDS.investment_range]: formData.investment_range || '',
      [ENTRY_IDS.timeline]: formData.timeline || '',
      [ENTRY_IDS.experience_years]: formData.experience_years || '',
      [ENTRY_IDS.outlet_count]: formData.outlet_count || '',
      [ENTRY_IDS.current_business]: formData.current_business || '',
      [ENTRY_IDS.business_type]: formData.business_type || '',
      [ENTRY_IDS.notes]: formData.notes || ''
    })

    // Submit to Google Form (non-blocking, no-cors mode)
    fetch(googleFormUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: googleFormData.toString(),
      mode: 'no-cors' // Required for Google Forms
    }).catch(err => {
      console.log('Google Form submission completed (no-cors response expected)')
    })

    console.log('✅ Lead submitted to Google Form (will appear in linked Sheet)')
  } catch (error) {
    console.error('Google Form submission error (non-critical):', error)
    // Don't throw - this is a nice-to-have feature
  }
}

// ============================================
// ADD THIS TO YOUR FORM HANDLER
// ============================================

// In app.post('/api/submit-distributor', ...) handler
// Add this AFTER the email sending code:

app.post('/api/submit-distributor', async (c) => {
  try {
    const formData = await c.req.parseBody()
    const { DB } = c.env

    // ... existing database code ...

    // ... existing email code ...

    // ✅ ADD THIS: Submit to Google Forms
    submitToGoogleForm(formData)

    // Redirect to thank you page
    return c.redirect(`/thank-you?type=distributor&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) {
    // ... existing error handling ...
  }
})

// ============================================
// INSTRUCTIONS
// ============================================

/*
1. Create Google Form following GOOGLE_FORMS_SETUP_GUIDE.md
2. Get pre-filled link from Google Form
3. Extract entry IDs from the URL
4. Update GOOGLE_FORM_ID and ENTRY_IDS above
5. Rebuild and deploy: npm run build && pm2 restart london-slush
6. Test form submission
7. Check Google Sheet - new rows should appear automatically!

Example Entry ID Extraction:
Pre-filled URL: https://docs.google.com/forms/d/e/1FAIpQLSc.../formResponse?entry.123456789=Test&entry.987654321=9999999999

Entry IDs:
- Name: entry.123456789
- Phone: entry.987654321
- etc.

Replace XXXXXX with the actual numbers in the ENTRY_IDS object above.
*/
