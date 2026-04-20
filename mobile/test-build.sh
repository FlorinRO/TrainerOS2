#!/bin/bash

echo "🧹 Cleaning caches..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf .expo-shared

echo "✅ Caches cleared"
echo ""
echo "🚀 Starting Expo development server..."
echo ""
echo "Choose your testing method:"
echo "  w - Web (fastest, test in browser)"
echo "  i - iOS Simulator"
echo "  a - Android Emulator"
echo "  QR - Scan QR code with Expo Go app"
echo ""

npx expo start --clear --port 8082
