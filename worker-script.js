/**
 * Cloudflare Worker: London Slush Lead Sync
 * Purpose: Receive form submissions and sync to Google Sheets
 * URL: https://london-slush.bijnorservices.workers.dev
 */

// ============================================
// HELPER: Create JWT for Google OAuth2
// ============================================
async function createGoogleJWT(clientEmail, privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  // Base64URL encode
  const base64UrlEncode = (obj) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  // Import private key
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  // Import key for signing
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
  
  // Sign the data
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  );
  
  // Base64URL encode signature
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${dataToSign}.${signatureBase64}`;
}

// ============================================
// HELPER: Get Google OAuth2 Access Token
// ============================================
async function getGoogleAccessToken(clientEmail, privateKey) {
  try {
    const jwt = await createGoogleJWT(clientEmail, privateKey);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google OAuth token error:', errorText);
      return null;
    }
    
    const { access_token } = await tokenResponse.json();
    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// ============================================
// HELPER: Append Row to Google Sheets
// ============================================
async function appendToGoogleSheet(accessToken, spreadsheetId, rowData) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowData]
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets append error:', errorText);
      return false;
    }
    
    console.log('✅ Successfully synced to Google Sheets');
    return true;
  } catch (error) {
    console.error('Error appending to sheet:', error);
    return false;
  }
}

// ============================================
// MAIN WORKER HANDLER
// ============================================
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    try {
      // Parse form data
      const formData = await request.json();
      console.log('📥 Received form submission:', formData);
      
      // Get secrets from environment
      const {
        GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY,
        GOOGLE_SHEET_ID
      } = env;
      
      // Validate required secrets
      if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
        console.error('❌ Missing required environment variables');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Worker not configured properly' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Prepare row data for Google Sheets
      const timestamp = new Date().toISOString();
      const rowData = [
        formData.id || '',
        formData.name || '',
        formData.phone || '',
        formData.email || '',
        formData.state || '',
        formData.district_pin || '',
        formData.investment_range || '',
        formData.timeline || '',
        formData.experience_years || '',
        formData.current_business || '',
        formData.outlet_count || '',
        formData.business_type || '',
        formData.notes || '',
        timestamp,
        formData.priority || 'HIGH'
      ];
      
      // Get Google OAuth2 access token
      const accessToken = await getGoogleAccessToken(GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY);
      
      if (!accessToken) {
        console.error('❌ Failed to get Google access token');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Authentication failed' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      console.log('✅ Got Google access token');
      
      // Append to Google Sheets
      const syncSuccess = await appendToGoogleSheet(accessToken, GOOGLE_SHEET_ID, rowData);
      
      if (syncSuccess) {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Lead synced to Google Sheets successfully',
          timestamp: timestamp
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to sync to Google Sheets' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Worker error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
