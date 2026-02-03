#!/bin/bash
echo "=== MANUAL DEPLOYMENT TO CLOUDFLARE PAGES ==="
echo ""
echo "Checking Cloudflare authentication..."
npx wrangler whoami 2>&1 | head -5

echo ""
echo "Building project..."
npm run build

echo ""
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=london-slush --branch=main
