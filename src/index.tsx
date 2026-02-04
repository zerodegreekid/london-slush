import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database;
  GOOGLE_SHEETS_CREDENTIALS?: string;
  GOOGLE_SHEET_ID?: string;
  SHEETS_ENABLED?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// =============================================
// API ROUTES - FORM SUBMISSION HANDLERS
// =============================================

// Helper function to create JWT for Google OAuth2
async function createGoogleJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }
  
  // Base64URL encode header and payload
  const base64UrlEncode = (obj: any) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)
  const dataToSign = `${encodedHeader}.${encodedPayload}`
  
  // Import private key
  const privateKey = credentials.private_key
    .replace(/\\n/g, '\n')
  
  // Convert PEM to binary
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
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
  )
  
  // Sign the data
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  )
  
  // Base64URL encode signature
  const signatureArray = new Uint8Array(signature)
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `${dataToSign}.${signatureBase64}`
}

// Helper function to get Google OAuth2 access token
async function getGoogleAccessToken(credentials: any): Promise<string | null> {
  try {
    const jwt = await createGoogleJWT(credentials)
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Google OAuth token request failed:', errorText)
      return null
    }
    
    const { access_token } = await tokenResponse.json() as { access_token: string }
    return access_token
    
  } catch (error) {
    console.error('❌ Error getting Google access token:', error)
    return null
  }
}

// Helper function to append lead to Google Sheets
async function appendToGoogleSheet(
  credentials: string,
  spreadsheetId: string,
  leadData: any
) {
  try {
    console.log('🔄 Starting Google Sheets sync...')
    
    // Parse credentials
    const creds = JSON.parse(credentials)
    
    // Get OAuth2 access token
    const accessToken = await getGoogleAccessToken(creds)
    if (!accessToken) {
      console.error('❌ Failed to get Google access token')
      return false
    }
    
    console.log('✅ Got Google access token')
    
    // Prepare row data
    const rowData = [
      leadData.id || '',
      leadData.name || '',
      leadData.phone || '',
      leadData.email || '',
      leadData.state || '',
      leadData.district_pin || '',
      leadData.investment_range || '',
      leadData.timeline || '',
      leadData.experience_years || '',
      leadData.current_business || '',
      leadData.outlet_count || '',
      leadData.business_type || '',
      leadData.notes || '',
      leadData.created_at || new Date().toISOString(),
      leadData.priority || 'HIGH'
    ]
    
    // Append to Google Sheets
    const sheetsResponse = await fetch(
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
    )
    
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text()
      console.error('❌ Google Sheets append failed:', errorText)
      return false
    }
    
    const result = await sheetsResponse.json()
    console.log('✅ Successfully synced to Google Sheets:', result)
    return true
    
  } catch (error) {
    console.error('❌ Google Sheets sync error:', error)
    return false
  }
}

