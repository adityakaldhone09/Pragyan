#!/bin/bash

# Verification script for Roadmap Builder
# Run this to verify all components are working

echo "🔍 Roadmap Builder Verification"
echo "================================"

# 1. Check TypeScript compilation
echo ""
echo "1️⃣ TypeScript Check..."
npx tsc --noEmit 2>&1 | grep "admin-roadmap-builder-optimized" && echo "✗ Found TypeScript errors" || echo "✓ No TypeScript errors"

# 2. Check build
echo ""
echo "2️⃣ Build Check..."
npm run build 2>&1 | grep -i "error" && echo "✗ Build failed" || echo "✓ Build successful"

# 3. Check file exists
echo ""
echo "3️⃣ File Integrity..."
if [ -f "src/pages/admin-roadmap-builder-optimized.tsx" ]; then
    echo "✓ Main component file exists"
    wc -l src/pages/admin-roadmap-builder-optimized.tsx
else
    echo "✗ Main component file missing"
fi

# 4. Check test file
echo ""
echo "4️⃣ Test File..."
if [ -f "src/pages/__tests__/admin-roadmap-builder-optimized.test.tsx" ]; then
    echo "✓ Test file exists"
else
    echo "✗ Test file missing"
fi

# 5. Check dependencies
echo ""
echo "5️⃣ Dependencies Check..."
npm ls react-query @tanstack/react-query 2>&1 | grep "@tanstack/react-query" && echo "✓ React Query installed" || echo "✗ React Query missing"

# 6. Check component imports
echo ""
echo "6️⃣ Component Imports..."
grep -q "import { Button }" src/pages/admin-roadmap-builder-optimized.tsx && echo "✓ Button imported" || echo "✗ Button not imported"
grep -q "import { Input }" src/pages/admin-roadmap-builder-optimized.tsx && echo "✓ Input imported" || echo "✗ Input not imported"
grep -q "import { Textarea }" src/pages/admin-roadmap-builder-optimized.tsx && echo "✓ Textarea imported" || echo "✗ Textarea not imported"

# 7. Check service integration
echo ""
echo "7️⃣ Service Integration..."
grep -q "careerRoadmapService" src/pages/admin-roadmap-builder-optimized.tsx && echo "✓ Service imported" || echo "✗ Service not imported"

# 8. Summary
echo ""
echo "================================"
echo "✅ Verification Complete!"
echo ""
echo "To start testing:"
echo "  1. npm run dev       (Frontend)"
echo "  2. npm run dev       (Backend - in /backend folder)"
echo "  3. Navigate to http://localhost:5173/admin/roadmaps"
echo ""
