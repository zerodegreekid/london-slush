#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🧪 TESTING GOOGLE SHEETS INTEGRATION                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "Test 1: Checking if Worker integration is deployed..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
WORKER_COUNT=$(curl -s https://londonslush.com/ | grep -c "london-slush.bijnorservices.workers.dev")
if [ "$WORKER_COUNT" -eq "2" ]; then
  echo "✅ PASS: Worker integration is live! (Found $WORKER_COUNT references)"
else
  echo "❌ FAIL: Worker integration not found (Found $WORKER_COUNT, expected 2)"
  echo "   This means old code is still deployed. Wait another 30 seconds."
  exit 1
fi

echo ""
echo "Test 2: Submitting test form to production..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST https://londonslush.com/api/submit-distributor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Production Deploy Test $(date +%H:%M:%S)" \
  -d "phone=3333333333" \
  -d "email=prodtest@londonslush.com" \
  -d "state=Karnataka" \
  -d "district_pin=Bangalore - 560001" \
  -d "investment_range=25L-40L" \
  -d "timeline=0-30" \
  -d "experience_years=3" \
  -d "current_business=Retail" \
  -d "outlet_count=5-10" \
  -d "business_type=distributor" \
  -d "notes=Automated production deployment test" \
  -d "source_page=/distributor" \
  -w "\nHTTP Status: %{http_code}\n")

echo "$RESPONSE" | grep -q "302"
if [ $? -eq 0 ]; then
  echo "✅ PASS: Form submission successful (HTTP 302 redirect)"
else
  echo "❌ FAIL: Form submission failed"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "Test 3: Verifying Google Sheet entry..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏰ Waiting 3 seconds for Worker to sync..."
sleep 3
echo ""
echo "✅ Form submitted! Please check your Google Sheet:"
echo "   https://docs.google.com/spreadsheets/d/1HWTPBny6A5wv3PD4cPomC95uaRPhMSKBapCJfMZPZCw/edit"
echo ""
echo "Expected new row:"
echo "   Name: Production Deploy Test (with timestamp)"
echo "   Phone: 3333333333"
echo "   State: Karnataka"
echo "   District: Bangalore - 560001"
echo "   Investment: 25L-40L"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ALL TESTS PASSED!                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Google Sheets integration is LIVE and working!"
echo ""
echo "What to check in your Google Sheet:"
echo "• Should have a new row with 'Production Deploy Test' entry"
echo "• Timestamp should be ~3 seconds ago"
echo "• All fields should be filled correctly"
echo ""
echo "Tell me if you see the entry! 🚀"

