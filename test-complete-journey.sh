#!/bin/bash

echo "==================================="
echo "LONDON SLUSH - COMPLETE JOURNEY TEST"
echo "==================================="
echo ""

BASE_URL="http://localhost:3000"

echo "✓ Testing Homepage..."
STATUS_HOME=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
echo "  Homepage: $STATUS_HOME"

echo ""
echo "✓ Testing Franchise Funnel..."
STATUS_FRANCHISE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/franchise)
echo "  Franchise Page: $STATUS_FRANCHISE"

echo ""
echo "✓ Testing Retail Funnel..."
STATUS_RETAIL=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/retail)
echo "  Retail Page: $STATUS_RETAIL"

echo ""
echo "✓ Testing Distributor Funnel..."
STATUS_DISTRIBUTOR=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/distributor)
echo "  Distributor Page: $STATUS_DISTRIBUTOR"

echo ""
echo "✓ Testing Thank You Page..."
STATUS_THANKS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/thank-you?type=franchise&name=Test")
echo "  Thank You Page: $STATUS_THANKS"

echo ""
echo "✓ Testing Static Assets..."
STATUS_LOGO=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/logo.svg)
echo "  Logo SVG: $STATUS_LOGO"
STATUS_IMG=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/slush-blue-drinks.jpg)
echo "  Product Image: $STATUS_IMG"

echo ""
echo "==================================="
echo "TEST SUMMARY"
echo "==================================="
if [ "$STATUS_HOME" = "200" ] && [ "$STATUS_FRANCHISE" = "200" ] && [ "$STATUS_RETAIL" = "200" ] && [ "$STATUS_DISTRIBUTOR" = "200" ] && [ "$STATUS_THANKS" = "200" ]; then
    echo "✅ ALL TESTS PASSED!"
    echo ""
    echo "🎉 London Slush CRO Platform is READY!"
    echo ""
    echo "📊 Available Pages:"
    echo "   • Homepage: $BASE_URL"
    echo "   • Franchise: $BASE_URL/franchise"
    echo "   • Retail: $BASE_URL/retail"
    echo "   • Distributor: $BASE_URL/distributor"
    echo "   • Thank You: $BASE_URL/thank-you"
else
    echo "❌ SOME TESTS FAILED - Check logs"
fi
echo "==================================="
