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

// Helper function to create JWT for Google OAuth2
async function createGoogleJWT(credentials: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }
  const base64UrlEncode = (obj: any) => {
    return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)
  const dataToSign = `${encodedHeader}.${encodedPayload}`
  const privateKey = credentials.private_key.replace(/\\n/g, '\n')
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '')
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(dataToSign))
  const signatureArray = new Uint8Array(signature)
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${dataToSign}.${signatureBase64}`
}

async function getGoogleAccessToken(credentials: any): Promise<string | null> {
  try {
    const jwt = await createGoogleJWT(credentials)
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
    })
    if (!tokenResponse.ok) return null
    const { access_token } = await tokenResponse.json() as { access_token: string }
    return access_token
  } catch (error) { return null }
}

async function sendEmailNotification(to: string, subject: string, htmlBody: string, textBody: string) {
  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@londonslush.com', name: 'London Slush Leads' },
        subject: subject,
        content: [{ type: 'text/plain', value: textBody }, { type: 'text/html', value: htmlBody }]
      }),
    })
    return response.ok
  } catch (error) { return false }
}

// Retail Form Handler
app.post('/api/submit-retail', async (c) => {
  try {
    const formData = await c.req.parseBody()
    const { DB } = c.env
    if (DB) {
      await DB.prepare(`INSERT INTO leads (name, phone, email, city, investment_range, timeline, business_type, source_page, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
        .bind(formData.name, formData.phone, formData.email || null, formData.city, formData.investment_range, formData.timeline, formData.business_type, formData.source_page).run()
    }
    const emailSubject = `🔔 New Retail Lead: ${formData.name}`
    const emailHtml = `<div style="font-family: Arial; padding: 20px;"><h2>New Retail Inquiry</h2><p><strong>Name:</strong> ${formData.name}</p><p><strong>Phone:</strong> ${formData.phone}</p></div>`
    const emailText = `New Retail Lead: ${formData.name}\nPhone: ${formData.phone}`
    
    Promise.all([
      sendEmailNotification('info@londonslush.com', emailSubject, emailHtml, emailText),
      sendEmailNotification('support@londonslush.com', emailSubject, emailHtml, emailText)
    ]).catch(err => console.error(err))

    return c.redirect(`/thank-you?type=retail&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) { return c.html('<h1>Error submitting form</h1>', 500) }
})

// Distributor Form Handler
app.post('/api/submit-distributor', async (c) => {
  try {
    const formData = await c.req.parseBody()
    const { DB } = c.env
    if (DB) {
      await DB.prepare(`INSERT INTO leads (name, phone, email, business_type, source_page, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`)
        .bind(formData.name, formData.phone, formData.email, formData.business_type, formData.source_page).run()
    }
    return c.redirect(`/thank-you?type=distributor&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) { return c.html('<h1>Error</h1>', 500) }
})

app.use(renderer)

app.get('/thank-you', (c) => {
  const name = c.req.query('name') || 'there'
  return c.render(
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 class="text-4xl font-bold text-gray-800">Thank You, {decodeURIComponent(name)}!</h1>
      <p class="mt-4 text-gray-600">Our team will contact you shortly.</p>
      <a href="/" class="mt-8 text-blue-600 hover:underline">Return to Home</a>
    </div>,
    { title: 'Thank You - London Slush' }
  )
})

app.get('/', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src="/logo.png" alt="London Slush" class="h-20 w-auto" />
          <div class="hidden md:flex space-x-6">
            <a href="#products" class="text-gray-700">Products</a>
            <a href="tel:8006999805" class="font-bold">800-699-9805</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section class="relative h-[600px] flex items-center justify-center bg-gray-900 text-white">
        <div class="z-10 text-center">
          <h1 class="text-5xl font-bold">Inspired by London. Crafted for India.</h1>
          <p class="mt-4 text-xl">Premium global frozen beverage brand</p>
          <div class="mt-8 flex gap-4 justify-center">
            <a href="/retail" class="bg-brand-red px-8 py-3 rounded-full font-bold">Retail Partner</a>
            <a href="/distributor" class="border-2 border-white px-8 py-3 rounded-full font-bold">Distributor</a>
          </div>
        </div>
      </section>

      {/* Cookie Consent Banner */}
      <div id="cookie-banner" class="hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 shadow-2xl z-50 border-t-4 border-red-600">
        <div class="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm flex-1">
            We use cookies to enhance your experience. <a href="/privacy" class="underline">Learn more</a>
          </p>
          <div class="flex gap-3">
            <button id="cookie-settings-btn" class="px-4 py-2 border border-white rounded">Settings</button>
            <button id="cookie-accept-btn" class="px-4 py-2 bg-red-600 rounded">Accept All</button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      <div id="cookie-settings-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full">
          <h2 class="text-2xl font-bold mb-6">Cookie Settings</h2>
          
          {/* Analytics Toggle */}
          <div class="flex items-center justify-between mb-6">
            <span class="font-medium">Analytics Cookies</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="cookie-analytics" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          {/* Marketing Toggle */}
          <div class="flex items-center justify-between mb-8">
            <span class="font-medium">Marketing Cookies</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="cookie-marketing" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div class="flex justify-end gap-3">
            <button id="cookie-modal-close" class="px-4 py-2 text-gray-600">Cancel</button>
            <button id="cookie-save-preferences" class="px-6 py-2 bg-red-600 text-white rounded font-bold">Save</button>
          </div>
        </div>
      </div>

      {/* Cookie JavaScript */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const banner = document.getElementById('cookie-banner');
          const modal = document.getElementById('cookie-settings-modal');
          
          if (!localStorage.getItem('cookie-consent')) {
            setTimeout(() => banner.classList.remove('hidden'), 1000);
          }
          
          document.getElementById('cookie-accept-btn').onclick = function() {
            localStorage.setItem('cookie-consent', 'true');
            banner.classList.add('hidden');
          };
          
          document.getElementById('cookie-settings-btn').onclick = function() {
            modal.classList.remove('hidden');
          };
          
          document.getElementById('cookie-modal-close').onclick = function() {
            modal.classList.add('hidden');
          };
          
          document.getElementById('cookie-save-preferences').onclick = function() {
            localStorage.setItem('cookie-consent', 'true');
            modal.classList.add('hidden');
            banner.classList.add('hidden');
          };
        });
      `}} />
    </>,
    { title: 'London Slush - Premium Franchise Opportunity' }
  )
})

export default app
