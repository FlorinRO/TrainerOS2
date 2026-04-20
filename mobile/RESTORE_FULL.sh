#!/bin/bash

echo "🔄 Restoring full version..."

if [ -f "App.full.tsx" ]; then
    cp App.full.tsx App.tsx
    echo "✅ Restored full App.tsx"
    rm App.full.tsx
else
    echo "❌ No backup found"
fi

echo ""
echo "Full app restored. Run: npx expo start --clear"
