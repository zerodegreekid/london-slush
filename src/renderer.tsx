import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'London Slush | Premium Frozen Beverage Franchise India | 60-70% Margins'}</title>
        <meta name="description" content="Start a profitable beverage business with London Slush. ₹0-₹15L investment, 60-70% margins, refundable security, 150+ partners across India. Retail & distributor opportunities available." />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/logo-circle.png" />
        <link rel="apple-touch-icon" href="/logo-circle.png" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title || 'London Slush | Premium Frozen Beverage Franchise India'} />
        <meta property="og:description" content="Join 150+ profitable partners. ₹0-₹15L investment, 60-70% margins, complete support. Retail & distributor opportunities across India." />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title || 'London Slush | Premium Frozen Beverage Franchise India'} />
        <meta name="twitter:description" content="Join 150+ profitable partners. Start your profitable beverage business today." />
        <meta name="twitter:image" content="/logo.png" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="frozen beverage franchise, slush franchise India, beverage business, retail partnership, distributor opportunity, profitable franchise, London Slush" />
        <meta name="author" content="Dravya Roots Pvt Ltd" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://londonslush.com/" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Tailwind Config */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'brand-blue': '#003d7a',
                    'brand-red': '#dc1f26',
                    'brand-light-blue': '#00a8e8',
                  },
                  fontFamily: {
                    'sans': ['Poppins', 'sans-serif'],
                  }
                }
              }
            }
          `
        }} />
        
        {/* Custom Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Poppins', sans-serif;
              overflow-x: hidden;
            }
            
            .gradient-bg {
              background: linear-gradient(135deg, #003d7a 0%, #00a8e8 100%);
            }
            
            .card-hover {
              transition: all 0.3s ease;
            }
            
            .card-hover:hover {
              transform: translateY(-8px);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }
            
            .btn-primary {
              background: linear-gradient(135deg, #dc1f26 0%, #ff4444 100%);
              transition: all 0.3s ease;
            }
            
            .btn-primary:hover {
              transform: scale(1.05);
              box-shadow: 0 10px 30px rgba(220, 31, 38, 0.4);
            }
            
            .pulse-animation {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: .7;
              }
            }
            
            /* Video Hero Animations */
            .animate-fade-in {
              animation: fadeIn 1.5s ease-out;
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            /* Products Page Animations */
            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
            
            @keyframes float {
              0%, 100% {
                transform: translateY(0px) rotate(0deg);
              }
              50% {
                transform: translateY(-20px) rotate(5deg);
              }
            }
            
            .animate-bounce-subtle {
              animation: bounceSubtle 2s ease-in-out infinite;
            }
            
            @keyframes bounceSubtle {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-10px);
              }
            }
            
            .animate-spin-slow {
              animation: spinSlow 8s linear infinite;
            }
            
            @keyframes spinSlow {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            
            /* Shadow Utilities */
            .shadow-3xl {
              box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
            }
            
            /* Reduced Motion Support */
            @media (prefers-reduced-motion: reduce) {
              .animate-fade-in,
              .animate-bounce,
              .animate-float,
              .animate-bounce-subtle,
              .animate-spin-slow {
                animation: none;
              }
              
              video {
                display: none;
              }
            }
            
            /* Video Performance Optimization */
            video {
              will-change: auto;
              transform: translateZ(0);
              -webkit-transform: translateZ(0);
            }
            
            .sticky-cta {
              position: fixed;
              bottom: 20px;
              right: 20px;
              z-index: 1000;
            }
            
            @media (max-width: 768px) {
              .sticky-cta {
                bottom: 10px;
                right: 10px;
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50">
        {children}
        
        {/* WhatsApp Floating Button */}
        <a href="https://wa.me/918006999805?text=Hi%2C%20I%27m%20interested%20in%20London%20Slush%20partnership" 
           target="_blank"
           class="sticky-cta bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center w-16 h-16">
          <i class="fab fa-whatsapp text-3xl"></i>
        </a>
      </body>
    </html>
  )
})
