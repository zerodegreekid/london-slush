#!/bin/bash

echo "=== TESTING LIVE DEPLOYMENT ==="
echo ""

# Test 1: Check Worker URL integration
echo "TEST 1: Worker URL Integration"
WORKER_COUNT=$(curl -s https://londonslush.com/ | grep -c "london-slush.bijnorservices.workers.dev")
echo "Worker URLs found: $WORKER_COUNT (expected: 2)"
echo ""

# Test 2: Check Worker endpoint health
echo "TEST 2: Worker Endpoint Health"
curl -I https://london-slush.bijnorservices.workers.dev 2>&1 | head -1
echo ""

# Test 3: Test distributor form endpoint
echo "TEST 3: Distributor Form API"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://londonslush.com/api/submit-distributor
echo ""

# Test 4: Check all 9 product images
echo "TEST 4: Product Images (9 images)"
for img in tangy-orange exotic-pineapple icy-cola sour-green-apple blue-berry simple-strawberry seven-rainbow awesome-mango power-blackberry; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://londonslush.com/${img}.jpg)
  echo "  $img.jpg: HTTP $STATUS"
done