// Helper function to send email notifications
async function sendEmailNotification(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
) {
  try {
    // Using MailChannels API (free with Cloudflare Workers)
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: 'noreply@londonslush.com',
          name: 'London Slush Leads',
        },
        subject: subject,
        content: [
          {
            type: 'text/plain',
            value: textBody,
          },
          {
            type: 'text/html',
            value: htmlBody,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Email send failed:', await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('Email error:', error)
    return false
  }
}

// Retail Form Handler
app.post('/api/submit-retail', async (c) => {
  try {
    const formData = await c.req.parseBody()
    const { DB } = c.env

    // Insert lead into database (if DB is available)
    if (DB) {
      try {
        await DB.prepare(`
      INSERT INTO leads (
        name, phone, email, city, investment_range, timeline,
        current_business, outlet_count, notes, business_type, source_page, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      formData.name,
      formData.phone,
      formData.email || null,
      formData.city,
      formData.investment_range,
      formData.timeline,
      formData.current_business || null,
      formData.outlet_count || null,
      formData.notes || null,
      formData.business_type,
      formData.source_page
    ).run()
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError)
        // Continue with email sending even if DB fails
      }
    } else {
      console.warn('Database not configured - lead will be sent via email only')
    }

    // Send email notification to both addresses
    const emailSubject = `🔔 New Retail Lead: ${formData.name}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc1f26;">New Retail Partnership Inquiry</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Phone:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${formData.email || 'Not provided'}">${formData.email || 'Not provided'}</a></p>
          <p><strong>City:</strong> ${formData.city}</p>
          <p><strong>Investment Range:</strong> ${formData.investment_range}</p>
          <p><strong>Timeline:</strong> ${formData.timeline}</p>
          <p><strong>Current Business:</strong> ${formData.current_business || 'Not specified'}</p>
          <p><strong>Outlet Count:</strong> ${formData.outlet_count || 'Not specified'}</p>
          <p><strong>Business Type:</strong> ${formData.business_type}</p>
          ${formData.notes ? `<p><strong>Notes:</strong> ${formData.notes}</p>` : ''}
          <p><strong>Source:</strong> ${formData.source_page}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">
          <strong>Action Required:</strong> Contact this lead within 24 hours via WhatsApp or phone call.
        </p>
      </div>
    `
    const emailText = `
New Retail Partnership Inquiry

Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email || 'Not provided'}
City: ${formData.city}
Investment Range: ${formData.investment_range}
Timeline: ${formData.timeline}
Current Business: ${formData.current_business || 'Not specified'}
Outlet Count: ${formData.outlet_count || 'Not specified'}
Business Type: ${formData.business_type}
${formData.notes ? `Notes: ${formData.notes}` : ''}
Source: ${formData.source_page}
Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Action Required: Contact this lead within 24 hours.
    `

    // Send to both email addresses (don't block on email sending)
    Promise.all([
      sendEmailNotification('info@londonslush.com', emailSubject, emailHtml, emailText),
      sendEmailNotification('support@londonslush.com', emailSubject, emailHtml, emailText)
    ]).catch(err => console.error('Email notification error:', err))

    // 🆕 Sync to Google Sheets via Cloudflare Worker (non-blocking)
    const syncToWorker = async () => {
      try {
        const workerData = {
          id: '',
          name: formData.name,
          phone: formData.phone,
          email: formData.email || '',
          state: '', // Retail form doesn't have state
          district_pin: formData.city, // Use city as district_pin for retail
          investment_range: formData.investment_range,
          timeline: formData.timeline,
          experience_years: '',
          current_business: formData.current_business,
          outlet_count: formData.outlet_count,
          business_type: formData.business_type,
          notes: formData.notes,
          priority: 'MEDIUM'
        }
        
        const response = await fetch('https://london-slush.bijnorservices.workers.dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workerData)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Google Sheets sync successful:', result)
        } else {
          console.warn('⚠️ Google Sheets sync failed (non-critical):', await response.text())
        }
      } catch (error) {
        console.warn('⚠️ Google Sheets sync error (non-critical):', error)
      }
    }
    
    // Fire and forget - don't wait for Worker response
    syncToWorker().catch(err => console.warn('Worker sync error:', err))

    // Redirect to thank you page immediately
    return c.redirect(`/thank-you?type=retail&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) {
    console.error('Error saving retail lead:', error)
    return c.html('<h1>Error submitting form. Please call 800-699-9805</h1>', 500)
  }
})

// Distributor Form Handler
app.post('/api/submit-distributor', async (c) => {
  try {
    const formData = await c.req.parseBody()
    const { DB } = c.env

    // Combine state and district_pin into city field for backward compatibility
    const locationData = formData.state && formData.district_pin 
      ? `${formData.state} - ${formData.district_pin}`
      : formData.state || formData.district_pin || 'Not specified'

    // Insert lead into database (if DB is available)
    if (DB) {
      try {
        await DB.prepare(`
          INSERT INTO leads (
            name, phone, email, city, investment_range, timeline,
            current_business, experience_years, outlet_count, notes,
            business_type, source_page, priority, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          formData.name,
          formData.phone,
          formData.email,
          locationData,
          formData.investment_range,
          formData.timeline,
          formData.current_business || null,
          formData.experience_years || null,
          formData.outlet_count || null,
          formData.notes || null,
          formData.business_type,
          formData.source_page,
          'high' // Distributor leads are always high priority
        ).run()
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError)
        // Continue with email sending even if DB fails
      }
    } else {
      console.warn('Database not configured - lead will only be sent via email')
    }

    // Send email notification to both addresses
    const emailSubject = `🚨 New Distributor Lead (HIGH PRIORITY): ${formData.name}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc1f26;">⭐ New Distributor Partnership Inquiry (HIGH VALUE)</h2>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="color: #856404; font-weight: bold;">🚨 HIGH PRIORITY LEAD - Investment Range: ${formData.investment_range}</p>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 15px;">
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Phone:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
          <p><strong>State/UT:</strong> ${formData.state || 'Not specified'}</p>
          <p><strong>District & PIN:</strong> ${formData.district_pin || 'Not specified'}</p>
          <p><strong>Investment Range:</strong> <span style="color: #dc1f26; font-weight: bold;">${formData.investment_range}</span></p>
          <p><strong>Timeline:</strong> ${formData.timeline}</p>
          <p><strong>Current Business:</strong> ${formData.current_business || 'Not specified'}</p>
          <p><strong>Experience:</strong> ${formData.experience_years || 'Not specified'} years</p>
          <p><strong>Outlet Count:</strong> ${formData.outlet_count || 'Not specified'}</p>
          <p><strong>Business Type:</strong> ${formData.business_type}</p>
          ${formData.notes ? `<p><strong>Notes:</strong> ${formData.notes}</p>` : ''}
          <p><strong>Source:</strong> ${formData.source_page}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #dc1f26; color: white; border-radius: 8px;">
          <p style="margin: 0; font-weight: bold;">⚡ URGENT ACTION REQUIRED</p>
          <p style="margin: 5px 0 0 0;">Contact this HIGH-VALUE distributor lead within 4 hours via phone call.</p>
        </div>
      </div>
    `
    const emailText = `
🚨 HIGH PRIORITY: New Distributor Partnership Inquiry

Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}
State/UT: ${formData.state || 'Not specified'}
District & PIN: ${formData.district_pin || 'Not specified'}
Investment Range: ${formData.investment_range}
Timeline: ${formData.timeline}
Current Business: ${formData.current_business || 'Not specified'}
Experience: ${formData.experience_years || 'Not specified'} years
Outlet Count: ${formData.outlet_count || 'Not specified'}
Business Type: ${formData.business_type}
${formData.notes ? `Notes: ${formData.notes}` : ''}
Source: ${formData.source_page}
Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

⚡ URGENT: Contact this HIGH-VALUE distributor lead within 4 hours.
    `

    // Send to both email addresses (don't block on email sending)
    Promise.all([
      sendEmailNotification('info@londonslush.com', emailSubject, emailHtml, emailText),
      sendEmailNotification('support@londonslush.com', emailSubject, emailHtml, emailText)
    ]).catch(err => console.error('Email notification error:', err))

    // 🆕 Sync to Google Sheets via Cloudflare Worker (non-blocking)
    // This bypasses the 1 KiB secret limit and works across all domains
    const syncToWorker = async () => {
      try {
        const workerData = {
          id: '',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          state: formData.state,
          district_pin: formData.district_pin,
          investment_range: formData.investment_range,
          timeline: formData.timeline,
          experience_years: formData.experience_years,
          current_business: formData.current_business,
          outlet_count: formData.outlet_count,
          business_type: formData.business_type,
          notes: formData.notes,
          priority: 'HIGH'
        }
        
        const response = await fetch('https://london-slush.bijnorservices.workers.dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workerData)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Google Sheets sync successful:', result)
        } else {
          console.warn('⚠️ Google Sheets sync failed (non-critical):', await response.text())
        }
      } catch (error) {
        console.warn('⚠️ Google Sheets sync error (non-critical):', error)
      }
    }
    
    // Fire and forget - don't wait for Worker response
    syncToWorker().catch(err => console.warn('Worker sync error:', err))

    // Redirect to thank you page immediately (don't wait for sync)
    return c.redirect(`/thank-you?type=distributor&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) {
    console.error('Error saving distributor lead:', error)
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submission Error - London Slush</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">Something Went Wrong</h1>
            <p class="text-gray-600 mb-6">We couldn't process your application at this time. Please try again or contact us directly.</p>
            <div class="space-y-3">
              <a href="/distributor" class="block w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition">
                <i class="fas fa-redo mr-2"></i>Try Again
              </a>
              <a href="mailto:support@londonslush.com" class="block w-full bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
                <i class="fas fa-envelope mr-2"></i>Email: support@londonslush.com
              </a>
              <a href="tel:8006999805" class="block w-full bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition">
                <i class="fas fa-phone mr-2"></i>Call: 800-699-9805
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `, 500)
  }
})

// Use renderer middleware
app.use(renderer)

// =============================================
// THANK YOU PAGE - POST-SUBMISSION CRO
// =============================================
app.get('/thank-you', (c) => {
  const type = c.req.query('type') || 'retail'
  const name = c.req.query('name') || 'there'

  const typeData = {
    retail: {
      title: 'Request Received Successfully!',
      icon: 'coffee',
      color: 'purple',
      nextSteps: [
        'We\'ll send you detailed pricing within 24 hours',
        'A custom ROI calculator based on your footfall',
        'Our retail partnership team will call you',
        'We can arrange a demo at your outlet if needed'
      ]
    },
    distributor: {
      title: 'Application Under Review!',
      icon: 'truck',
      color: 'green',
      nextSteps: [
        'Our partnerships team will review your profile within 48 hours',
        'You\'ll receive a distributor information pack via email',
        'A senior partner manager will contact you',
        'If shortlisted, we\'ll invite you for a detailed discussion'
      ]
    }
  }

  const data = typeData[type as keyof typeof typeData] || typeData.retail

  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-white/80 backdrop-blur-md shadow-md">
        <div class="container mx-auto px-0 py-0 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.png" alt="London Slush" class="h-24 w-auto" />
          </a>
        </div>
      </nav>

      {/* Thank You Hero */}
      <section class="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div class="container mx-auto px-4">
          <div class="max-w-3xl mx-auto text-center">
            <div class={`w-24 h-24 bg-${data.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
              <i class={`fas fa-${data.icon} text-${data.color}-600 text-5xl`}></i>
            </div>
            
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Thank You, {decodeURIComponent(name)}! 🎉
            </h1>
            
            <h2 class="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
              {data.title}
            </h2>
            
            <p class="text-xl text-gray-600 mb-8">
              We're excited about the opportunity to partner with you. Here's what happens next:
            </p>

            <div class="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h3 class="text-2xl font-bold text-gray-800 mb-6">Next Steps</h3>
              <div class="space-y-4 text-left">
                {data.nextSteps.map((step, index) => (
                  <div class="flex items-start space-x-4" key={index}>
                    <div class={`bg-${data.color}-100 text-${data.color}-600 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                      {index + 1}
                    </div>
                    <p class="text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Action Options */}
            <div class="grid md:grid-cols-2 gap-6 mb-8">
              <a 
                href="https://wa.me/918006999805?text=Hi%2C%20I%20just%20submitted%20a%20form%20for%20London%20Slush" 
                target="_blank"
                class="bg-green-500 text-white px-8 py-6 rounded-2xl font-bold text-lg hover:bg-green-600 transition shadow-xl flex items-center justify-center space-x-3"
              >
                <i class="fab fa-whatsapp text-3xl"></i>
                <div class="text-left">
                  <div class="text-sm opacity-90">Chat with us now</div>
                  <div>WhatsApp Support</div>
                </div>
              </a>

              <a 
                href="tel:8006999805"
                class="bg-brand-red text-white px-8 py-6 rounded-2xl font-bold text-lg hover:bg-red-700 transition shadow-xl flex items-center justify-center space-x-3"
              >
                <i class="fas fa-phone text-3xl"></i>
                <div class="text-left">
                  <div class="text-sm opacity-90">Speak to our team</div>
                  <div>Call 800-699-9805</div>
                </div>
              </a>
            </div>

            <div class="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
              <div class="flex items-start space-x-4">
                <i class="fas fa-clock text-yellow-600 text-3xl"></i>
                <div class="text-left">
                  <h4 class="font-bold text-gray-800 mb-2">Can't Wait?</h4>
                  <p class="text-gray-700">
                    Our team is available <strong>Monday-Saturday, 9 AM - 7 PM</strong>. 
                    Call or WhatsApp us now for immediate assistance. We typically respond within 2 hours during business hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why London Slush Quick Reminder */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">
              While You Wait, Here's Why Partners Love Us
            </h2>
            
            <div class="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div class="text-4xl font-bold text-brand-blue mb-2">150+</div>
                <p class="text-gray-600">Happy Partners</p>
              </div>
              <div>
                <div class="text-4xl font-bold text-green-600 mb-2">60-70%</div>
                <p class="text-gray-600">Profit Margins</p>
              </div>
              <div>
                <div class="text-4xl font-bold text-purple-600 mb-2">45+</div>
                <p class="text-gray-600">Cities Covered</p>
              </div>
              <div>
                <div class="text-4xl font-bold text-red-600 mb-2">12-18</div>
                <p class="text-gray-600">Months ROI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="bg-gray-900 text-white py-12">
        <div class="container mx-auto px-4 text-center">
          <img src="/logo.png" alt="London Slush" class="h-16 mx-auto mb-4 brightness-0 invert" />
          <p class="text-gray-400 mb-4">
            <a href="/" class="hover:text-white">Back to Home</a> | 
            <a href="tel:8006999805" class="hover:text-white ml-2">800-699-9805</a> | 
            <a href="mailto:info@londonslush.com" class="hover:text-white ml-2">info@londonslush.com</a>
          </p>
          <p class="text-sm text-gray-500">&copy; 2026 Dravya Roots Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>
    </>,
    { title: `Thank You - London Slush | ${data.title}` }
  )
})

// =============================================
// ADMIN DASHBOARD - LEAD MANAGEMENT
// =============================================

// Admin Dashboard - View All Leads
app.get('/admin/leads', async (c) => {
  const { DB } = c.env
  
  if (!DB) {
    return c.html('<h1>Database not configured</h1>', 500)
  }
  
  try {
    // Get filter parameters
    const filter = c.req.query('filter') || 'all'
    const search = c.req.query('search') || ''
    
    // Build query based on filter
    let query = 'SELECT * FROM leads WHERE 1=1'
    const params: any[] = []
    
    if (filter === 'today') {
      query += " AND date(created_at) = date('now')"
    } else if (filter === 'week') {
      query += " AND date(created_at) >= date('now', '-7 days')"
    } else if (filter === 'month') {
      query += " AND date(created_at) >= date('now', '-30 days')"
    } else if (filter === 'distributor') {
      query += " AND business_type = 'distributor'"
    } else if (filter === 'retail') {
      query += " AND business_type = 'retail'"
    }
    
    if (search) {
      query += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)"
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam, searchParam)
    }
    
    query += " ORDER BY created_at DESC LIMIT 100"
    
    const result = await DB.prepare(query).bind(...params).all()
    const leads = result.results || []
    
    // Get statistics
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today,
        COUNT(CASE WHEN date(created_at) >= date('now', '-7 days') THEN 1 END) as week,
        COUNT(CASE WHEN business_type = 'distributor' THEN 1 END) as distributors,
        COUNT(CASE WHEN business_type = 'retail' THEN 1 END) as retail
      FROM leads
    `).first()
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - London Slush Leads</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <!-- Header -->
        <nav class="bg-white shadow-md">
          <div class="container mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <a href="/" class="flex items-center space-x-2">
                <img src="/logo.png" alt="London Slush" class="h-12 w-auto">
              </a>
              <h1 class="text-2xl font-bold text-gray-800">Lead Management</h1>
            </div>
            <div class="flex space-x-3">
              <a href="/admin/leads/export" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                <i class="fas fa-file-excel mr-2"></i>Export CSV
              </a>
              <a href="/admin/leads/google-sheets" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <i class="fab fa-google mr-2"></i>Sync to Sheets
              </a>
            </div>
          </div>
        </nav>

        <!-- Statistics -->
        <div class="container mx-auto px-4 py-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-3xl font-bold text-blue-600">${stats?.total || 0}</div>
              <div class="text-sm text-gray-600">Total Leads</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-3xl font-bold text-green-600">${stats?.today || 0}</div>
              <div class="text-sm text-gray-600">Today</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-3xl font-bold text-purple-600">${stats?.week || 0}</div>
              <div class="text-sm text-gray-600">This Week</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-3xl font-bold text-orange-600">${stats?.distributors || 0}</div>
              <div class="text-sm text-gray-600">Distributors</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-3xl font-bold text-red-600">${stats?.retail || 0}</div>
              <div class="text-sm text-gray-600">Retail</div>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-lg shadow p-4 mb-6">
            <form method="GET" class="flex flex-wrap gap-3">
              <select name="filter" class="px-4 py-2 border rounded-lg" onchange="this.form.submit()">
                <option value="all" ${filter === 'all' ? 'selected' : ''}>All Leads</option>
                <option value="today" ${filter === 'today' ? 'selected' : ''}>Today</option>
                <option value="week" ${filter === 'week' ? 'selected' : ''}>This Week</option>
                <option value="month" ${filter === 'month' ? 'selected' : ''}>This Month</option>
                <option value="distributor" ${filter === 'distributor' ? 'selected' : ''}>Distributors Only</option>
                <option value="retail" ${filter === 'retail' ? 'selected' : ''}>Retail Only</option>
              </select>
              <input 
                type="text" 
                name="search" 
                placeholder="Search name, phone, email, city..." 
                value="${search}"
                class="flex-1 px-4 py-2 border rounded-lg"
              >
              <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                <i class="fas fa-search mr-2"></i>Search
              </button>
            </form>
          </div>

          <!-- Leads Table -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Investment</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${leads.length === 0 ? `
                    <tr>
                      <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-2"></i>
                        <p>No leads found</p>
                      </td>
                    </tr>
                  ` : leads.map((lead: any) => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm">#${lead.id}</td>
                      <td class="px-4 py-3 text-sm font-medium">${lead.name}</td>
                      <td class="px-4 py-3 text-sm">
                        <a href="tel:${lead.phone}" class="text-blue-600 hover:underline">
                          ${lead.phone}
                        </a>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        ${lead.email ? `<a href="mailto:${lead.email}" class="text-blue-600 hover:underline">${lead.email}</a>` : '-'}
                      </td>
                      <td class="px-4 py-3 text-sm">${lead.city || '-'}</td>
                      <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                          lead.investment_range?.includes('40L') ? 'bg-purple-100 text-purple-700' :
                          lead.investment_range?.includes('25L') ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }">
                          ${lead.investment_range || '-'}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                          lead.business_type === 'distributor' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                        }">
                          ${lead.business_type}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600">
                        ${new Date(lead.created_at).toLocaleDateString('en-IN')}
                        <br>
                        <span class="text-xs">${new Date(lead.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <div class="flex space-x-2">
                          <a href="https://wa.me/91${lead.phone}" target="_blank" class="text-green-600 hover:text-green-700">
                            <i class="fab fa-whatsapp text-lg"></i>
                          </a>
                          <a href="tel:${lead.phone}" class="text-blue-600 hover:text-blue-700">
                            <i class="fas fa-phone text-lg"></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return c.html('<h1>Error loading leads</h1>', 500)
  }
})

// Export Leads as CSV
app.get('/admin/leads/export', async (c) => {
  const { DB } = c.env
  
  if (!DB) {
    return c.text('Database not configured', 500)
  }
  
  try {
    const result = await DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()
    const leads = result.results || []
    
    // Generate CSV
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Location', 'Investment Range', 'Timeline', 'Experience', 'Business Type', 'Priority', 'Created At']
    const csv = [
      headers.join(','),
      ...leads.map((lead: any) => [
        lead.id,
        `"${lead.name}"`,
        lead.phone,
        lead.email || '',
        `"${lead.city || ''}"`,
        lead.investment_range || '',
        lead.timeline || '',
        lead.experience_years || '',
        lead.business_type || '',
        lead.priority || '',
        lead.created_at
      ].join(','))
    ].join('\n')
    
    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="london-slush-leads-${new Date().toISOString().split('T')[0]}.csv"`
    })
  } catch (error) {
    console.error('Error exporting leads:', error)
    return c.text('Error exporting leads', 500)
  }
})

// Google Sheets Sync Page
app.get('/admin/leads/google-sheets', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Google Sheets Integration - London Slush</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <!-- Header -->
      <nav class="bg-white shadow-md">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center space-x-4">
            <a href="/" class="flex items-center space-x-2">
              <img src="/logo.png" alt="London Slush" class="h-12 w-auto">
            </a>
            <h1 class="text-2xl font-bold text-gray-800">Google Sheets Integration</h1>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <!-- Integration Status -->
          <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div class="flex items-start space-x-4 mb-6">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fab fa-google text-green-600 text-3xl"></i>
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Auto-Sync to Google Sheets</h2>
                <p class="text-gray-600">Automatically export all leads to a Google Sheet for easy team collaboration and CRM integration.</p>
              </div>
            </div>

            <!-- Setup Instructions -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
              <h3 class="font-bold text-blue-900 mb-3 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                Setup Instructions
              </h3>
              <ol class="space-y-3 text-blue-900 ml-4">
                <li class="flex items-start">
                  <span class="font-bold mr-3">1.</span>
                  <div>
                    <strong>Create a Google Sheet</strong>
                    <p class="text-blue-800 text-sm mt-1">Go to <a href="https://sheets.google.com" target="_blank" class="underline">Google Sheets</a> and create a new spreadsheet named "London Slush Leads"</p>
                  </div>
                </li>
                <li class="flex items-start">
                  <span class="font-bold mr-3">2.</span>
                  <div>
                    <strong>Enable Google Sheets API</strong>
                    <p class="text-blue-800 text-sm mt-1">Go to <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" class="underline">Google Cloud Console</a> and enable the Google Sheets API</p>
                  </div>
                </li>
                <li class="flex items-start">
                  <span class="font-bold mr-3">3.</span>
                  <div>
                    <strong>Create Service Account</strong>
                    <p class="text-blue-800 text-sm mt-1">Create a service account and download the JSON credentials</p>
                  </div>
                </li>
                <li class="flex items-start">
                  <span class="font-bold mr-3">4.</span>
                  <div>
                    <strong>Share Sheet with Service Account</strong>
                    <p class="text-blue-800 text-sm mt-1">Share your Google Sheet with the service account email (found in the JSON file)</p>
                  </div>
                </li>
                <li class="flex items-start">
                  <span class="font-bold mr-3">5.</span>
                  <div>
                    <strong>Add Credentials to Cloudflare</strong>
                    <p class="text-blue-800 text-sm mt-1">Store the credentials as Cloudflare Secrets using: <code class="bg-blue-200 px-2 py-1 rounded text-xs">wrangler secret put GOOGLE_SHEETS_CREDENTIALS</code></p>
                  </div>
                </li>
              </ol>
            </div>

            <!-- Quick Export Option -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="font-bold text-gray-800 mb-3">Quick Export (Manual)</h3>
              <p class="text-gray-600 mb-4">Don't want to set up API integration? Download leads as CSV and manually import to Google Sheets:</p>
              <div class="flex space-x-3">
                <a href="/admin/leads/export" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center">
                  <i class="fas fa-file-excel mr-2"></i>
                  Download CSV
                </a>
                <a href="https://sheets.google.com" target="_blank" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center">
                  <i class="fab fa-google mr-2"></i>
                  Open Google Sheets
                </a>
              </div>
              <p class="text-sm text-gray-500 mt-3">
                <i class="fas fa-lightbulb mr-1"></i>
                <strong>Tip:</strong> In Google Sheets, go to File → Import → Upload, then select the CSV file.
              </p>
            </div>

            <!-- Feature Comparison -->
            <div class="mt-6">
              <h3 class="font-bold text-gray-800 mb-3">Feature Comparison</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-4 py-2 text-left">Feature</th>
                      <th class="px-4 py-2 text-center">Manual CSV Export</th>
                      <th class="px-4 py-2 text-center">Auto-Sync (API)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr>
                      <td class="px-4 py-2">Setup Time</td>
                      <td class="px-4 py-2 text-center">✅ 1 minute</td>
                      <td class="px-4 py-2 text-center">⚠️ 15 minutes</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-2">Real-time Updates</td>
                      <td class="px-4 py-2 text-center">❌ Manual refresh</td>
                      <td class="px-4 py-2 text-center">✅ Automatic</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-2">Team Collaboration</td>
                      <td class="px-4 py-2 text-center">✅ Yes</td>
                      <td class="px-4 py-2 text-center">✅ Yes</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-2">Cost</td>
                      <td class="px-4 py-2 text-center">✅ Free</td>
                      <td class="px-4 py-2 text-center">✅ Free</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Back Button -->
            <div class="mt-6 pt-6 border-t">
              <a href="/admin/leads" class="text-blue-600 hover:underline flex items-center">
                <i class="fas fa-arrow-left mr-2"></i>
                Back to Lead Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `)
})

// =============================================
// HOMEPAGE - CRO-OPTIMIZED 3-CHOICE GATEWAY
// =============================================
app.get('/', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-transparent backdrop-blur-md shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.png" alt="London Slush" class="h-20 w-auto" />
          </a>
          <div class="hidden md:flex space-x-6 items-center">
            <a href="#why-london-slush" class="text-gray-700 hover:text-brand-red font-medium">Why Us</a>
            <a href="#products" class="text-gray-700 hover:text-brand-red font-medium">Products</a>
            <a href="#partners" class="text-gray-700 hover:text-brand-red font-medium">Our Partners</a>
            <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush" target="_blank" class="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition font-semibold flex items-center space-x-2">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
            <a href="tel:8006999805" class="border-2 border-gray-700 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-700 hover:text-white transition font-semibold flex items-center space-x-2">
              <i class="fas fa-phone"></i>
              <span>Call</span>
            </a>
          </div>
          <button id="mobile-menu-button" class="md:hidden text-gray-700 hover:text-brand-red transition p-2">
            <i class="fas fa-bars text-2xl"></i>
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200 shadow-lg absolute top-full left-0 right-0 z-50">
          <div class="container mx-auto px-4 py-4 space-y-3">
            <a href="#why-london-slush" class="block text-gray-700 hover:text-brand-red font-medium py-2 border-b border-gray-100">Why Us</a>
            <a href="#products" class="block text-gray-700 hover:text-brand-red font-medium py-2 border-b border-gray-100">Products</a>
            <a href="#partners" class="block text-gray-700 hover:text-brand-red font-medium py-2 border-b border-gray-100">Our Partners</a>
            <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush" target="_blank" class="block bg-green-500 text-white text-center py-3 rounded-lg hover:bg-green-600 transition font-semibold">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <a href="tel:8006999805" class="block border-2 border-gray-700 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-700 hover:text-white transition font-semibold">
              <i class="fas fa-phone mr-2"></i>Call
            </a>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu JavaScript */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const menuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (menuButton && mobileMenu) {
              menuButton.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
              });
              
              // Close menu when clicking on a link
              const menuLinks = mobileMenu.querySelectorAll('a');
              menuLinks.forEach(link => {
                link.addEventListener('click', function() {
                  mobileMenu.classList.add('hidden');
                });
              });
            }
          });
        `
      }} />

      {/* Hero Section - Video Background - FIXED for Mobile */}
      <section class="relative h-screen min-h-[600px] flex items-center justify-center">
        {/* Background Video */}
        <video 
          autoplay 
          muted 
          loop 
          playsinline
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover"
          poster="/fabulous-juicy-slush.jpg"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay for Text Readability - Enhanced */}
        <div class="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>

        {/* Hero Content - FIXED Container with proper padding */}
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white w-full">
          <div class="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in py-8">
            {/* Logo - FIXED sizing for mobile */}
            <div class="flex justify-center mb-4 sm:mb-6">
              <a href="/" class="block">
                <img 
                  src="/logo.png" 
                  alt="London Slush" 
                  class="h-24 sm:h-32 md:h-40 lg:h-48 w-auto max-w-[85vw] object-contain drop-shadow-2xl" 
                />
              </a>
            </div>

            {/* Main Headline */}
            <h1 class="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-lg px-4">
              Inspired by <span class="text-yellow-300">London</span>.<br/>
              Crafted for <span class="text-yellow-300">India</span>.
            </h1>

            {/* Subtext */}
            <p class="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-100 leading-relaxed max-w-3xl mx-auto drop-shadow-md px-4">
              A premium global frozen beverage brand
            </p>

            {/* Trust Badges */}
            <div class="flex flex-wrap justify-center gap-3 sm:gap-6 py-4 sm:py-6 px-4">
              <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                <i class="fas fa-star text-yellow-400"></i>
                <span class="font-semibold">150+ Partners</span>
              </div>
              <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                <i class="fas fa-chart-line text-green-400"></i>
                <span class="font-semibold">60-70% Margins<sup class="text-xs">*</sup></span>
              </div>
              <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base">
                <i class="fas fa-shield-alt text-blue-400"></i>
                <span class="font-semibold">Refundable<sup class="text-xs">*</sup></span>
              </div>
            </div>

            {/* Primary CTA - WhatsApp First - FIXED positioning */}
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4 px-4 pb-8 sm:pb-8">
              <a 
                href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush" 
                target="_blank"
                class="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-10 py-3 sm:py-5 rounded-full font-bold text-base sm:text-xl shadow-2xl transition transform hover:scale-110 flex items-center space-x-2 pulse-animation w-full sm:w-auto justify-center max-w-xs sm:max-w-sm"
              >
                <i class="fab fa-whatsapp text-xl sm:text-2xl"></i>
                <span>Start WhatsApp Chat</span>
              </a>
              <a 
                href="#business-paths" 
                class="border-2 border-white hover:bg-white/20 text-white px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base backdrop-blur-md transition transform hover:scale-105 flex items-center space-x-2 justify-center w-full sm:w-auto max-w-xs sm:max-w-sm"
              >
                <span>View Options</span>
                <i class="fas fa-arrow-down"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Fallback for video not supported or slow connections */}
        <noscript>
          <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('/fabulous-juicy-slush.jpg')"></div>
        </noscript>
      </section>

      {/* Add spacing after video hero */}
      <div class="bg-white h-8"></div>

      {/* PRODUCTS / FLAVORS SECTION */}
      <section id="products" class="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Background Decoration */}
        <div class="absolute inset-0 opacity-5">
          <div class="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-10 w-80 h-80 bg-pink-500 rounded-full blur-3xl"></div>
        </div>
        
        <div class="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div class="text-center mb-16">
            <div class="inline-block mb-4">
              <span class="bg-gradient-to-r from-brand-blue to-brand-red text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase shadow-lg">
                Our Premium Collection
              </span>
            </div>
            <h2 class="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-brand-blue via-brand-red to-purple-600 text-transparent bg-clip-text">
              9 Delicious Slush Flavors
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Premium quality syrups with <strong>added Vitamins A, C & E</strong>, gluten-free, allergen-free, and vegetarian-friendly. 
              Crafted to perfection for maximum customer satisfaction.
            </p>
          </div>

          {/* Flavors Grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            
            {/* Flavor 1 - Tangy Orange */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-orange-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/tangy-orange.jpg" alt="Tangy Orange Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-orange-600">Tangy Orange</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Orange Punch – Orange Flavoured Mix!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Perfect balance of fruit and sweet, nostalgic fresh-squeezed taste.
                </p>
              </div>
            </div>

            {/* Flavor 2 - Exotic Pineapple */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-yellow-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/exotic-pineapple.jpg" alt="Exotic Pineapple Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-yellow-600">Exotic Pineapple</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Refreshing Pineapple Slush With A Kick!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Made with real pineapple. A classic, unforgettable taste.
                </p>
              </div>
            </div>

            {/* Flavor 3 - Icy Cola */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-gray-700">
              <div class="relative h-72 overflow-hidden">
                <img src="/icy-cola.jpg" alt="Icy Cola Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-gray-700">Icy Cola</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Icy Cola Flavoured Slush With Great Colour & Flavour!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Subtle cola flavor, tropical paradise vibes.
                </p>
              </div>
            </div>


            {/* Flavor 5 - Sour Green Apple */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-green-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/sour-green-apple.jpg" alt="Sour Green Apple Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-green-600">Sour Green Apple</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Fresh Green Apple Goodness!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Sweet and nostalgic with that post-drink blue tongue.
                </p>
              </div>
            </div>

            {/* Flavor 6 - Blue Berry */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-blue-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/blue-berry.jpg" alt="Blue Berry Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-blue-600">Blue Berry</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"A Mix Of Tropical Flavour Of Berry!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Perfect blue syrup combined with tropical delight.
                </p>
              </div>
            </div>


            {/* Flavor 8 - Simple Strawberry */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-red-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/simple-strawberry.jpg" alt="Simple Strawberry Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-red-600">Simple Strawberry</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Tropical Slush With Strawberry Passion Fruit!"</p>
                <p class="text-gray-700 leading-relaxed">
                  A reminder of summer in the middle of winter.
                </p>
              </div>
            </div>

            {/* Flavor 9 - Seven Rainbow */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-purple-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/seven-rainbow.jpg" alt="Seven Rainbow Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-transparent bg-clip-text">Seven Rainbow</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Refreshing Rainbow Slushie!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Personalized slush with more taste and color.
                </p>
              </div>
            </div>

            {/* Flavor 10 - Awesome Mango */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-yellow-500">
              <div class="relative h-72 overflow-hidden">
                <img src="/awesome-mango.jpg" alt="Awesome Mango Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-yellow-500">Awesome Mango</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"A Blend Of Tropical Mango!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Timeless and iconic. Perfectly icy spin on a classic.
                </p>
              </div>
            </div>

            {/* Flavor 11 - Power Blackberry */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-purple-700">
              <div class="relative h-72 overflow-hidden">
                <img src="/power-blackberry.jpg" alt="Power Blackberry Slush" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
              <div class="p-6">
                <h3 class="text-2xl font-extrabold mb-2 text-purple-700">Power Blackberry</h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">"Refreshing Blackberry Slush!"</p>
                <p class="text-gray-700 leading-relaxed">
                  Light, subtle flavors paired with classic slush ice.
                </p>
              </div>
            </div>

          </div>

          {/* CTA Section */}
          <div class="text-center mt-16">
            <p class="text-2xl font-bold text-gray-800 mb-6">
              Ready to bring these flavors to your business?
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/retail" class="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition shadow-xl transform hover:scale-105">
                <i class="fas fa-store mr-2"></i>Get Retail Pricing
              </a>
              <a href="/distributor" class="inline-block bg-gradient-to-r from-orange-600 to-orange-700 text-white px-10 py-4 rounded-full font-bold text-lg hover:from-orange-700 hover:to-orange-800 transition shadow-xl transform hover:scale-105">
                <i class="fas fa-truck mr-2"></i>Become a Distributor
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2-CHOICE BUSINESS PATHS */}
      <section id="business-paths" class="py-20 bg-gray-50 relative">
        <div class="container mx-auto px-4">
          <div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative z-10">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
                Choose Your <span class="text-brand-red">Business Path</span> with London Slush
              </h2>
              <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                Two flexible partnership models designed for maximum profitability. Start earning with zero or low investment.
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Retail Card */}
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 card-hover border-2 border-purple-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 bg-brand-red text-white px-4 py-1 rounded-bl-2xl text-sm font-semibold">
                  Most Popular
                </div>
                <div class="mb-6">
                  <div class="bg-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <i class="fas fa-coffee text-3xl"></i>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">I Own a Café / Outlet</h3>
                  <p class="text-gray-600 mb-4">Choose from 2 flexible models</p>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Model 1: ₹0 Investment (Profit Sharing)</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Model 2: 3-Month Trial Program</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Pay only for syrup in trial period</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>30-40% revenue boost</span>
                  </div>
                </div>
                
                <a href="/retail" class="block w-full bg-purple-600 text-white text-center py-4 rounded-xl font-semibold hover:bg-purple-700 transition">
                  Get Retail Pricing <i class="fas fa-arrow-right ml-2"></i>
                </a>
              </div>

              {/* Distributor Card */}
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 card-hover border-2 border-orange-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 bg-yellow-400 text-gray-800 px-4 py-1 rounded-bl-2xl text-sm font-semibold">
                  High ROI
                </div>
                <div class="mb-6">
                  <div class="bg-orange-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <i class="fas fa-truck text-3xl"></i>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">I'm a Distributor</h3>
                  <p class="text-gray-600 mb-4">Bulk machine distribution opportunity</p>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>6 Slush Machines + Syrup Stock</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Investment: ₹15 Lakh (₹12L Refundable*)</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Expected ROI: 3-4% Monthly</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Exclusive territory rights</span>
                  </div>
                </div>
                
                <a href="/distributor" class="block w-full bg-orange-600 text-white text-center py-4 rounded-xl font-semibold hover:bg-orange-700 transition">
                  Apply for Territory <i class="fas fa-arrow-right ml-2"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why London Slush Section */}
      <section id="why-london-slush" class="py-20 bg-white">
        <div class="container mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why <span class="text-brand-red">London Slush</span> Works
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              A proven business model backed by operational excellence and partner success
            </p>
          </div>

          <div class="grid md:grid-cols-4 gap-8">
            <div class="text-center p-6">
              <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-shield-alt text-brand-blue text-3xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Risk Reversal</h3>
              <p class="text-gray-600">Refundable security model protects your investment</p>
            </div>

            <div class="text-center p-6">
              <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-chart-line text-green-600 text-3xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">High Margins</h3>
              <p class="text-gray-600">60-70% profit margins on every cup sold</p>
            </div>

            <div class="text-center p-6">
              <div class="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-truck text-purple-600 text-3xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Central Supply</h3>
              <p class="text-gray-600">Consistent quality through centralized syrup distribution</p>
            </div>

            <div class="text-center p-6">
              <div class="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-headset text-brand-red text-3xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">24/7 Support</h3>
              <p class="text-gray-600">Dedicated partner success team across India</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Success Stories */}
      <section id="partners" class="py-20 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Our <span class="text-brand-red">Partners</span> Are Thriving
            </h2>
            <p class="text-xl text-gray-600">Real results from real business owners</p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white rounded-2xl p-8 shadow-lg">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold mr-4">
                  RK
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Rajesh Kumar</h4>
                  <p class="text-sm text-gray-600">Cool Bites Café, Connaught Place, Delhi</p>
                </div>
              </div>
              <div class="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <i class="fas fa-star text-yellow-400"></i>
                ))}
              </div>
              <p class="text-gray-700 italic">
                "Recovered my investment in 14 months. The support team is incredible, and customers love the products. Best decision for my business!"
              </p>
            </div>

            <div class="bg-white rounded-2xl p-8 shadow-lg">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  PM
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Priya Malhotra</h4>
                  <p class="text-sm text-gray-600">Fresh & Chill Café, Bandra West, Mumbai</p>
                </div>
              </div>
              <div class="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <i class="fas fa-star text-yellow-400"></i>
                ))}
              </div>
              <p class="text-gray-700 italic">
                "Added 35% to my café revenue without hiring extra staff. The machine runs itself, and customers keep coming back for more flavors!"
              </p>
            </div>

            <div class="bg-white rounded-2xl p-8 shadow-lg">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  VP
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Vikram Patel</h4>
                  <p class="text-sm text-gray-600">Regional Distributor, Koramangala, Bangalore</p>
                </div>
              </div>
              <div class="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <i class="fas fa-star text-yellow-400"></i>
                ))}
              </div>
              <p class="text-gray-700 italic">
                "Managing 25 outlets now. The scalability is amazing, and the brand recognition keeps growing. Profitable from month one!"
              </p>
            </div>
          </div>
          
          <p class="text-center text-sm text-gray-500 mt-8 max-w-3xl mx-auto">
            <i class="fas fa-info-circle mr-1"></i> Partner testimonials represent typical results. Individual outcomes may vary based on location, effort, and market conditions.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section class="py-20 gradient-bg text-white relative overflow-hidden">
        <div class="container mx-auto px-4 text-center relative z-10">
          <h2 class="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Success Story?
          </h2>
          <p class="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 150+ profitable partners across India. Get started in just 7 days.
          </p>
          <div class="flex flex-col md:flex-row gap-4 justify-center">
            <a href="https://wa.me/918006999805?text=Hi%2C%20I%27m%20interested%20in%20London%20Slush%20partnership" target="_blank" class="bg-green-500 text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-green-600 transition inline-flex items-center space-x-2 shadow-xl transform hover:scale-105">
              <i class="fab fa-whatsapp text-2xl"></i>
              <span>WhatsApp Us Now</span>
            </a>
            <a href="tel:8006999805" class="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-brand-blue transition inline-flex items-center space-x-2">
              <i class="fas fa-phone"></i>
              <span>Call: 800-699-9805</span>
            </a>
          </div>
        </div>
        
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Footer */}
      <footer class="bg-gray-900 text-white py-12">
        <div class="container mx-auto px-4">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <a href="/">
                <img src="/logo.png" alt="London Slush" class="h-24 mb-4" />
              </a>
              <p class="text-gray-400 text-sm">
                Premium beverage franchise opportunities across India. Build your profitable business with us.
              </p>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-4">Quick Links</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="/" class="hover:text-white">Home</a></li>
                <li><a href="/retail" class="hover:text-white">Retail Partners</a></li>
                <li><a href="/distributor" class="hover:text-white">Distributors</a></li>
                <li><a href="#why-london-slush" class="hover:text-white">Why Us</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-4">Get Started</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="https://wa.me/918006999805?text=Hi%2C%20I%27m%20interested%20in%20London%20Slush" class="hover:text-white">WhatsApp Us</a></li>
                <li><a href="tel:8006999805" class="hover:text-white">Call Now</a></li>
                <li><a href="mailto:info@londonslush.com" class="hover:text-white">Email Us</a></li>
                <li><a href="#business-paths" class="hover:text-white">View Opportunities</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-4">Contact</h4>
              <ul class="space-y-2 text-gray-400">
                <li><i class="fas fa-phone mr-2"></i>800-699-9805</li>
                <li><i class="fas fa-envelope mr-2"></i>info@londonslush.com</li>
                <li><i class="fas fa-map-marker-alt mr-2"></i>Dravya Roots Pvt Ltd</li>
              </ul>
              <div class="flex space-x-4 mt-4">
                <a href="https://www.facebook.com/londonslushindia" target="_blank" rel="noopener noreferrer" 
                   class="text-gray-400 hover:text-blue-500 text-xl transition-colors" aria-label="Facebook">
                  <i class="fab fa-facebook"></i>
                </a>
                <a href="https://www.instagram.com/londonslushindia/" target="_blank" rel="noopener noreferrer" 
                   class="text-gray-400 hover:text-pink-500 text-xl transition-colors" aria-label="Instagram">
                  <i class="fab fa-instagram"></i>
                </a>
                <a href="https://youtube.com/@londonslush?si=XvUmEpcN6_IACAvN" target="_blank" rel="noopener noreferrer" 
                   class="text-gray-400 hover:text-red-500 text-xl transition-colors" aria-label="YouTube">
                  <i class="fab fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>
          
          {/* Legal Disclaimer */}
          <div class="border-t border-gray-800 pt-6 pb-4">
            <div class="max-w-4xl mx-auto text-gray-400 text-xs space-y-2">
              <p class="font-semibold text-sm text-gray-300">Important Disclaimers:</p>
              <p><strong>* Refundable Investment:</strong> Subject to distributor agreement terms, performance criteria, and machine return conditions. Refund processing may take 30-90 days after agreement termination.</p>
              <p><strong>* Profit Margins:</strong> 60-70% margins are estimates based on recommended retail pricing minus cost of goods. Actual margins may vary based on local pricing, operational costs, and business management.</p>
              <p><strong>About London Slush:</strong> A premium frozen beverage brand with UK registration (<strong>GLEN AQUA LIMITED, 16856544, London, UK</strong>), operated in India by <strong>Dravya Roots Pvt Ltd</strong>. Our recipes and branding draw inspiration from London's vibrant beverage culture, adapted specifically for the Indian market with local flavors and preferences.</p>
            </div>
          </div>
          
          <div class="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <div class="mb-3">
              <p class="font-bold text-white text-base mb-2">🇬🇧 UK Registered Office</p>
              <p class="text-xs"><strong>London Slush - GLEN AQUA LIMITED</strong></p>
              <p class="text-xs">Company Registration: 16856544</p>
              <p class="text-xs">128 City Road, London, EC1V 2NX, United Kingdom</p>
            </div>
            <p>&copy; 2026 London Slush | UK: GLEN AQUA LIMITED | India Operations: Dravya Roots Pvt Ltd. All rights reserved.</p>
            <p class="mt-2 text-xs">For partnership inquiries: Call 800-699-9805 | WhatsApp +91-800-699-9805 | Email info@londonslush.com</p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <div id="cookie-banner" class="hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 shadow-2xl z-50 border-t-4 border-brand-red">
        <div class="container mx-auto max-w-6xl">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-start gap-4 flex-1">
              <i class="fas fa-cookie-bite text-4xl text-yellow-400"></i>
              <div>
                <h3 class="text-lg font-bold mb-2">We Value Your Privacy 🍪</h3>
                <p class="text-sm text-gray-300">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  By clicking "Accept All", you consent to our use of cookies. 
                  <a href="/privacy-policy" class="text-brand-red hover:underline">Learn more</a>
                </p>
              </div>
            </div>
            <div class="flex gap-3 flex-shrink-0">
              <button id="cookie-settings-btn" class="px-4 py-2 border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition font-semibold text-sm">
                <i class="fas fa-cog mr-2"></i>Settings
              </button>
              <button id="cookie-accept-btn" class="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm">
                <i class="fas fa-check mr-2"></i>Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      <div id="cookie-settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-cookie-bite text-brand-red mr-2"></i>
                Cookie Settings
              </h2>
              <button id="cookie-modal-close" class="text-gray-500 hover:text-gray-700 transition">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
          </div>
          
          <div class="p-6 space-y-6">
            {/* Essential Cookies */}
            <div class="border-b border-gray-200 pb-6">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <i class="fas fa-shield-alt text-green-600 text-xl"></i>
                  <h3 class="text-lg font-bold text-gray-800">Essential Cookies</h3>
                </div>
                <div class="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                  Always Active
                </div>
              </div>
              <p class="text-sm text-gray-600 pl-8">
                Required for the website to function properly. These cookies enable core functionality such as security, 
                network management, and accessibility. Cannot be disabled.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div class="border-b border-gray-200 pb-6">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <i class="fas fa-chart-line text-blue-600 text-xl"></i>
                  <h3 class="text-lg font-bold text-gray-800">Analytics Cookies</h3>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="cookie-analytics" class="sr-only peer" checked>
                  <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                </label>
              </div>
              <p class="text-sm text-gray-600 pl-8">
                Help us understand how visitors interact with our website. We use this data to improve your experience.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div class="pb-6">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <i class="fas fa-bullhorn text-purple-600 text-xl"></i>
                  <h3 class="text-lg font-bold text-gray-800">Marketing Cookies</h3>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="cookie-marketing" class="sr-only peer" checked>
                  <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                </label>
              </div>
              <p class="text-sm text-gray-600 pl-8">
                Used to deliver personalized advertisements and track campaign effectiveness across different platforms.
              </p>
            </div>
          </div>

          <div class="p-6 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
            <button id="cookie-reject-all" class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold">
              Reject All
            </button>
            <button id="cookie-save-preferences" class="px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-red-700 transition font-semibold">
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Cookie Management JavaScript */}
      <script dangerouslySetInnerHTML={{__html: `
        // Cookie utility functions
        function setCookie(name, value, days) {
          const expires = new Date();
          expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
          document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/;SameSite=Lax';
        }

        function getCookie(name) {
          const nameEQ = name + '=';
          const ca = document.cookie.split(';');
          for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
          }
          return null;
        }

        function deleteCookie(name) {
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
        }

        // Initialize cookie consent
        document.addEventListener('DOMContentLoaded', function() {
          const banner = document.getElementById('cookie-banner');
          const modal = document.getElementById('cookie-settings-modal');
          const acceptBtn = document.getElementById('cookie-accept-btn');
          const settingsBtn = document.getElementById('cookie-settings-btn');
          const modalCloseBtn = document.getElementById('cookie-modal-close');
          const rejectBtn = document.getElementById('cookie-reject-all');
          const saveBtn = document.getElementById('cookie-save-preferences');
          const analyticsCheckbox = document.getElementById('cookie-analytics');
          const marketingCheckbox = document.getElementById('cookie-marketing');

          // Check if user has already consented
          const cookieConsent = getCookie('london_slush_cookie_consent');
          
          if (!cookieConsent) {
            // Show banner after 1 second
            setTimeout(() => {
              banner.classList.remove('hidden');
            }, 1000);
          } else {
            // Load existing preferences
            const preferences = JSON.parse(cookieConsent);
            if (preferences.analytics) {
              loadAnalytics();
            }
            if (preferences.marketing) {
              loadMarketing();
            }
          }

          // Accept all cookies
          acceptBtn.addEventListener('click', function() {
            const preferences = {
              essential: true,
              analytics: true,
              marketing: true,
              timestamp: new Date().toISOString()
            };
            setCookie('london_slush_cookie_consent', JSON.stringify(preferences), 365);
            banner.classList.add('hidden');
            loadAnalytics();
            loadMarketing();
            console.log('✅ All cookies accepted');
          });

          // Open settings modal
          settingsBtn.addEventListener('click', function() {
            modal.classList.remove('hidden');
          });

          // Close modal
          modalCloseBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
          });

          // Reject all cookies
          rejectBtn.addEventListener('click', function() {
            const preferences = {
              essential: true,
              analytics: false,
              marketing: false,
              timestamp: new Date().toISOString()
            };
            setCookie('london_slush_cookie_consent', JSON.stringify(preferences), 365);
            banner.classList.add('hidden');
            modal.classList.add('hidden');
            console.log('❌ Non-essential cookies rejected');
          });

          // Save preferences
          saveBtn.addEventListener('click', function() {
            const preferences = {
              essential: true,
              analytics: analyticsCheckbox.checked,
              marketing: marketingCheckbox.checked,
              timestamp: new Date().toISOString()
            };
            setCookie('london_slush_cookie_consent', JSON.stringify(preferences), 365);
            banner.classList.add('hidden');
            modal.classList.add('hidden');
            
            if (preferences.analytics) {
              loadAnalytics();
            }
            if (preferences.marketing) {
              loadMarketing();
            }
            console.log('✅ Cookie preferences saved:', preferences);
          });

          // Load analytics scripts
          function loadAnalytics() {
            // Google Analytics (if you have GA4)
            // window.dataLayer = window.dataLayer || [];
            // function gtag(){dataLayer.push(arguments);}
            // gtag('js', new Date());
            // gtag('config', 'GA_MEASUREMENT_ID');
            
            console.log('📊 Analytics cookies loaded');
            
            // Track page view
            setCookie('london_slush_analytics', 'enabled', 365);
          }

          // Load marketing scripts
          function loadMarketing() {
            // Facebook Pixel, Google Ads, etc.
            console.log('📢 Marketing cookies loaded');
            
            // Track marketing consent
            setCookie('london_slush_marketing', 'enabled', 365);
          }

          // Close modal when clicking outside
          modal.addEventListener('click', function(e) {
            if (e.target === modal) {
              modal.classList.add('hidden');
            }
          });
        });
      `}} />
    </>,
    { title: 'London Slush - Premium Franchise & Business Opportunities | Start Your Beverage Business' }
  )
})


// =============================================
// RETAIL/CAFÉ FUNNEL - MEDIUM TICKET VOLUME BUYERS
// =============================================
app.get('/retail', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-transparent backdrop-blur-md shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-0 py-0 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.png" alt="London Slush" class="h-24 w-auto" />
          </a>
          <a href="tel:8006999805" class="bg-brand-red text-white px-6 py-3 rounded-full hover:bg-red-700 transition font-semibold">
            <i class="fas fa-phone mr-2"></i>800-699-9805
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section class="bg-gradient-to-br from-purple-600 to-pink-600 text-white py-16 md:py-24">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <div class="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold mb-6">
              <i class="fas fa-coffee mr-2"></i>For Existing Outlets
            </div>
            <h1 class="text-4xl md:text-6xl font-bold mb-6">
              Add <span class="text-yellow-300">30-40% Revenue</span> Without Extra Staff
            </h1>
            <p class="text-xl md:text-2xl mb-8 opacity-90">
              London Slush machines turn your existing foot traffic into high-margin beverage sales
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#retail-form" class="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                Get Pricing & ROI Calculator
              </a>
              <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush%20for%20my%20outlet" target="_blank" class="bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-600 transition shadow-xl">
                <i class="fab fa-whatsapp mr-2"></i>Quick Chat
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition for Retail */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-5xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              Why Café & Retail Owners Love London Slush
            </h2>
            
            <div class="grid md:grid-cols-3 gap-8">
              <div class="text-center p-6">
                <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-chart-line text-green-600 text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">30-40%</h3>
                <p class="text-gray-600 font-semibold mb-2">Revenue Boost</p>
                <p class="text-sm text-gray-500">Average increase in monthly revenue from existing customers</p>
              </div>

              <div class="text-center p-6">
                <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-robot text-brand-blue text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">Zero</h3>
                <p class="text-gray-600 font-semibold mb-2">Extra Staff Needed</p>
                <p class="text-sm text-gray-500">Automated machines that customers operate themselves</p>
              </div>

              <div class="text-center p-6">
                <div class="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-clock text-purple-600 text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">2 Hours</h3>
                <p class="text-gray-600 font-semibold mb-2">Setup Time</p>
                <p class="text-sm text-gray-500">From delivery to serving customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Partnership Model */}
      <section class="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">
              Choose Your <span class="text-purple-600">Partnership Model</span>
            </h2>
            <p class="text-xl text-gray-600 text-center mb-12">
              Select the model that best fits your business needs
            </p>
            
            <div class="grid md:grid-cols-2 gap-8">
              {/* Partnership Model */}
              <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-300">
                <div class="bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-white text-center">
                  <div class="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full inline-block font-bold mb-4">
                    RECOMMENDED
                  </div>
                  <i class="fas fa-handshake text-6xl mb-4 block"></i>
                  <h3 class="text-3xl font-bold mb-2">Partnership Model</h3>
                  <p class="text-xl opacity-90">Profit Sharing Basis</p>
                </div>
                
                <div class="p-8">
                  <div class="text-center mb-6">
                    <div class="text-5xl font-bold text-green-600 mb-2">₹0</div>
                    <p class="text-lg font-semibold text-gray-800">Upfront Cost</p>
                  </div>
                  
                  <div class="space-y-4 mb-8">
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Zero Investment</p>
                        <p class="text-sm text-gray-600">We provide machine & setup at no cost</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Profit Sharing</p>
                        <p class="text-sm text-gray-600">Agreed percentage of net revenue</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">We Supply Everything</p>
                        <p class="text-sm text-gray-600">Machine, syrup, cups, straws - all included</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Maintenance Included</p>
                        <p class="text-sm text-gray-600">Free servicing & repairs</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Flexible Terms</p>
                        <p class="text-sm text-gray-600">Monthly profit settlement</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-purple-50 rounded-2xl p-6 mb-6">
                    <h4 class="font-bold text-gray-800 mb-3">How It Works:</h4>
                    <ul class="space-y-2 text-sm text-gray-700">
                      <li>• We install machine at your outlet</li>
                      <li>• You provide space & electricity</li>
                      <li>• Customers pay you for slushies</li>
                      <li>• We share profits monthly (% TBD)</li>
                    </ul>
                  </div>
                  
                  <a href="#retail-form" class="block w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition shadow-xl text-center">
                    Apply for Partnership
                  </a>
                </div>
              </div>
              
              {/* Individual Model */}
              <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-300">
                <div class="bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-white text-center">
                  <i class="fas fa-user-tie text-6xl mb-4 block"></i>
                  <h3 class="text-3xl font-bold mb-2">Individual Model</h3>
                  <p class="text-xl opacity-90">Purchase Raw Materials</p>
                </div>
                
                <div class="p-8">
                  <div class="text-center mb-6">
                    <div class="text-5xl font-bold text-blue-600 mb-2">₹0</div>
                    <p class="text-lg font-semibold text-gray-800">No Upfront Investment</p>
                    <p class="text-sm text-gray-600 mt-2">Only raw material cost for 3 months*</p>
                  </div>
                  
                  <div class="space-y-4 mb-8">
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Zero Upfront Cost</p>
                        <p class="text-sm text-gray-600">No machine investment required</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Pay for Raw Materials Only</p>
                        <p class="text-sm text-gray-600">3-month supply cost (pricing on consultation)</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">3-Month Trial Period</p>
                        <p class="text-sm text-gray-600">Test viability with minimal commitment</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Keep All Profits</p>
                        <p class="text-sm text-gray-600">No revenue sharing</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Training & Support</p>
                        <p class="text-sm text-gray-600">Operational guidance included</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-blue-50 rounded-2xl p-6 mb-6">
                    <h4 class="font-bold text-gray-800 mb-3">How It Works:</h4>
                    <ul class="space-y-2 text-sm text-gray-700">
                      <li>• No machine investment needed</li>
                      <li>• Pay only for 3-month raw material supply</li>
                      <li>• Trial period to assess business fit</li>
                      <li>• Full control & 100% profits</li>
                    </ul>
                  </div>
                  
                  <a href="#retail-form" class="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl text-center">
                    Apply for Individual
                  </a>
                </div>
              </div>
            </div>
            
            <div class="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mt-12">
              <div class="flex items-start space-x-4">
                <i class="fas fa-info-circle text-yellow-600 text-3xl"></i>
                <div>
                  <h4 class="font-bold text-gray-800 mb-2 text-lg">Not Sure Which Model to Choose?</h4>
                  <p class="text-gray-700 mb-4">
                    No problem! Our team will help you select the best model based on your outlet size, 
                    footfall, and business goals. Fill out the form below and we'll guide you.
                  </p>
                  <p class="text-sm text-gray-600">
                    💡 <strong>Pro Tip:</strong> Partnership model is perfect if you have high footfall but limited capital. 
                    Individual model is ideal if you want full control and have investment capacity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section class="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              <i class="fas fa-calculator text-purple-600 mr-3"></i>
              Revenue & Cost Projection (Individual Model)
            </h2>

            <div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <div class="grid md:grid-cols-2 gap-8 mb-8">
                <div class="bg-purple-50 rounded-2xl p-6">
                  <h3 class="text-xl font-bold text-gray-800 mb-4">Raw Material Cost Breakdown</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-700">3-Month Syrup Supply*</span>
                      <span class="font-semibold">Contact for pricing</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Cups & Straws (consumables)</span>
                      <span class="font-semibold">Included</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Machine Setup Fee</span>
                      <span class="font-semibold">₹0</span>
                    </div>
                    <div class="flex justify-between border-t-2 border-gray-300 pt-3 text-lg">
                      <span class="font-bold">Total Upfront</span>
                      <span class="font-bold text-purple-600">Raw Materials Only*</span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-4">
                    * Pricing varies by location and volume. Contact us for detailed quote.
                  </p>
                </div>

                <div class="bg-green-50 rounded-2xl p-6">
                  <h3 class="text-xl font-bold text-gray-800 mb-4">Monthly Earnings (Est.)</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-700">50 cups/day @ ₹75</span>
                      <span class="font-semibold">₹1,12,500</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Cost per cup (syrup + ops)</span>
                      <span class="font-semibold">₹30</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Monthly profit (60% margin)</span>
                      <span class="font-semibold">₹67,500</span>
                    </div>
                    <div class="flex justify-between border-t-2 border-gray-300 pt-3 text-lg">
                      <span class="font-bold">Break-even</span>
                      <span class="font-bold text-green-600">Month 1</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                <div class="flex items-start space-x-4">
                  <i class="fas fa-lightbulb text-yellow-500 text-3xl"></i>
                  <div>
                    <h4 class="font-bold text-gray-800 mb-2">Individual Model Benefits</h4>
                    <p class="text-gray-700">
                      With ZERO machine investment, you start earning profits from Day 1! 
                      Pay only for raw materials (3-month supply) and keep 100% of the profits. 
                      During peak season (March-July), sales can increase by 60-80%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              Perfect For These Businesses
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              {[
                { icon: 'coffee', name: 'Cafés & Coffee Shops', desc: 'Complement your hot beverages with cold slushies' },
                { icon: 'store', name: 'Retail Stores', desc: 'Add a beverage counter to increase dwell time' },
                { icon: 'utensils', name: 'Restaurants', desc: 'Offer refreshing drinks that kids love' },
                { icon: 'ice-cream', name: 'Ice Cream Parlors', desc: 'Expand your cold beverage menu' },
                { icon: 'film', name: 'Cinema Halls', desc: 'High footfall, high-margin add-on' },
                { icon: 'dumbbell', name: 'Gyms & Sports Centers', desc: 'Post-workout refreshment option' },
                { icon: 'shopping-cart', name: 'Supermarkets', desc: 'Impulse purchase at checkout' },
                { icon: 'gas-pump', name: 'Petrol Pumps', desc: 'Convenience store revenue boost' }
              ].map((business, index) => (
                <div class="flex items-start space-x-4 bg-gray-50 rounded-xl p-6" key={index}>
                  <div class="bg-purple-100 p-3 rounded-lg">
                    <i class={`fas fa-${business.icon} text-purple-600 text-2xl`}></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-800 mb-1">{business.name}</h3>
                    <p class="text-sm text-gray-600">{business.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Retail Application Form */}
      <section id="retail-form" class="py-20 bg-gradient-to-br from-purple-600 to-pink-600">
        <div class="container mx-auto px-4">
          <div class="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div class="text-center mb-8">
              <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Get Retail Pricing & ROI Calculator
              </h2>
              <p class="text-lg text-gray-600">
                We'll send you detailed pricing and a customized ROI projection for your outlet
              </p>
            </div>

            <form action="/api/submit-retail" method="POST" class="space-y-6">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Your Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                  placeholder="Full name"
                />
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Phone *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                  />
                </div>
                
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Business Type *</label>
                <select 
                  name="current_business" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                >
                  <option value="">Select your business type</option>
                  <option value="Café">Café / Coffee Shop</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Retail Store">Retail Store</option>
                  <option value="Ice Cream Parlor">Ice Cream Parlor</option>
                  <option value="Cinema">Cinema / Multiplex</option>
                  <option value="Gym">Gym / Sports Center</option>
                  <option value="Supermarket">Supermarket / Convenience Store</option>
                  <option value="Petrol Pump">Petrol Pump</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Preferred Partnership Model *</label>
                <select 
                  name="partnership_model"
                  id="partnership-model-select"
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                >
                  <option value="">Select your preferred model</option>
                  <option value="Partnership Model">Partnership Model (₹0 upfront, profit sharing)</option>
                  <option value="Individual Model">Individual Model (No investment - raw material cost for 3 months*)</option>
                  <option value="Not Sure">Not Sure - Need Consultation</option>
                </select>
              </div>

              {/* Raw Material Cost Field - Shows only for Individual Model */}
              <div id="raw-material-cost-container" style="display: none;">
                <label class="block text-gray-700 font-semibold mb-2">
                  Raw Material Cost for 3 Months *
                  <span class="text-sm text-gray-500 ml-2">(For Individual Model)</span>
                </label>
                <div class="relative">
                  <input 
                    type="text" 
                    name="raw_material_cost"
                    id="raw-material-cost-input"
                    value="*****"
                    readonly
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Contact us for pricing details"
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-4">
                    <i class="fas fa-info-circle text-purple-500"></i>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  * Pricing details will be provided after consultation. Varies based on volume and location.
                </p>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">City *</label>
                  <input 
                    type="text" 
                    name="city" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                    placeholder="Your city"
                  />
                </div>
                
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Daily Footfall (Est.)</label>
                  <select 
                    name="outlet_count" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                  >
                    <option value="">Estimate daily customers</option>
                    <option value="50">50-100 customers/day</option>
                    <option value="100">100-200 customers/day</option>
                    <option value="200">200-500 customers/day</option>
                    <option value="500">500+ customers/day</option>
                  </select>
                </div>
              </div>



              <div>
                <label class="block text-gray-700 font-semibold mb-2">When do you want to start? *</label>
                <select 
                  name="timeline" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                >
                  <option value="">Select timeline</option>
                  <option value="0-30">Immediately (Within 1 month)</option>
                  <option value="30-60">1-2 months</option>
                  <option value="60-90">2-3 months</option>
                  <option value="90+">Just exploring options</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Questions or Requirements</label>
                <textarea 
                  name="notes" 
                  rows="3"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                  placeholder="Any specific questions?"
                ></textarea>
              </div>

              <input type="hidden" name="business_type" value="retail" />
              <input type="hidden" name="source_page" value="/retail" />

              <button 
                type="submit" 
                class="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition shadow-xl"
              >
                <i class="fas fa-paper-plane mr-2"></i>
                Get Pricing & Calculator
              </button>

              <p class="text-sm text-gray-600 text-center">
                We'll contact you within 24 hours with detailed pricing and ROI projections
              </p>
            </form>

            {/* Form Conditional Logic - Retail */}
            <script dangerouslySetInnerHTML={{__html: `
              document.addEventListener('DOMContentLoaded', function() {
                const partnershipModelSelect = document.getElementById('partnership-model-select');
                const rawMaterialContainer = document.getElementById('raw-material-cost-container');
                
                if (partnershipModelSelect && rawMaterialContainer) {
                  function togglePartnershipFields() {
                    const selectedModel = partnershipModelSelect.value;
                    
                    if (selectedModel === 'Individual Model') {
                      // Show raw material cost field for Individual Model
                      rawMaterialContainer.style.display = 'block';
                    } else {
                      // Hide raw material cost field for other models
                      rawMaterialContainer.style.display = 'none';
                    }
                  }
                  
                  // Listen to changes
                  partnershipModelSelect.addEventListener('change', togglePartnershipFields);
                  
                  // Initial check on page load
                  togglePartnershipFields();
                }
              });
            `}} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="bg-gray-900 text-white py-8">
        <div class="container mx-auto px-4 text-center">
          <p class="text-gray-400">
            <a href="/" class="hover:text-white">← Back to Home</a> | 
            <a href="tel:8006999805" class="hover:text-white ml-2">Call: 800-699-9805</a> | 
            <a href="mailto:info@londonslush.com" class="hover:text-white ml-2">info@londonslush.com</a>
          </p>
          <p class="text-sm text-gray-500 mt-4">&copy; 2026 Dravya Roots Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>
    </>,
    { title: 'London Slush for Cafés & Retail - Add 30-40% Revenue | ₹2.5L-₹5L Investment' }
  )
})

// =============================================
// DISTRIBUTOR FUNNEL - TOP-TIER STRATEGIC PARTNERS
// =============================================
app.get('/distributor', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-transparent backdrop-blur-md shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-0 py-0 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.png" alt="London Slush" class="h-24 w-auto" />
          </a>
          <a href="tel:8006999805" class="bg-brand-red text-white px-6 py-3 rounded-full hover:bg-red-700 transition font-semibold">
            <i class="fas fa-phone mr-2"></i>800-699-9805
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section class="bg-gradient-to-br from-green-600 to-teal-600 text-white py-16 md:py-24 relative overflow-hidden">
        <div class="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-6 py-2 font-bold text-sm rotate-45 transform translate-x-12 translate-y-6">
          EXCLUSIVE
        </div>
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <div class="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold mb-6">
              <i class="fas fa-crown mr-2 text-yellow-300"></i>Premium Partnership
            </div>
            <h1 class="text-4xl md:text-6xl font-bold mb-6">
              Become a <span class="text-yellow-300">London Slush Distributor</span> with 6 Machines
            </h1>
            <p class="text-xl md:text-2xl mb-8 opacity-90">
              Start your distribution business with 6 slush machines and initial syrup stock. Expected ROI: 3-4% monthly
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#distributor-form" class="bg-white text-green-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                Apply for Territory Rights
              </a>
              <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush%20distribution" target="_blank" class="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition shadow-xl">
                <i class="fab fa-whatsapp mr-2"></i>Discuss Opportunity
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Distributor Value Prop */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-5xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              Why Become a London Slush Distributor?
            </h2>
            
            <div class="grid md:grid-cols-3 gap-8 mb-12">
              <div class="bg-green-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-green-600 mb-2">₹12L*</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Refundable (Machines)</p>
                <p class="text-sm text-gray-600">Subject to terms & conditions</p>
              </div>
              
              <div class="bg-blue-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-blue-600 mb-2">6</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Slush Machines</p>
                <p class="text-sm text-gray-600">Plus ₹3L initial syrup stock</p>
              </div>
              
              <div class="bg-purple-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-purple-600 mb-2">3-4%</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Monthly ROI</p>
                <p class="text-sm text-gray-600">Expected return on investment</p>
              </div>
            </div>

            <div class="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-12">
              <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">Your Investment Breakdown</h3>
              <div class="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 class="font-bold text-lg text-gray-800 mb-4">Initial Investment: ₹15 Lakh</h4>
                  <ul class="space-y-3">
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">6 Slush Machines</p>
                        <p class="text-sm text-gray-600">₹12 Lakh (Refundable*)</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Initial Syrup Stock</p>
                        <p class="text-sm text-gray-600">₹3 Lakh working capital</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Expected Monthly ROI</p>
                        <p class="text-sm text-gray-600">3-4% on total investment</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Refund Terms</p>
                        <p class="text-sm text-gray-600">Subject to agreement conditions</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-bold text-lg text-gray-800 mb-4">What You Get</h4>
                  <ul class="space-y-3">
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-blender text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">6 Professional Machines</p>
                        <p class="text-sm text-gray-600">High-capacity slush equipment</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-flask text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Premium Syrup Supply</p>
                        <p class="text-sm text-gray-600">Multiple flavor variants included</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-map-marked-alt text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Territory Rights</p>
                        <p class="text-sm text-gray-600">Exclusive distribution area</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-tools text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Technical Support</p>
                        <p class="text-sm text-gray-600">Installation & maintenance training</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Distribution Opportunity Locations */}
      <section class="py-16 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Perfect Distribution Locations
              </h2>
              <p class="text-xl text-gray-600">
                Place your 6 machines in high-traffic locations for maximum returns
              </p>
            </div>

            <div class="grid md:grid-cols-3 gap-6 mb-12">
              <div class="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition duration-300">
                <img src="/dance-with-slush.jpg" alt="Water Parks & Entertainment Zones" class="w-full h-56 object-cover" />
                <div class="p-6">
                  <div class="flex items-center space-x-2 mb-3">
                    <i class="fas fa-water text-blue-500 text-2xl"></i>
                    <h3 class="font-bold text-lg text-gray-800">Water Parks</h3>
                  </div>
                  <p class="text-gray-600 text-sm">High footfall entertainment zones perfect for refreshing beverages</p>
                </div>
              </div>

              <div class="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition duration-300">
                <img src="/fabulous-juicy-slush.jpg" alt="Food Courts & Malls" class="w-full h-56 object-cover" />
                <div class="p-6">
                  <div class="flex items-center space-x-2 mb-3">
                    <i class="fas fa-shopping-bag text-purple-500 text-2xl"></i>
                    <h3 class="font-bold text-lg text-gray-800">Food Courts</h3>
                  </div>
                  <p class="text-gray-600 text-sm">Shopping malls and food courts with consistent daily traffic</p>
                </div>
              </div>

              <div class="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition duration-300">
                <img src="/slush-varieties.jpg" alt="Exhibitions & Events" class="w-full h-56 object-cover" />
                <div class="p-6">
                  <div class="flex items-center space-x-2 mb-3">
                    <i class="fas fa-calendar-alt text-red-500 text-2xl"></i>
                    <h3 class="font-bold text-lg text-gray-800">Exhibitions</h3>
                  </div>
                  <p class="text-gray-600 text-sm">Trade shows, exhibitions, and large-scale events with premium sales</p>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-3xl p-8 md:p-12 text-center">
              <h3 class="text-2xl md:text-3xl font-bold mb-4">Your Distribution Package</h3>
              <div class="grid md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <i class="fas fa-blender text-4xl mb-2"></i>
                  <p class="font-semibold">6 Machines</p>
                  <p class="text-sm opacity-90">Professional Grade</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <i class="fas fa-flask text-4xl mb-2"></i>
                  <p class="font-semibold">Syrup Stock</p>
                  <p class="text-sm opacity-90">₹3L Initial Supply</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <i class="fas fa-chart-line text-4xl mb-2"></i>
                  <p class="font-semibold">3-4% ROI</p>
                  <p class="text-sm opacity-90">Monthly Returns</p>
                </div>
              </div>
              <p class="text-xl mb-6">
                <strong class="text-yellow-300">₹12 Lakh Refundable*</strong> | 
                <strong class="text-yellow-300 ml-2">₹3 Lakh Syrup Stock</strong> |
                <strong class="text-yellow-300 ml-2">Total: ₹15 Lakh</strong>
              </p>
              <a href="#distributor-form" class="inline-block bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition shadow-xl">
                <i class="fas fa-rocket mr-2"></i>Start Your Distribution Business
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Distributor Profile */}
      <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              Ideal Distributor Profile
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              {[
                { icon: 'briefcase', title: 'FMCG Distribution Experience', desc: 'Existing distribution network in food & beverage sector' },
                { icon: 'warehouse', title: 'Infrastructure Ready', desc: 'Storage facility and logistics capability' },
                { icon: 'users-cog', title: 'Team Capability', desc: '5+ person sales and service team' },
                { icon: 'money-bill-wave', title: 'Financial Strength', desc: 'Up to ₹15L refundable investment capacity*' },
                { icon: 'handshake', title: 'Relationship Network', desc: 'Connections with cafés, restaurants, retail chains' },
                { icon: 'chart-line', title: 'Growth Mindset', desc: 'Vision to scale to 50+ outlets in 2 years' }
              ].map((item, index) => (
                <div class="bg-white rounded-xl p-6 shadow-lg flex items-start space-x-4" key={index}>
                  <div class="bg-green-100 p-4 rounded-lg">
                    <i class={`fas fa-${item.icon} text-green-600 text-2xl`}></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p class="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Territory Availability */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              Available Territories (Limited Partnerships)
            </h2>
            
            <div class="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 mb-8">
              <div class="flex items-start space-x-4">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl"></i>
                <div>
                  <h3 class="font-bold text-gray-800 mb-2 text-lg">Exclusive & Limited</h3>
                  <p class="text-gray-700">
                    We only partner with <strong>ONE distributor per territory</strong> to protect your investment 
                    and ensure market exclusivity. Once a territory is allocated, no other distributor applications 
                    will be accepted for that region.
                  </p>
                </div>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              {[
                { region: 'North India', cities: 'Delhi NCR, Punjab, Haryana, Himachal', status: 'Open' },
                { region: 'Maharashtra', cities: 'Mumbai, Pune, Nashik, Nagpur', status: 'Open' },
                { region: 'South India', cities: 'Bangalore, Chennai, Hyderabad, Kochi', status: 'Limited' },
                { region: 'Gujarat', cities: 'Ahmedabad, Surat, Rajkot, Vadodara', status: 'Open' },
                { region: 'Rajasthan', cities: 'Jaipur, Jodhpur, Udaipur, Kota', status: 'Open' },
                { region: 'West Bengal', cities: 'Kolkata, Siliguri, Durgapur', status: 'Limited' },
                { region: 'Uttar Pradesh', cities: 'Lucknow, Kanpur, Varanasi, Agra', status: 'Open' },
                { region: 'Madhya Pradesh', cities: 'Indore, Bhopal, Gwalior, Jabalpur', status: 'Open' }
              ].map((territory, index) => (
                <div class="bg-gray-50 rounded-xl p-6 border-2 border-gray-200" key={index}>
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-gray-800 text-lg">{territory.region}</h3>
                    <span class={`px-3 py-1 rounded-full text-sm font-semibold ${
                      territory.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {territory.status}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">{territory.cities}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Distributor Application Form */}
      <section id="distributor-form" class="py-20 bg-gradient-to-br from-green-600 to-teal-600">
        <div class="container mx-auto px-4">
          <div class="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div class="text-center mb-8">
              <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Apply for Distribution Rights
              </h2>
              <p class="text-lg text-gray-600">
                Submit your application. Our partnerships team will evaluate and contact you within 48 hours.
              </p>
            </div>

            <form action="/api/submit-distributor" method="POST" class="space-y-6">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Company Name</label>
                  <input 
                    type="text" 
                    name="current_business" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                    placeholder="10-digit mobile"
                    pattern="[0-9]{10}"
                  />
                </div>
                
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    required
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">State/UT *</label>
                <select 
                  name="state" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">Select State/Union Territory</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">District & PIN Code *</label>
                <input 
                  type="text" 
                  name="district_pin" 
                  required
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                  placeholder="e.g., Mumbai - 400001"
                />
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Investment Capacity *</label>
                <select 
                  name="investment_range" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">Select investment range</option>
                  <option value="15L-25L">₹15 Lakh – ₹25 Lakh</option>
                  <option value="25L-40L">₹25 Lakh – ₹40 Lakh</option>
                  <option value="40L-50L+">₹40 Lakh – ₹50 Lakh+</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Current Distribution Experience *</label>
                <select 
                  name="experience_years"
                  id="experience-years-select"
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">Years in distribution business</option>
                  <option value="0">New to distribution</option>
                  <option value="3">1-3 years</option>
                  <option value="5">3-5 years</option>
                  <option value="10">5-10 years</option>
                  <option value="15">10+ years</option>
                </select>
              </div>

              <div id="network-size-container">
                <label class="block text-gray-700 font-semibold mb-2">Existing Network Size</label>
                <select 
                  name="outlet_count"
                  id="outlet-count-select"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">Current outlets/clients you serve</option>
                  <option value="10">10-25 outlets</option>
                  <option value="50">25-50 outlets</option>
                  <option value="100">50-100 outlets</option>
                  <option value="200">100+ outlets</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Timeline to Start *</label>
                <select 
                  name="timeline" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">When can you start operations?</option>
                  <option value="0-30">Within 1 month</option>
                  <option value="30-60">1-2 months</option>
                  <option value="60-90">2-3 months</option>
                  <option value="90+">3+ months</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Tell Us About Your Business</label>
                <textarea 
                  name="notes" 
                  rows="4"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                  placeholder="Your distribution experience, infrastructure, team size, existing brands you distribute, etc."
                ></textarea>
              </div>

              <input type="hidden" name="business_type" value="distributor" />
              <input type="hidden" name="source_page" value="/distributor" />

              <button 
                type="submit" 
                class="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-xl"
              >
                <i class="fas fa-paper-plane mr-2"></i>
                Submit Application for Review
              </button>

              <p class="text-sm text-gray-600 text-center">
                Applications are reviewed by our partnerships team. High-quality applicants will be contacted within 48 hours.
              </p>
            </form>

            {/* Form Conditional Logic - Distributor */}
            <script dangerouslySetInnerHTML={{__html: `
              document.addEventListener('DOMContentLoaded', function() {
                const experienceSelect = document.getElementById('experience-years-select');
                const networkContainer = document.getElementById('network-size-container');
                const networkSelect = document.getElementById('outlet-count-select');
                
                if (experienceSelect && networkContainer && networkSelect) {
                  // Initial state check
                  function toggleNetworkField() {
                    if (experienceSelect.value === '0') {
                      // Hide network field for new distributors
                      networkContainer.style.display = 'none';
                      networkSelect.value = '';
                      networkSelect.removeAttribute('required');
                    } else if (experienceSelect.value !== '') {
                      // Show network field for experienced distributors
                      networkContainer.style.display = 'block';
                    }
                  }
                  
                  // Listen to changes
                  experienceSelect.addEventListener('change', toggleNetworkField);
                  
                  // Initial check on page load
                  toggleNetworkField();
                }
              });
            `}} />
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section class="py-8 bg-gray-100">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center text-sm text-gray-600">
            <p class="mb-2">
              <strong>* Terms & Conditions Apply:</strong> Refundable investment up to ₹15L is subject to distributor agreement terms and performance criteria. 
              Territory allocation is based on market assessment and applicant qualifications.
            </p>
            <p>
              Investment amounts and margin percentages may vary based on territory size, market potential, and infrastructure requirements. 
              All figures are indicative and subject to final agreement.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="bg-gray-900 text-white py-8">
        <div class="container mx-auto px-4 text-center">
          <p class="text-gray-400">
            <a href="/" class="hover:text-white">← Back to Home</a> | 
            <a href="tel:8006999805" class="hover:text-white ml-2">Call: 800-699-9805</a> | 
            <a href="mailto:info@londonslush.com" class="hover:text-white ml-2">info@londonslush.com</a>
          </p>
          <p class="text-sm text-gray-500 mt-4">&copy; 2026 Dravya Roots Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>
    </>,
    { title: 'London Slush Distributor - Exclusive Territory Rights | Up to ₹15L Refundable' }
  )
})


export default app
// Force rebuild - Sun Feb  1 08:58:26 UTC 2026
console.log('Build timestamp: Sun Feb  1 09:12:09 UTC 2026');
