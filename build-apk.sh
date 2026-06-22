#!/bin/bash

# MirrorTV Build Script
# Gera APK Debug facilmente

set -e

echo "🚀 MirrorTV APK Builder"
echo "========================"

# Check prerequisites
if ! command -v java &> /dev/null; then
    echo "❌ Java não encontrado. Instale Java JDK 17"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi

# Build steps
echo ""
echo "📦 Step 1: Building Next.js..."
npm run build

echo ""
echo "🔄 Step 2: Syncing Capacitor..."
npx cap sync

echo ""
echo "🤖 Step 3: Building Android APK..."
cd android
./gradlew assembleDebug

echo ""
echo "✅ Build Complete!"
echo ""
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "📱 APK: $APK_PATH"
    echo "📊 Size: $(du -h $APK_PATH | cut -f1)"
else
    echo "❌ APK not found"
    exit 1
fi

echo ""
echo "💡 Next steps:"
echo "  - Connect Android device: adb connect <device-ip>"
echo "  - Install APK: adb install $APK_PATH"
echo "  - Or upload to GitHub Releases"
