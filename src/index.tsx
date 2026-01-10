import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Use renderer middleware
app.use(renderer)

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
            <a href="tel:+919999999999" class="bg-brand-red text-white px-6 py-2 rounded-full hover:bg-red-700 transition font-semibold">
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
            <a href="tel:+919999999999" class="bg-brand-red text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition inline-block">
              <i class="fas fa-phone mr-2"></i>Call: +91 99999 99999
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
                <li><i class="fas fa-phone mr-2"></i>+91 99999 99999</li>
                <li><i class="fas fa-envelope mr-2"></i>partner@londonslush.com</li>
                <li><i class="fas fa-map-marker-alt mr-2"></i>Pan India Coverage</li>
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

export default app
