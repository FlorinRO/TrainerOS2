#!/bin/bash

# Fix all style type issues in screens
for file in src/screens/*.tsx; do
  # Fix fontWeight
  sed -i '' "s/fontWeight: 'bold'/fontWeight: 'bold' as const/g" "$file"
  sed -i '' "s/fontWeight: '600'/fontWeight: '600' as const/g" "$file"
  sed -i '' "s/fontWeight: '700'/fontWeight: '700' as const/g" "$file"
  
  # Fix alignment
  sed -i '' "s/alignItems: 'center'/alignItems: 'center' as const/g" "$file"
  sed -i '' "s/justifyContent: 'center'/justifyContent: 'center' as const/g" "$file"
  sed -i '' "s/textAlign: 'center'/textAlign: 'center' as const/g" "$file"
  sed -i '' "s/flexDirection: 'row'/flexDirection: 'row' as const/g" "$file"
done

echo "✅ Fixed all style type issues"
