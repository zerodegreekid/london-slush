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

// Franchise Form Handler
app.post('/api/submit-franchise', async (c) => {
  try {
    const formData = await c.req.parseBody()
    const { DB } = c.env

    // Insert lead into database
    const result = await DB.prepare(`
      INSERT INTO leads (
        name, phone, email, whatsapp, city, state,
        investment_range, timeline, current_business, experience_years,
        notes, business_type, source_page, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      formData.name,
      formData.phone,
      formData.email || null,
      formData.whatsapp || null,
      formData.city,
      formData.state,
      formData.investment_range,
      formData.timeline,
      formData.current_business || null,
      formData.experience_years || null,
      formData.notes || null,
      formData.business_type,
      formData.source_page
    ).run()

    // Redirect to thank you page
    return c.redirect(`/thank-you?type=franchise&name=${encodeURIComponent(formData.name as string)}`)
  } catch (error) {
    console.error('Error saving franchise lead:', error)
    return c.html('<h1>Error submitting form. Please call 800-699-9805</h1>', 500)
  }
})

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
  const type = c.req.query('type') || 'franchise'
  const name = c.req.query('name') || 'there'

  const typeData = {
    franchise: {
      title: 'Franchise Application Received!',
      icon: 'store',
      color: 'blue',
      nextSteps: [
        'Our franchise team will review your application within 24 hours',
        'You\'ll receive a detailed franchise kit via email',
        'A franchise consultant will call you to discuss next steps',
        'We\'ll schedule a discovery call to answer all your questions'
      ]
    },
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

  const data = typeData[type as keyof typeof typeData] || typeData.franchise

  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-white shadow-md">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.svg" alt="London Slush" class="h-12 w-auto" />
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
          <img src="/logo.svg" alt="London Slush" class="h-16 mx-auto mb-4 brightness-0 invert" />
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
      <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <img src="/logo.svg" alt="London Slush" class="h-12 w-auto" />
          </div>
          <div class="hidden md:flex space-x-6 items-center">
            <a href="#why-london-slush" class="text-gray-700 hover:text-brand-red font-medium">Why Us</a>
            <a href="#partners" class="text-gray-700 hover:text-brand-red font-medium">Our Partners</a>
            <a href="#contact" class="text-gray-700 hover:text-brand-red font-medium">Contact</a>
            <a href="tel:8006999805" class="bg-brand-red text-white px-6 py-2 rounded-full hover:bg-red-700 transition font-semibold">
              <i class="fas fa-phone mr-2"></i>Call Now
            </a>
          </div>
          <button class="md:hidden text-gray-700">
            <i class="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </nav>

      {/* Hero Section - Above The Fold */}
      <section class="gradient-bg text-white py-20 md:py-32 relative overflow-hidden">
        <div class="container mx-auto px-4 relative z-10">
          <div class="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div class="space-y-8">
              <div class="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                <i class="fas fa-star text-yellow-400 mr-2"></i>
                Trusted by 150+ Partners Across India
              </div>
              
              <h1 class="text-4xl md:text-6xl font-bold leading-tight">
                Grow Profitable Beverage Revenue with <span class="text-yellow-300">London Slush</span>
              </h1>
              
              <p class="text-xl md:text-2xl text-blue-100 leading-relaxed">
                Built for Franchisees, Retail Chains & Distribution Partners Across India
              </p>
              
              {/* Trust Anchors */}
              <div class="grid grid-cols-2 gap-4 py-6">
                <div class="flex items-start space-x-3">
                  <i class="fas fa-check-circle text-green-400 text-2xl mt-1"></i>
                  <div>
                    <p class="font-semibold text-lg">Refundable Security</p>
                    <p class="text-blue-100 text-sm">Low-risk investment model</p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <i class="fas fa-check-circle text-green-400 text-2xl mt-1"></i>
                  <div>
                    <p class="font-semibold text-lg">Plug & Play Setup</p>
                    <p class="text-blue-100 text-sm">Start earning in 7 days</p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <i class="fas fa-check-circle text-green-400 text-2xl mt-1"></i>
                  <div>
                    <p class="font-semibold text-lg">Central Supply</p>
                    <p class="text-blue-100 text-sm">Consistent quality guaranteed</p>
                  </div>
                </div>
                <div class="flex items-start space-x-3">
                  <i class="fas fa-check-circle text-green-400 text-2xl mt-1"></i>
                  <div>
                    <p class="font-semibold text-lg">60-70% Margins</p>
                    <p class="text-blue-100 text-sm">Industry-leading profitability</p>
                  </div>
                </div>
              </div>
              
              {/* Social Proof Numbers */}
              <div class="flex space-x-8 pt-4 border-t border-white/20">
                <div>
                  <p class="text-3xl font-bold text-yellow-300">150+</p>
                  <p class="text-blue-100 text-sm">Active Outlets</p>
                </div>
                <div>
                  <p class="text-3xl font-bold text-yellow-300">45+</p>
                  <p class="text-blue-100 text-sm">Cities Covered</p>
                </div>
                <div>
                  <p class="text-3xl font-bold text-yellow-300">12-18</p>
                  <p class="text-blue-100 text-sm">Months ROI</p>
                </div>
              </div>
            </div>

            {/* Right: Product Images */}
            <div class="relative">
              <div class="grid grid-cols-2 gap-4">
                <img src="/slush-pink-grape.jpg" alt="London Slush Pink" class="rounded-2xl shadow-2xl w-full h-64 object-cover" />
                <img src="/slush-blue-drinks.jpg" alt="London Slush Blue" class="rounded-2xl shadow-2xl w-full h-64 object-cover mt-8" />
              </div>
              <div class="absolute -bottom-4 -right-4 bg-yellow-400 text-brand-blue px-6 py-3 rounded-full shadow-xl font-bold pulse-animation">
                <i class="fas fa-fire mr-2"></i>Hot Selling
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* 3-CHOICE INTENT GATEWAY */}
      <section class="py-20 bg-gray-50 relative -mt-16">
        <div class="container mx-auto px-4">
          <div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative z-10">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
                Choose Your <span class="text-brand-red">Business Path</span>
              </h2>
              <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                Select the opportunity that fits your business goals. Each path is designed for maximum profitability.
              </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8">
              {/* Franchise Card */}
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 card-hover border-2 border-blue-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 bg-brand-red text-white px-4 py-1 rounded-bl-2xl text-sm font-semibold">
                  Most Popular
                </div>
                <div class="mb-6">
                  <div class="bg-brand-blue text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <i class="fas fa-store text-3xl"></i>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">I Want a Franchise</h3>
                  <p class="text-gray-600 mb-4">Start your own London Slush outlet with full support</p>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Investment: ₹8L - ₹25L</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>ROI: 12-18 months</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Full brand rights</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Training & support</span>
                  </div>
                </div>
                
                <a href="/franchise" class="block w-full bg-brand-red text-white text-center py-4 rounded-xl font-semibold hover:bg-red-700 transition">
                  Explore Franchise <i class="fas fa-arrow-right ml-2"></i>
                </a>
              </div>

              {/* Retail Card */}
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 card-hover border-2 border-purple-200 relative overflow-hidden">
                <div class="mb-6">
                  <div class="bg-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <i class="fas fa-coffee text-3xl"></i>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">I Own a Café / Outlet</h3>
                  <p class="text-gray-600 mb-4">Add high-margin beverages without extra staff</p>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Investment: ₹2.5L - ₹5L</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>30-40% revenue boost</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Automated machines</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Seasonal demand advantage</span>
                  </div>
                </div>
                
                <a href="/retail" class="block w-full bg-purple-600 text-white text-center py-4 rounded-xl font-semibold hover:bg-purple-700 transition">
                  Get Retail Pricing <i class="fas fa-arrow-right ml-2"></i>
                </a>
              </div>

              {/* Distributor Card */}
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 card-hover border-2 border-orange-200 relative overflow-hidden">
                <div class="absolute top-0 right-0 bg-yellow-400 text-gray-800 px-4 py-1 rounded-bl-2xl text-sm font-semibold">
                  High Ticket
                </div>
                <div class="mb-6">
                  <div class="bg-orange-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <i class="fas fa-truck text-3xl"></i>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">I'm a Distributor / Investor</h3>
                  <p class="text-gray-600 mb-4">Territory rights and volume-based partnerships</p>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Investment: ₹50L+</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Exclusive territories</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Volume-based margins</span>
                  </div>
                  <div class="flex items-center space-x-2 text-sm">
                    <i class="fas fa-check text-green-600"></i>
                    <span>Expansion roadmap support</span>
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
                  RS
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Rajesh Sharma</h4>
                  <p class="text-sm text-gray-600">Franchise Owner, Delhi</p>
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
                  PK
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Priya Kapoor</h4>
                  <p class="text-sm text-gray-600">Café Owner, Mumbai</p>
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
                  AM
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Amit Mehta</h4>
                  <p class="text-sm text-gray-600">Distributor, Bangalore</p>
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
            <a href="#" class="bg-white text-brand-blue px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition inline-block">
              <i class="fas fa-download mr-2"></i>Download Investment Guide
            </a>
            <a href="tel:8006999805" class="bg-brand-red text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition inline-block">
              <i class="fas fa-phone mr-2"></i>Call: 800-699-9805
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
              <img src="/logo.svg" alt="London Slush" class="h-12 mb-4" />
              <p class="text-gray-400 text-sm">
                Premium beverage franchise opportunities across India. Build your profitable business with us.
              </p>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-4">Quick Links</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="/franchise" class="hover:text-white">Franchise</a></li>
                <li><a href="/retail" class="hover:text-white">Retail Partners</a></li>
                <li><a href="/distributor" class="hover:text-white">Distributors</a></li>
                <li><a href="#" class="hover:text-white">About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-lg mb-4">Support</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="#" class="hover:text-white">FAQs</a></li>
                <li><a href="#" class="hover:text-white">Partner Login</a></li>
                <li><a href="#" class="hover:text-white">Training</a></li>
                <li><a href="#" class="hover:text-white">Contact</a></li>
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
                <a href="#" class="text-gray-400 hover:text-white text-xl"><i class="fab fa-facebook"></i></a>
                <a href="#" class="text-gray-400 hover:text-white text-xl"><i class="fab fa-instagram"></i></a>
                <a href="#" class="text-gray-400 hover:text-white text-xl"><i class="fab fa-linkedin"></i></a>
                <a href="#" class="text-gray-400 hover:text-white text-xl"><i class="fab fa-youtube"></i></a>
              </div>
            </div>
          </div>
          <div class="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 London Slush. All rights reserved. | <a href="#" class="hover:text-white">Privacy Policy</a> | <a href="#" class="hover:text-white">Terms & Conditions</a></p>
          </div>
        </div>
      </footer>
    </>,
    { title: 'London Slush - Premium Franchise & Business Opportunities | Start Your Beverage Business' }
  )
})

// =============================================
// FRANCHISE FUNNEL - HIGH TICKET DECISION MAKERS
// =============================================
app.get('/franchise', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.svg" alt="London Slush" class="h-12 w-auto" />
          </a>
          <a href="tel:8006999805" class="bg-brand-red text-white px-6 py-3 rounded-full hover:bg-red-700 transition font-semibold">
            <i class="fas fa-phone mr-2"></i>800-699-9805
          </a>
        </div>
      </nav>

      {/* Hero - Outcome Driven */}
      <section class="gradient-bg text-white py-16 md:py-24">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <div class="inline-block bg-yellow-400 text-brand-blue px-4 py-2 rounded-full font-bold mb-6">
              <i class="fas fa-fire mr-2"></i>Most Popular Choice
            </div>
            <h1 class="text-4xl md:text-6xl font-bold mb-6">
              Start a Scalable <span class="text-yellow-300">Beverage Franchise</span> with Predictable Margins
            </h1>
            <p class="text-xl md:text-2xl text-blue-100 mb-8">
              Low-risk franchise model designed for entrepreneurs who want a proven path to profitability
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#franchise-form" class="bg-white text-brand-blue px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                Get Franchise Kit <i class="fas fa-arrow-down ml-2"></i>
              </a>
              <a href="https://wa.me/918006999805?text=I%27m%20interested%20in%20London%20Slush%20franchise" target="_blank" class="bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-600 transition shadow-xl">
                <i class="fab fa-whatsapp mr-2"></i>Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Transparency Block - CRO CRITICAL */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-5xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              <i class="fas fa-calculator text-brand-red mr-3"></i>
              The Numbers That Matter
            </h2>
            
            <div class="grid md:grid-cols-3 gap-8 mb-12">
              <div class="bg-blue-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-brand-blue mb-2">₹8L - ₹25L</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Total Investment</p>
                <p class="text-sm text-gray-600">Including machine, setup, initial inventory & branding</p>
              </div>
              
              <div class="bg-green-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-green-600 mb-2">60-70%</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Profit Margin</p>
                <p class="text-sm text-gray-600">Per cup sold - Industry-leading profitability</p>
              </div>
              
              <div class="bg-purple-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-purple-600 mb-2">12-18</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Months ROI</p>
                <p class="text-sm text-gray-600">Average payback period based on 150+ partners</p>
              </div>
            </div>

            {/* Revenue Scenarios */}
            <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12">
              <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">Monthly Revenue Scenarios</h3>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b-2 border-gray-300">
                      <th class="text-left py-4 px-4">Footfall Type</th>
                      <th class="text-right py-4 px-4">Cups/Day</th>
                      <th class="text-right py-4 px-4">Revenue/Month</th>
                      <th class="text-right py-4 px-4">Profit/Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-gray-200">
                      <td class="py-4 px-4 font-semibold">Low Footfall</td>
                      <td class="text-right py-4 px-4">50</td>
                      <td class="text-right py-4 px-4 font-semibold">₹60,000</td>
                      <td class="text-right py-4 px-4 text-green-600 font-bold">₹39,000</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-blue-50">
                      <td class="py-4 px-4 font-semibold">Average Footfall</td>
                      <td class="text-right py-4 px-4">100</td>
                      <td class="text-right py-4 px-4 font-semibold">₹1,20,000</td>
                      <td class="text-right py-4 px-4 text-green-600 font-bold">₹78,000</td>
                    </tr>
                    <tr class="bg-green-50">
                      <td class="py-4 px-4 font-semibold">High Footfall</td>
                      <td class="text-right py-4 px-4">200</td>
                      <td class="text-right py-4 px-4 font-semibold">₹2,40,000</td>
                      <td class="text-right py-4 px-4 text-green-600 font-bold">₹1,56,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-sm text-gray-600 mt-6 text-center">
                * Based on ₹40 avg selling price per cup. Actual results may vary based on location and operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Reversal Section */}
      <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              <i class="fas fa-shield-alt text-green-500 mr-3"></i>
              Why London Slush is Low-Risk
            </h2>
            
            <div class="grid md:grid-cols-2 gap-8">
              <div class="bg-white rounded-2xl p-8 shadow-lg">
                <div class="flex items-start space-x-4">
                  <div class="bg-green-100 p-4 rounded-full">
                    <i class="fas fa-undo text-green-600 text-2xl"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Refundable Security</h3>
                    <p class="text-gray-600">Your investment is protected. We return your security deposit as per agreement terms.</p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-8 shadow-lg">
                <div class="flex items-start space-x-4">
                  <div class="bg-blue-100 p-4 rounded-full">
                    <i class="fas fa-handshake text-brand-blue text-2xl"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">No Hidden Royalties</h3>
                    <p class="text-gray-600">Transparent pricing. No monthly royalty fees eating into your profits.</p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-8 shadow-lg">
                <div class="flex items-start space-x-4">
                  <div class="bg-purple-100 p-4 rounded-full">
                    <i class="fas fa-truck text-purple-600 text-2xl"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Central Supply Chain</h3>
                    <p class="text-gray-600">Consistent quality guaranteed through our centralized syrup distribution network.</p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-8 shadow-lg">
                <div class="flex items-start space-x-4">
                  <div class="bg-red-100 p-4 rounded-full">
                    <i class="fas fa-graduation-cap text-brand-red text-2xl"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Complete Training</h3>
                    <p class="text-gray-600">Full operational training and ongoing support. You're never alone in this journey.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              What's Included in Your Franchise
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              {[
                'London Slush branded machines (2-3 bowl system)',
                'Complete setup & installation support',
                'Exclusive territory rights in your area',
                'Full brand usage rights & marketing materials',
                'Initial syrup & supplies inventory',
                'Operations manual & SOPs',
                'Staff training (if required)',
                '24/7 technical support hotline',
                'Marketing campaign templates',
                'Social media content kit',
                'Ongoing business consultation',
                'Quality assurance support'
              ].map((item, index) => (
                <div class="flex items-start space-x-3" key={index}>
                  <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                  <span class="text-gray-700 text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Application Form - CRO OPTIMIZED */}
      <section id="franchise-form" class="py-20 gradient-bg">
        <div class="container mx-auto px-4">
          <div class="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div class="text-center mb-8">
              <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Apply for Franchise Partnership
              </h2>
              <p class="text-lg text-gray-600">
                Fill out the form below and our team will contact you within 24 hours
              </p>
            </div>

            <form action="/api/submit-franchise" method="POST" class="space-y-6">
              <div>
                <label class="block text-gray-700 font-semibold mb-2">Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                  placeholder="Enter your full name"
                />
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                  />
                </div>
                
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">WhatsApp Number</label>
                  <input 
                    type="tel" 
                    name="whatsapp" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                    placeholder="Optional"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                  placeholder="your@email.com"
                />
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">City *</label>
                  <input 
                    type="text" 
                    name="city" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                    placeholder="Your city"
                  />
                </div>
                
                <div>
                  <label class="block text-gray-700 font-semibold mb-2">State *</label>
                  <input 
                    type="text" 
                    name="state" 
                    required 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                    placeholder="Your state"
                  />
                </div>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Investment Range *</label>
                <select 
                  name="investment_range" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                >
                  <option value="">Select investment capacity</option>
                  <option value="8L-12L">₹8L - ₹12L</option>
                  <option value="12L-18L">₹12L - ₹18L</option>
                  <option value="18L-25L">₹18L - ₹25L</option>
                  <option value="25L+">₹25L+</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">When do you plan to start? *</label>
                <select 
                  name="timeline" 
                  required 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                >
                  <option value="">Select timeline</option>
                  <option value="0-30">Within 1 month</option>
                  <option value="30-60">1-2 months</option>
                  <option value="60-90">2-3 months</option>
                  <option value="90+">3+ months</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Current Business (if any)</label>
                <input 
                  type="text" 
                  name="current_business" 
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                  placeholder="E.g., Restaurant, Café, Retail store"
                />
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Business Experience (years)</label>
                <input 
                  type="number" 
                  name="experience_years" 
                  min="0" 
                  max="50"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                  placeholder="Years in business"
                />
              </div>

              <div>
                <label class="block text-gray-700 font-semibold mb-2">Additional Notes</label>
                <textarea 
                  name="notes" 
                  rows="3"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-blue focus:outline-none transition"
                  placeholder="Any questions or specific requirements?"
                ></textarea>
              </div>

              <input type="hidden" name="business_type" value="franchise" />
              <input type="hidden" name="source_page" value="/franchise" />

              <button 
                type="submit" 
                class="w-full bg-brand-red text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-xl"
              >
                <i class="fas fa-paper-plane mr-2"></i>
                Submit Application
              </button>

              <p class="text-sm text-gray-600 text-center">
                By submitting, you agree to be contacted by London Slush team via phone, email, or WhatsApp
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
    { title: 'London Slush Franchise - Start Your Own Beverage Business | ₹8L-₹25L Investment' }
  )
})

// =============================================
// RETAIL/CAFÉ FUNNEL - MEDIUM TICKET VOLUME BUYERS
// =============================================
app.get('/retail', (c) => {
  return c.render(
    <>
      {/* Navigation */}
      <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.svg" alt="London Slush" class="h-12 w-auto" />
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

      {/* ROI Calculator Section */}
      <section class="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
              <i class="fas fa-calculator text-purple-600 mr-3"></i>
              Your Revenue Projection
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
      <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="flex items-center space-x-2">
            <img src="/logo.svg" alt="London Slush" class="h-12 w-auto" />
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
              Scale Across <span class="text-yellow-300">Multiple Cities</span> as an Exclusive Distributor
            </h1>
            <p class="text-xl md:text-2xl mb-8 opacity-90">
              Territory-based distribution rights with volume-based margins and expansion support
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
                <div class="text-5xl font-bold text-green-600 mb-2">₹50L+</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Investment Range</p>
                <p class="text-sm text-gray-600">For serious investors ready to scale</p>
              </div>
              
              <div class="bg-blue-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-blue-600 mb-2">20-30%</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Distribution Margin</p>
                <p class="text-sm text-gray-600">On every machine & syrup supply</p>
              </div>
              
              <div class="bg-purple-50 rounded-2xl p-8 text-center">
                <div class="text-5xl font-bold text-purple-600 mb-2">5-10</div>
                <p class="text-lg font-semibold text-gray-800 mb-2">Cities per Territory</p>
                <p class="text-sm text-gray-600">Exclusive rights in your region</p>
              </div>
            </div>

            <div class="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-12">
              <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">Distributor Business Model</h3>
              <div class="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 class="font-bold text-lg text-gray-800 mb-4">Revenue Streams</h4>
                  <ul class="space-y-3">
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Machine Sales Margin</p>
                        <p class="text-sm text-gray-600">₹50,000 - ₹1,00,000 per machine</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Recurring Syrup Supply</p>
                        <p class="text-sm text-gray-600">15-20% margin on monthly orders</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Franchise Referral Fees</p>
                        <p class="text-sm text-gray-600">Commission on franchisee onboarding</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-check-circle text-green-500 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">AMC Contracts</p>
                        <p class="text-sm text-gray-600">Annual maintenance revenue</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-bold text-lg text-gray-800 mb-4">What You Get</h4>
                  <ul class="space-y-3">
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-map-marked-alt text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Exclusive Territory Rights</p>
                        <p class="text-sm text-gray-600">Protected region with no competition</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-truck text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Inventory on Credit</p>
                        <p class="text-sm text-gray-600">30-day payment terms for syrup orders</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-users text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Lead Generation Support</p>
                        <p class="text-sm text-gray-600">National marketing drives local leads</p>
                      </div>
                    </li>
                    <li class="flex items-start space-x-3">
                      <i class="fas fa-tools text-blue-600 text-xl mt-1"></i>
                      <div>
                        <p class="font-semibold">Technical Training</p>
                        <p class="text-sm text-gray-600">Become certified installation expert</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
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
                { icon: 'money-bill-wave', title: 'Financial Strength', desc: '₹50L+ investment capacity for inventory and setup' },
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
    { title: 'London Slush Distributor - Exclusive Territory Rights | ₹50L+ Partnership' }
  )
})

export default app
