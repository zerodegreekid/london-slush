#!/bin/bash

echo "📦 Preparing London Slush for Cloudflare Pages Upload..."
echo ""

# Create a clean deployment package
cd /home/user/webapp

# Verify dist exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found!"
    echo "Run: npm run build"
    exit 1
fi

# Create a timestamped archive
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="london-slush-deploy-${TIMESTAMP}.zip"

echo "Creating archive: ${ARCHIVE_NAME}"
cd dist
zip -r ../${ARCHIVE_NAME} . -x "*.DS_Store" "*.git*"
cd ..

echo ""
echo "✅ Deployment package ready!"
echo ""
echo "📦 Archive: /home/user/webapp/${ARCHIVE_NAME}"
echo "📏 Size: $(du -h ${ARCHIVE_NAME} | cut -f1)"
echo ""
echo "📋 Contents:"
ls -lh dist/ | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "🚀 Next Steps:"
echo "1. Download this file to your computer"
echo "2. Go to https://dash.cloudflare.com/"
echo "3. Workers & Pages → Create application → Pages → Upload assets"
echo "4. Upload the contents of the 'dist' folder (not the zip)"
echo ""
