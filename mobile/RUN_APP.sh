#!/bin/bash

echo "🧹 Cleaning up..."
rm -rf .expo
rm -rf node_modules/.cache  
rm -rf .expo-shared
rm -rf android/.gradle 2>/dev/null
rm -rf ios/build 2>/dev/null

echo ""
echo "✅ Clean complete!"
echo ""
echo "🚀 Starting TrainerOS Mobile App..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Choose your testing method:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  w  → Web Browser (fastest, recommended)"
echo "  i  → iOS Simulator"
echo "  a  → Android Emulator"  
echo "  QR → Scan with Expo Go app on your phone"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start --clear --port 8082
