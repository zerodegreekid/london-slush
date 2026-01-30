import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// =============================================
// API ROUTES - FORM SUBMISSION HANDLERS
// =============================================

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

    // Insert lead into database
    const result = await DB.prepare(`
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

    // Redirect to thank you page
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

    // Insert lead into database
    const result = await DB.prepare(`
      INSERT INTO leads (
        name, phone, email, city, investment_range, timeline,
        current_business, experience_years, outlet_count, notes,
        business_type, source_page, priority, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      formData.name,
      formData.phone,
      formData.email,
      formData.city,
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
          <p><strong>City:</strong> ${formData.city}</p>
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
City: ${formData.city}
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

    // Redirect to thank you page
    return c.redirect(`/thank-you?type=distributor&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) {
    console.error('Error saving distributor lead:', error)
    return c.html('<h1>Error submitting form. Please call 800-699-9805</h1>', 500)
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
// HOMEPAGE - CRO-OPTIMIZED 3-CHOICE GATEWAY
// =============================================
app.get('/', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-transparent backdrop-blur-md shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-0 py-0 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.png" alt="London Slush" class="h-24 w-auto" />
          </a>
          <div class="hidden md:flex space-x-6 items-center">
            <a href="#why-london-slush" class="text-gray-700 hover:text-brand-red font-medium">Why Us</a>
            <a href="/products" class="text-gray-700 hover:text-brand-red font-medium">Products</a>
            <a href="#partners" class="text-gray-700 hover:text-brand-red font-medium">Our Partners</a>
            <a href="#contact" class="text-gray-700 hover:text-brand-red font-medium">Contact</a>
            <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush" target="_blank" class="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition font-semibold flex items-center space-x-2">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
            <a href="tel:8006999805" class="border-2 border-gray-700 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-700 hover:text-white transition font-semibold flex items-center space-x-2">
              <i class="fas fa-phone"></i>
              <span>Call</span>
            </a>
          </div>
          <button class="md:hidden text-gray-700">
            <i class="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </nav>

      {/* Hero Section - Video Background */}
      <section class="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
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

        {/* Hero Content */}
        <div class="container mx-auto px-4 relative z-10 text-center text-white">
          <div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
            {/* Logo */}
            <div class="flex justify-center mb-6">
              <a href="/">
                <img src="/logo.png" alt="London Slush" class="h-48 md:h-64 drop-shadow-2xl" />
              </a>
            </div>

            {/* Main Headline */}
            <h1 class="text-4xl md:text-7xl font-bold leading-tight drop-shadow-lg">
              Inspired by <span class="text-yellow-300">London</span>.<br/>
              Crafted for <span class="text-yellow-300">India</span>.
            </h1>

            {/* Subtext */}
            <p class="text-xl md:text-3xl text-gray-100 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              A premium global frozen beverage brand
            </p>

            {/* Trust Badges */}
            <div class="flex flex-wrap justify-center gap-6 py-6">
              <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                <i class="fas fa-star text-yellow-400"></i>
                <span class="font-semibold">150+ Partners</span>
              </div>
              <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                <i class="fas fa-chart-line text-green-400"></i>
                <span class="font-semibold">60-70% Margins<sup class="text-xs">*</sup></span>
              </div>
              <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
                <i class="fas fa-shield-alt text-blue-400"></i>
                <span class="font-semibold">Refundable<sup class="text-xs">*</sup></span>
              </div>
            </div>

            {/* Primary CTA - WhatsApp First */}
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a 
                href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush" 
                target="_blank"
                class="bg-green-500 hover:bg-green-600 text-white px-12 py-6 rounded-full font-bold text-2xl shadow-2xl transition transform hover:scale-110 flex items-center space-x-3 pulse-animation"
              >
                <i class="fab fa-whatsapp text-3xl"></i>
                <span>Start WhatsApp Chat</span>
              </a>
              <a 
                href="#business-paths" 
                class="border-2 border-white hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg backdrop-blur-md transition transform hover:scale-105 flex items-center space-x-2"
              >
                <span>View Options</span>
                <i class="fas fa-arrow-down"></i>
              </a>
            </div>

            {/* Scroll Indicator */}
            <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div class="flex flex-col items-center space-y-2 text-white/80">
                <span class="text-sm font-medium">Scroll to explore</span>
                <i class="fas fa-chevron-down text-xl"></i>
              </div>
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
              <p><strong>About London Slush:</strong> A premium frozen beverage brand with UK registration (<strong>Camellia Foods LTD, 13675105B1, Blackburn, UK</strong>), operated in India by <strong>Dravya Roots Pvt Ltd</strong>. Our recipes and branding draw inspiration from London's vibrant beverage culture, adapted specifically for the Indian market with local flavors and preferences.</p>
            </div>
          </div>
          
          <div class="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <div class="mb-3">
              <p class="font-bold text-white text-base mb-2">🇬🇧 UK Registered Office</p>
              <p class="text-xs"><strong>London Slush - Camellia Foods LTD</strong></p>
              <p class="text-xs">Company Registration: 13675105B1</p>
              <p class="text-xs">Business Centre, Suite 206 Davyfield Road, Blackburn, BB1 2QY, United Kingdom</p>
            </div>
            <p>&copy; 2026 London Slush | UK: Camellia Foods LTD | India Operations: Dravya Roots Pvt Ltd. All rights reserved.</p>
            <p class="mt-2 text-xs">For partnership inquiries: Call 800-699-9805 | WhatsApp +91-800-699-9805 | Email info@londonslush.com</p>
          </div>
        </div>
      </footer>
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
                    <div class="text-5xl font-bold text-blue-600 mb-2">₹2.5L - ₹5L</div>
                    <p class="text-lg font-semibold text-gray-800">Machine Investment</p>
                  </div>
                  
                  <div class="space-y-4 mb-8">
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Own the Machine</p>
                        <p class="text-sm text-gray-600">Full ownership after payment</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">Buy Raw Materials</p>
                        <p class="text-sm text-gray-600">Purchase syrups & supplies monthly</p>
                      </div>
                    </div>
                    
                    <div class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-blue-500 text-2xl mt-1"></i>
                      <div>
                        <p class="font-semibold text-gray-800">3-Month Lookout Period</p>
                        <p class="text-sm text-gray-600">Trial period to assess viability</p>
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
                      <li>• Purchase machine upfront</li>
                      <li>• Buy syrups from us monthly</li>
                      <li>• 3-month trial to evaluate</li>
                      <li>• 100% profits are yours</li>
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
              Revenue Projection (Individual Model)
            </h2>

            <div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <div class="grid md:grid-cols-2 gap-8 mb-8">
                <div class="bg-purple-50 rounded-2xl p-6">
                  <h3 class="text-xl font-bold text-gray-800 mb-4">Investment Breakdown</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-700">London Slush Machine (2-bowl)</span>
                      <span class="font-semibold">₹2,50,000</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Installation & Training</span>
                      <span class="font-semibold">₹25,000</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Initial Inventory</span>
                      <span class="font-semibold">₹25,000</span>
                    </div>
                    <div class="flex justify-between border-t-2 border-gray-300 pt-3 text-lg">
                      <span class="font-bold">Total Investment</span>
                      <span class="font-bold text-purple-600">₹3,00,000</span>
                    </div>
                  </div>
                </div>

                <div class="bg-green-50 rounded-2xl p-6">
                  <h3 class="text-xl font-bold text-gray-800 mb-4">Monthly Earnings (Est.)</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-700">50 cups/day @ ₹40</span>
                      <span class="font-semibold">₹60,000</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Cost per cup (syrup + ops)</span>
                      <span class="font-semibold">₹12</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-700">Monthly profit (65% margin)</span>
                      <span class="font-semibold">₹39,000</span>
                    </div>
                    <div class="flex justify-between border-t-2 border-gray-300 pt-3 text-lg">
                      <span class="font-bold">ROI Timeline</span>
                      <span class="font-bold text-green-600">8-10 months</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                <div class="flex items-start space-x-4">
                  <i class="fas fa-lightbulb text-yellow-500 text-3xl"></i>
                  <div>
                    <h4 class="font-bold text-gray-800 mb-2">Peak Season Advantage</h4>
                    <p class="text-gray-700">
                      During summer months (March-July), average sales increase by 60-80%. 
                      Many partners recover their entire investment in the first peak season!
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
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                >
                  <option value="">Select your preferred model</option>
                  <option value="Partnership Model">Partnership Model (₹0 upfront, profit sharing)</option>
                  <option value="Individual Model">Individual Model (₹2.5L-₹5L, buy raw materials)</option>
                  <option value="Not Sure">Not Sure - Need Consultation</option>
                </select>
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
                <label class="block text-gray-700 font-semibold mb-2">Investment Budget *</label>
                <select 
                  name="investment_range" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none transition"
                >
                  <option value="">Select your budget</option>
                  <option value="2.5L-3L">₹2.5L - ₹3L (Single machine)</option>
                  <option value="3L-5L">₹3L - ₹5L (Premium setup)</option>
                  <option value="5L+">₹5L+ (Multiple machines)</option>
                </select>
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
                <label class="block text-gray-700 font-semibold mb-2">Preferred Territory *</label>
                <select 
                  name="city" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">Select territory</option>
                  <option value="North India">North India (Delhi NCR, Punjab, Haryana)</option>
                  <option value="Maharashtra">Maharashtra (Mumbai, Pune)</option>
                  <option value="South India">South India (Bangalore, Chennai, Hyderabad)</option>
                  <option value="Gujarat">Gujarat (Ahmedabad, Surat)</option>
                  <option value="Rajasthan">Rajasthan (Jaipur, Jodhpur)</option>
                  <option value="West Bengal">West Bengal (Kolkata)</option>
                  <option value="Uttar Pradesh">Uttar Pradesh (Lucknow, Kanpur)</option>
                  <option value="Madhya Pradesh">Madhya Pradesh (Indore, Bhopal)</option>
                  <option value="Other">Other (Specify in notes)</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Investment Capacity *</label>
                <select 
                  name="investment_range" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-600 focus:outline-none transition"
                >
                  <option value="">Select investment range</option>
                  <option value="50L-75L">₹50L - ₹75L</option>
                  <option value="75L-1Cr">₹75L - ₹1 Crore</option>
                  <option value="1Cr-2Cr">₹1 Cr - ₹2 Cr</option>
                  <option value="2Cr+">₹2 Cr+</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Current Distribution Experience *</label>
                <select 
                  name="experience_years" 
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

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Existing Network Size</label>
                <select 
                  name="outlet_count" 
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

// =============================================
// PRODUCTS PAGE
// =============================================

app.get('/products', (c) => {
  return c.html(
    <>
      {/* Navigation - Matches Homepage */}
      <nav class="bg-transparent backdrop-blur-md shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.png" alt="London Slush" class="h-24 w-auto" />
          </a>
          <div class="hidden md:flex space-x-6 items-center">
            <a href="/#why-london-slush" class="text-gray-700 hover:text-brand-red font-medium">Why Us</a>
            <a href="/products" class="text-brand-red font-medium">Products</a>
            <a href="/#partners" class="text-gray-700 hover:text-brand-red font-medium">Our Partners</a>
            <a href="/#contact" class="text-gray-700 hover:text-brand-red font-medium">Contact</a>
            <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush" target="_blank" class="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition font-semibold flex items-center space-x-2">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
            <a href="tel:8006999805" class="border-2 border-gray-700 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-700 hover:text-white transition font-semibold flex items-center space-x-2">
              <i class="fas fa-phone"></i>
              <span>Call</span>
            </a>
          </div>
          <button class="md:hidden text-gray-700">
            <i class="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </nav>

      {/* Hero Section - Ultra Premium & Vibrant */}
      <section class="relative overflow-hidden py-32 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600">
        {/* Animated Background Pattern - Enhanced */}
        <div class="absolute inset-0 opacity-20">
          <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
          <div class="absolute top-1/2 left-1/3 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
          <div class="absolute top-1/3 right-1/4 w-36 h-36 bg-white rounded-full blur-3xl animate-pulse" style="animation-delay: 1.5s;"></div>
        </div>
        
        {/* Floating Product Images Background */}
        <div class="absolute inset-0 opacity-10">
          <img src="/slush-varieties.jpg" alt="" class="absolute top-20 left-10 w-32 h-32 rounded-full object-cover animate-float" />
          <img src="/rainbow-slush.jpg" alt="" class="absolute bottom-32 right-20 w-40 h-40 rounded-full object-cover animate-float" style="animation-delay: 0.5s;" />
          <img src="/slush-blue-drinks.jpg" alt="" class="absolute top-1/2 right-10 w-36 h-36 rounded-full object-cover animate-float" style="animation-delay: 1s;" />
        </div>
        
        <div class="container mx-auto px-4 text-center relative z-10">
          <div class="mb-6">
            <span class="inline-block bg-white/30 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase shadow-2xl">
              🇬🇧 Born in London • Made for India 🇮🇳
            </span>
          </div>
          
          <h1 class="text-5xl md:text-8xl font-extrabold mb-8 text-white drop-shadow-2xl leading-tight">
            Premium Frozen
            <br />
            <span class="bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 text-transparent bg-clip-text">
              Beverage Experience
            </span>
          </h1>
          
          <div class="flex flex-wrap justify-center gap-4 text-lg md:text-xl font-bold text-white mb-8">
            <div class="bg-white/30 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all">
              <div class="text-4xl mb-2">🍹</div>
              <div>11 Delicious Flavors</div>
              <div class="text-xs opacity-80 mt-1">Vitamin Enriched</div>
            </div>
            <div class="bg-white/30 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all">
              <div class="text-4xl mb-2">🇮🇹</div>
              <div>Italian Machinery</div>
              <div class="text-xs opacity-80 mt-1">10-Year Lifespan</div>
            </div>
            <div class="bg-white/30 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all">
              <div class="text-4xl mb-2">🎁</div>
              <div>Free Accessories</div>
              <div class="text-xs opacity-80 mt-1">Complete Setup</div>
            </div>
          </div>
          
          <p class="text-xl md:text-3xl text-white/95 max-w-4xl mx-auto font-light leading-relaxed mb-10">
            Experience the <strong>perfect blend</strong> of taste, quality, and refreshment
          </p>
          
          {/* Quick CTA Buttons */}
          <div class="flex flex-wrap justify-center gap-4">
            <a href="#flavors" class="bg-white text-brand-red px-10 py-5 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
              <i class="fas fa-ice-cream mr-2"></i>Explore Flavors
            </a>
            <a href="https://wa.me/918006999805?text=I%20want%20product%20information" 
               class="bg-green-500 text-white px-10 py-5 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
              <i class="fab fa-whatsapp mr-2"></i>Get Product Info
            </a>
          </div>
        </div>
        
        {/* Scroll Down Indicator */}
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <i class="fas fa-chevron-down text-3xl"></i>
        </div>
      </section>

      {/* Slush Flavors Section - Ultra Premium Grid */}
      <section id="flavors" class="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div class="container mx-auto px-4">
          <div class="text-center mb-20">
            <div class="inline-block mb-6">
              <span class="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase shadow-lg">
                Premium Quality Ingredients
              </span>
            </div>
            
            <h2 class="text-5xl md:text-7xl font-extrabold mb-8 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-transparent bg-clip-text leading-tight">
              11 Signature Slush Flavors
            </h2>
            
            {/* Key Selling Points as Premium Badges */}
            <div class="flex flex-wrap justify-center gap-4 mb-10">
              <div class="bg-gradient-to-br from-green-400 to-green-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transform hover:scale-110 transition-all hover:rotate-2">
                <i class="fas fa-pills mr-2 text-xl"></i>
                <span class="text-lg">Vitamin A, C & E</span>
              </div>
              <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transform hover:scale-110 transition-all hover:rotate-2">
                <i class="fas fa-wheat-awn mr-2 text-xl"></i>
                <span class="text-lg">Gluten-Free</span>
              </div>
              <div class="bg-gradient-to-br from-purple-400 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transform hover:scale-110 transition-all hover:rotate-2">
                <i class="fas fa-leaf mr-2 text-xl"></i>
                <span class="text-lg">100% Vegan</span>
              </div>
              <div class="bg-gradient-to-br from-red-400 to-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transform hover:scale-110 transition-all hover:rotate-2">
                <i class="fas fa-heart mr-2 text-xl"></i>
                <span class="text-lg">Zero Cholesterol</span>
              </div>
              <div class="bg-gradient-to-br from-blue-400 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl transform hover:scale-110 transition-all hover:rotate-2">
                <i class="fas fa-shield-alt mr-2 text-xl"></i>
                <span class="text-lg">Allergen-Free</span>
              </div>
            </div>

            <p class="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
              Made from <strong class="text-brand-red">premium quality syrup</strong> in a food-grade manufacturing environment. 
              Each flavor is <strong class="text-brand-blue">crafted with care</strong> and free from all common allergens.
            </p>
            
            <div class="mt-8 inline-block bg-gradient-to-r from-orange-100 to-pink-100 border-2 border-orange-300 px-8 py-4 rounded-2xl">
              <p class="text-lg text-gray-800">
                <i class="fas fa-star text-yellow-500 mr-2"></i>
                <strong>Perfect for:</strong> Cafés • Restaurants • Cinemas • Food Courts • Malls • Events
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {/* Flavor 1 - Tangy Orange */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-orange-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/slush-varieties.jpg" alt="Tangy Orange Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute top-4 right-4 z-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow-2xl animate-pulse">
                  🔥 Bestseller!
                </div>
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-orange-600">Vitamin C</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-orange-600">Natural</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-orange-600 flex items-center">
                  🍊 Tangy Orange
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Orange Punch – Orange Flavoured Mix!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Perfect balance of fruit and sweet flavors. Reminiscent of fresh-squeezed orange juice.
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Most Popular</span>
                </div>
              </div>
            </div>

            {/* Flavor 2 - Exotic Pineapple */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-yellow-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/fusion-raspberry-green.jpg" alt="Exotic Pineapple Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-yellow-600">Tropical</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-yellow-600">Vitamin C</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-yellow-600 flex items-center">
                  🍍 Exotic Pineapple
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Refreshing Pineapple Slush With A Kick!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Made with real pineapple and signature slush ice. A must-try classic.
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Refreshing</span>
                </div>
              </div>
            </div>

            {/* Flavor 3 - Icy Cola */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-gray-700">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/icy-coca.jpg" alt="Icy Cola Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-gray-700">Classic</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-gray-700">Energizing</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-gray-700 flex items-center">
                  🥤 Icy Cola
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Cola Flavoured Slush With Great Colour!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Subtle cola flavor that transports you to paradise. Unforgettable taste!
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star-half-alt text-yellow-400 mr-2"></i>
                  <span class="font-bold">Classic Taste</span>
                </div>
              </div>
            </div>

            {/* Flavor 4 - Sweet Litchi */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-pink-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/slush-pink-drink.jpg" alt="Sweet Litchi Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute top-4 right-4 z-20 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow-2xl animate-pulse">
                  💖 Popular!
                </div>
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-pink-600">Real Fruit</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-pink-600">Sweet</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-pink-600 flex items-center">
                  🌸 Sweet Litchi
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Fruity Taste Made From Real Litchi!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Real fruit flavor swirling around the cup. One of our most popular flavors!
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Customer Favorite</span>
                </div>
              </div>
            </div>

            {/* Flavor 5 - Sour Green Apple */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-green-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/fabulous-juicy-slush.jpg" alt="Sour Green Apple Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-green-600">Tangy</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-green-600">Fresh</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-green-600 flex items-center">
                  🍏 Sour Green Apple
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Fresh Green Apple Goodness!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Sweet and nostalgic with fresh green apple goodness. So worth it!
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star-half-alt text-yellow-400 mr-2"></i>
                  <span class="font-bold">Tangy & Fresh</span>
                </div>
              </div>
            </div>

            {/* Flavor 6 - Blue Berry */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-blue-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/slush-blue-drinks.jpg" alt="Blue Berry Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-blue-600">Berry</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-blue-600">Tropical</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-blue-600 flex items-center">
                  🫐 Blue Berry
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">A Mix Of Tropical Flavour Of Berry!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Tropical berry flavor with a nostalgic blue syrup twist.
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Exotic Blend</span>
                </div>
              </div>
            </div>

            {/* Flavor 7 - Bubble Gum */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-pink-400">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/slush-pink-grape.jpg" alt="Bubble Gum Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-pink-500">Fun</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-pink-500">Kids' Favorite</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-pink-500 flex items-center">
                  🍬 Bubble Gum
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Splash With A Bubble Gum Twist!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Classic candy taste that brings back childhood memories.
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Nostalgic Treat</span>
                </div>
              </div>
            </div>

            {/* Flavor 8 - Simple Strawberry */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-red-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/dance-with-slush.jpg" alt="Simple Strawberry Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-red-600">Classic</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-red-600">Passion</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-red-600 flex items-center">
                  🍓 Simple Strawberry
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Tropical Slush With Strawberry Passion!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Tropical slush with strawberry passion. Classic perfection!
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Timeless Classic</span>
                </div>
              </div>
            </div>

            {/* Flavor 9 - Seven Rainbow */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-purple-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/rainbow-slush.jpg" alt="Seven Rainbow Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute top-4 right-4 z-20 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white px-5 py-2 rounded-full font-bold text-sm shadow-2xl animate-pulse">
                  ✨ Unique!
                </div>
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">Rainbow</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold bg-gradient-to-r from-pink-600 to-yellow-600 text-white">Instagrammable</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-transparent bg-clip-text flex items-center">
                  🌈 Seven Rainbow
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Refreshing Rainbow Slushie!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Multi-colored, personalized refreshing slushie. Perfect for social media!
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Insta-Worthy</span>
                </div>
              </div>
            </div>

            {/* Flavor 10 - Awesome Mango */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-yellow-500">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/fabulous-juicy-slush.jpg" alt="Awesome Mango Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-yellow-600">Tropical</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-yellow-600">Rich</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-yellow-500 flex items-center">
                  🥭 Awesome Mango
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">A Blend Of Tropical Mango!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Timeless tropical mango blend. Perfect in all seasons.
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">All-Season Hit</span>
                </div>
              </div>
            </div>

            {/* Flavor 11 - Power Blackberry */}
            <div class="group bg-white rounded-3xl shadow-xl overflow-hidden transform hover:-translate-y-6 hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-purple-700">
              <div class="relative h-64 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <img src="/slush-varieties.jpg" alt="Power Blackberry Slush" class="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                <div class="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-purple-700">Berry</span>
                  <span class="bg-white/90 text-xs px-3 py-1 rounded-full font-bold text-purple-700">Antioxidants</span>
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-3xl font-extrabold mb-2 text-purple-700 flex items-center">
                  🫐 Power Blackberry
                </h3>
                <p class="text-sm text-gray-500 mb-3 italic font-medium">Refreshing Blackberry Slush!</p>
                <p class="text-gray-700 leading-relaxed mb-4">
                  Light, subtle flavors paired with classic slush ice. Most refreshing treat!
                </p>
                <div class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <i class="fas fa-star text-yellow-400 mr-2"></i>
                  <span class="font-bold">Ultra Refreshing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Good To Know Features */}
      <section class="py-16 bg-gradient-to-r from-brand-blue to-brand-light-blue text-white">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4">Good To Know</h2>
            <p class="text-xl opacity-90">Why Our Slush Syrups Are Superior</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div class="text-center">
              <div class="bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-flask text-4xl"></i>
              </div>
              <h3 class="font-bold mb-2">Made with Added Flavors</h3>
            </div>

            <div class="text-center">
              <div class="bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-pills text-4xl"></i>
              </div>
              <h3 class="font-bold mb-2">With Vitamin A, C & E</h3>
            </div>

            <div class="text-center">
              <div class="bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-heart-broken text-4xl"></i>
              </div>
              <h3 class="font-bold mb-2">Cholesterol Free</h3>
            </div>

            <div class="text-center">
              <div class="bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-ban text-4xl"></i>
              </div>
              <h3 class="font-bold mb-2">Lactose Free</h3>
            </div>

            <div class="text-center">
              <div class="bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-leaf text-4xl"></i>
              </div>
              <h3 class="font-bold mb-2">Suited for Vegetarians</h3>
            </div>

            <div class="text-center">
              <div class="bg-white/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <i class="fas fa-wheat text-4xl"></i>
              </div>
              <h3 class="font-bold mb-2">Gluten Free</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Slush Machines Section - Premium */}
      <section class="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div class="container mx-auto px-4 relative z-10">
          <div class="max-w-5xl mx-auto">
            {/* Section Title */}
            <div class="text-center mb-16">
              <div class="inline-block mb-6">
                <span class="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase shadow-xl">
                  🇮🇹 Made in Italy
                </span>
              </div>
              
              <h2 class="text-5xl md:text-6xl font-extrabold mb-6">
                <i class="fas fa-cog text-brand-light-blue mr-3 animate-spin-slow"></i>
                Premium Slush Machines
              </h2>
              <p class="text-2xl text-gray-300 mb-4">
                High-profit asset for your food business
              </p>
              <p class="text-lg text-gray-400 max-w-3xl mx-auto">
                Industry-leading Italian engineering meets reliability. Designed for continuous operation and maximum profits.
              </p>
            </div>

            {/* Features Grid */}
            <div class="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-10 mb-10 border border-white/20">
              <div class="grid md:grid-cols-2 gap-10">
                <div>
                  <h3 class="font-extrabold text-2xl mb-6 text-white flex items-center">
                    <span class="bg-gradient-to-r from-blue-400 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <i class="fas fa-cogs text-xl"></i>
                    </span>
                    Machine Features
                  </h3>
                  <ul class="space-y-4">
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Manufactured in Italy</div>
                        <div class="text-sm text-gray-400">Premium European engineering & quality</div>
                      </div>
                    </li>
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Quick Freezing Technology</div>
                        <div class="text-sm text-gray-400">Ready to serve in minutes, not hours</div>
                      </div>
                    </li>
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Extremely Low Maintenance</div>
                        <div class="text-sm text-gray-400">Minimal downtime, maximum uptime</div>
                      </div>
                    </li>
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Super Simple to Use</div>
                        <div class="text-sm text-gray-400">Staff training in under 10 minutes</div>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 class="font-extrabold text-2xl mb-6 text-white flex items-center">
                    <span class="bg-gradient-to-r from-purple-400 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <i class="fas fa-headset text-xl"></i>
                    </span>
                    Support Included
                  </h3>
                  <ul class="space-y-4">
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Designed to Last 10 Years</div>
                        <div class="text-sm text-gray-400">Built for commercial durability</div>
                      </div>
                    </li>
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Dedicated Telephone Helpline</div>
                        <div class="text-sm text-gray-400">Expert support when you need it</div>
                      </div>
                    </li>
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">On-Site Parts & Labour Warranty</div>
                        <div class="text-sm text-gray-400">Full coverage, zero hassle</div>
                      </div>
                    </li>
                    <li class="flex items-start">
                      <i class="fas fa-check-circle text-green-400 mr-3 text-xl mt-1"></i>
                      <div>
                        <div class="font-bold text-lg">Life-Time Support</div>
                        <div class="text-sm text-gray-400">We're with you for the long haul</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Stats Banner */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 transform hover:scale-105 transition">
                <div class="text-4xl font-extrabold text-blue-400 mb-2">10+</div>
                <div class="text-sm text-gray-400">Years Lifespan</div>
              </div>
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 transform hover:scale-105 transition">
                <div class="text-4xl font-extrabold text-green-400 mb-2">24/7</div>
                <div class="text-sm text-gray-400">Support Available</div>
              </div>
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 transform hover:scale-105 transition">
                <div class="text-4xl font-extrabold text-purple-400 mb-2">100%</div>
                <div class="text-sm text-gray-400">Made in Italy</div>
              </div>
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 transform hover:scale-105 transition">
                <div class="text-4xl font-extrabold text-yellow-400 mb-2">&lt;10min</div>
                <div class="text-sm text-gray-400">Training Time</div>
              </div>
            </div>

            {/* CTA */}
            <div class="text-center">
              <a href="https://wa.me/918006999805?text=I%20want%20to%20know%20more%20about%20slush%20machines" 
                 class="inline-flex items-center bg-green-500 text-white px-12 py-6 rounded-full font-bold text-xl hover:bg-green-600 transition shadow-2xl hover:shadow-3xl transform hover:scale-105">
                <i class="fab fa-whatsapp mr-3 text-2xl"></i>
                <div>
                  <div>Contact Us About Machines</div>
                  <div class="text-sm font-normal opacity-90">Get pricing & specifications</div>
                </div>
              </a>
              <p class="text-sm text-gray-400 mt-4">
                <i class="fas fa-phone mr-2"></i>Or call: <a href="tel:8006999805" class="text-blue-400 hover:text-blue-300 font-bold">800-699-9805</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Serving Accessories Section */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4">
              <i class="fas fa-box text-brand-red mr-3"></i>
              Serving Accessories
            </h2>
            <p class="text-xl text-gray-600 mb-2">Everything you need to serve your customers</p>
            <p class="text-2xl font-bold text-green-600">FREE for our business partners! 🎁</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div class="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
              <div class="text-6xl mb-3">🥤</div>
              <h3 class="font-bold">Classic Cup</h3>
            </div>

            <div class="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
              <div class="text-6xl mb-3">🧃</div>
              <h3 class="font-bold">Lid</h3>
            </div>

            <div class="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
              <div class="text-6xl mb-3">☕</div>
              <h3 class="font-bold">Paper Cup</h3>
            </div>

            <div class="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
              <div class="text-6xl mb-3">🧻</div>
              <h3 class="font-bold">Tissues</h3>
            </div>

            <div class="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
              <div class="text-6xl mb-3">🥄</div>
              <h3 class="font-bold">Spoon</h3>
            </div>

            <div class="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
              <div class="text-6xl mb-3">🥤</div>
              <h3 class="font-bold">Straw</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - High Conversion */}
      <section class="py-24 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div class="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-red to-purple-600"></div>
        <div class="absolute inset-0 opacity-20">
          <div class="absolute top-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        </div>
        
        <div class="container mx-auto px-4 text-center relative z-10">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-4xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-2xl">
              Ready to Start Your Slush Business?
            </h2>
            <p class="text-xl md:text-2xl mb-4 text-white/95 leading-relaxed">
              Choose your partnership model and get started today!
            </p>
            <p class="text-lg mb-12 text-white/90">
              <strong>60-70% Margins*</strong> • <strong>Refundable Investment*</strong> • <strong>150+ Partners</strong> • <strong>Full Support</strong>
            </p>
            
            {/* CTA Buttons - Prominent */}
            <div class="flex flex-col md:flex-row gap-6 justify-center mb-10">
              <a href="/retail" class="group bg-white text-brand-blue px-10 py-6 rounded-2xl font-bold text-xl hover:bg-gray-100 transition shadow-2xl hover:shadow-3xl transform hover:scale-105">
                <div class="flex items-center justify-center">
                  <i class="fas fa-store mr-3 text-2xl"></i>
                  <div class="text-left">
                    <div>Retail Partnership</div>
                    <div class="text-sm font-normal opacity-80">₹0 - ₹5L Investment</div>
                  </div>
                </div>
              </a>
              
              <a href="/distributor" class="group bg-gradient-to-r from-red-600 to-red-700 text-white px-10 py-6 rounded-2xl font-bold text-xl hover:from-red-700 hover:to-red-800 transition shadow-2xl hover:shadow-3xl transform hover:scale-105">
                <div class="flex items-center justify-center">
                  <i class="fas fa-truck mr-3 text-2xl"></i>
                  <div class="text-left">
                    <div>Become a Distributor</div>
                    <div class="text-sm font-normal opacity-90">Up to ₹15L Refundable*</div>
                  </div>
                </div>
              </a>
            </div>
            
            {/* WhatsApp CTA - Most Prominent */}
            <div class="mb-10">
              <a href="https://wa.me/918006999805?text=Hi!%20I%20want%20to%20know%20more%20about%20London%20Slush%20products%20and%20partnership" 
                 class="inline-flex items-center bg-green-500 text-white px-12 py-7 rounded-2xl font-bold text-2xl hover:bg-green-600 transition shadow-2xl hover:shadow-3xl transform hover:scale-110 animate-bounce-subtle">
                <i class="fab fa-whatsapp mr-4 text-3xl"></i>
                <div class="text-left">
                  <div>WhatsApp Us Now</div>
                  <div class="text-sm font-normal opacity-90">Get Instant Response</div>
                </div>
              </a>
            </div>
            
            {/* Contact Options */}
            <div class="flex flex-wrap justify-center gap-8 text-white">
              <a href="tel:8006999805" class="flex items-center hover:text-blue-200 transition">
                <i class="fas fa-phone mr-2 text-xl"></i>
                <div class="text-left">
                  <div class="text-xs opacity-80">Call Us</div>
                  <div class="font-bold">800-699-9805</div>
                </div>
              </a>
              <a href="mailto:info@londonslush.com" class="flex items-center hover:text-blue-200 transition">
                <i class="fas fa-envelope mr-2 text-xl"></i>
                <div class="text-left">
                  <div class="text-xs opacity-80">Email</div>
                  <div class="font-bold">info@londonslush.com</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="bg-gray-900 text-white py-8">
        <div class="container mx-auto px-4">
          <div class="grid md:grid-cols-4 gap-8 mb-6">
            <div>
              <img src="/logo-simple.png" alt="London Slush" class="h-24 mb-4" />
              <p class="text-gray-400 mb-4">Premium Frozen Beverage Brand</p>
              
              {/* Social Media Links */}
              <div class="flex gap-3">
                <a href="https://www.facebook.com/londonslushindia" target="_blank" rel="noopener noreferrer" 
                   class="bg-blue-600 hover:bg-blue-700 w-10 h-10 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
                   aria-label="Facebook">
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/londonslushindia/" target="_blank" rel="noopener noreferrer" 
                   class="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 w-10 h-10 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
                   aria-label="Instagram">
                  <i class="fab fa-instagram"></i>
                </a>
                <a href="https://youtube.com/@londonslush?si=XvUmEpcN6_IACAvN" target="_blank" rel="noopener noreferrer" 
                   class="bg-red-600 hover:bg-red-700 w-10 h-10 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
                   aria-label="YouTube">
                  <i class="fab fa-youtube"></i>
                </a>
              </div>
            </div>
            <div>
              <h3 class="font-bold mb-3">Quick Links</h3>
              <ul class="space-y-2">
                <li><a href="/" class="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="/products" class="text-gray-400 hover:text-white transition">Products</a></li>
                <li><a href="/retail" class="text-gray-400 hover:text-white transition">Retail Partners</a></li>
                <li><a href="/distributor" class="text-gray-400 hover:text-white transition">Distributors</a></li>
              </ul>
            </div>
            <div>
              <h3 class="font-bold mb-3">Contact Us</h3>
              <ul class="space-y-2 text-gray-400">
                <li><i class="fas fa-phone mr-2"></i><a href="tel:8006999805" class="hover:text-white transition">800-699-9805</a></li>
                <li><i class="fas fa-envelope mr-2"></i><a href="mailto:info@londonslush.com" class="hover:text-white transition">info@londonslush.com</a></li>
                <li><i class="fab fa-whatsapp mr-2"></i><a href="https://wa.me/918006999805" class="hover:text-white transition">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h3 class="font-bold mb-3">Follow Us</h3>
              <p class="text-gray-400 text-sm mb-3">Stay connected for latest updates, flavors, and offers!</p>
              <div class="space-y-2">
                <a href="https://www.facebook.com/londonslushindia" target="_blank" rel="noopener noreferrer" 
                   class="flex items-center text-gray-400 hover:text-blue-500 transition">
                  <i class="fab fa-facebook mr-2 text-lg"></i>
                  <span class="text-sm">Facebook</span>
                </a>
                <a href="https://www.instagram.com/londonslushindia/" target="_blank" rel="noopener noreferrer" 
                   class="flex items-center text-gray-400 hover:text-pink-500 transition">
                  <i class="fab fa-instagram mr-2 text-lg"></i>
                  <span class="text-sm">Instagram</span>
                </a>
                <a href="https://youtube.com/@londonslush?si=XvUmEpcN6_IACAvN" target="_blank" rel="noopener noreferrer" 
                   class="flex items-center text-gray-400 hover:text-red-500 transition">
                  <i class="fab fa-youtube mr-2 text-lg"></i>
                  <span class="text-sm">YouTube</span>
                </a>
              </div>
            </div>
          </div>
          <div class="border-t border-gray-800 pt-6 text-center text-gray-500">
            <div class="mb-4 text-sm">
              <p class="font-bold text-white mb-2">🇬🇧 UK Registered Office</p>
              <p><strong>London Slush</strong></p>
              <p>Camellia Foods LTD, Company Registration: 13675105B1</p>
              <p>Business Centre, Suite 206 Davyfield Road, Blackburn, BB1 2QY, United Kingdom</p>
              <p class="mt-2"><i class="fas fa-envelope mr-2"></i>Email: <a href="mailto:info@londonslush.com" class="text-brand-light-blue hover:text-white transition">info@londonslush.com</a></p>
            </div>
            <p class="text-xs">&copy; 2026 London Slush by Dravya Roots Pvt Ltd (India Operations). All rights reserved.</p>
            <p class="text-xs mt-1">UK Operations: Camellia Foods LTD | India Partner: Dravya Roots Pvt Ltd</p>
          </div>
        </div>
      </footer>
    </>,
    { title: 'London Slush Products - 11 Delicious Flavors & Premium Equipment' }
  )
})

export default app
