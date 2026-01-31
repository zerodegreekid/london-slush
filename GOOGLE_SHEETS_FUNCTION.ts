// Google Sheets Auto-Append Helper Function
// Add this to src/index.tsx after the sendEmailNotification function

/**
 * Append lead to Google Sheets automatically
 * Requires GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEETS_ID as Cloudflare Secrets
 */
async function appendToGoogleSheets(
  credentials: string,
  spreadsheetId: string,
  leadData: any
) {
  try {
    // Parse credentials
    const creds = JSON.parse(credentials)
    
    // Get access token
    const jwtHeader = btoa(JSON.stringify({
      alg: 'RS256',
      typ: 'JWT'
    }))
    
    const now = Math.floor(Date.now() / 1000)
    const jwtClaim = btoa(JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }))
    
    // Note: Full JWT signing requires crypto implementation
    // For production, use a library or Cloudflare Workers crypto
    
    // Prepare row data
    const row = [
      leadData.id || '',
      leadData.name || '',
      leadData.phone || '',
      leadData.email || '',
      leadData.city || '',
      leadData.investment_range || '',
      leadData.timeline || '',
      leadData.current_business || '',
      leadData.experience_years || '',
      leadData.outlet_count || '',
      leadData.business_type || '',
      leadData.priority || '',
      leadData.source_page || '',
      leadData.notes || '',
      new Date().toISOString()
    ]
    
    // Append to sheet (simplified - requires proper OAuth token)
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ACCESS_TOKEN_HERE`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row]
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Google Sheets append error:', error)
    throw error
  }
}
