import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'London Slush - Premium Franchise & Business Opportunities'}</title>
        <meta name="description" content="Start a profitable beverage business with London Slush. Franchise opportunities, retail partnerships, and distributor programs across India. Low-risk, high-margin model." />
        
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
            
            /* Reduced Motion Support */
            @media (prefers-reduced-motion: reduce) {
              .animate-fade-in,
              .animate-bounce {
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
