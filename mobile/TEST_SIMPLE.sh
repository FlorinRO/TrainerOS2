#!/bin/bash

echo "🧪 Testing with SIMPLE version first..."
echo ""

# Backup current App.tsx
cp App.tsx App.full.tsx
echo "✅ Backed up full App.tsx to App.full.tsx"

# Use simple version
cp App.simple.tsx App.tsx
echo "✅ Using simple test version"

# Clean
rm -rf .expo node_modules/.cache
echo "✅ Cleaned caches"

echo ""
echo "🚀 Starting simple test..."
echo "If this works, we know the setup is correct!"
echo ""

npx expo start --clear --port 8082
