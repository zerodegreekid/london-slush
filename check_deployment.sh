#!/bin/bash
echo "=== DEPLOYMENT DIAGNOSTICS ==="
echo ""

# Check 1: Latest commit on GitHub
echo "1. Latest Git Commit (Local):"
git log --oneline -1

echo ""
echo "2. Latest Git Commit (GitHub):"
git ls-remote origin main | awk '{print substr($1,1,7)}'

echo ""
echo "3. Worker URL on Live Site:"
curl -s https://londonslush.com/ | grep -o "london-slush.bijnorservices.workers.dev" | head -2 || echo "NOT FOUND"

echo ""
echo "4. Email Function Check:"
curl -s https://londonslush.com/ | grep -o "sendEmailNotification" | head -1 || echo "NOT FOUND"

echo ""
echo "5. Test Worker Endpoint:"
curl -I https://london-slush.bijnorservices.workers.dev 2>&1 | head -1

echo ""
echo "6. Check _worker.js on production:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://londonslush.com/_worker.js
