#!/bin/bash

# ClarityLog Android Build Script
echo "🚀 Building ClarityLog for Google Play Store..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate release build
echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease

# Generate App Bundle (recommended for Play Store)
echo "📦 Building release App Bundle..."
./gradlew bundleRelease

echo "✅ Android build complete!"
echo "📱 APK location: android/app/build/outputs/apk/release/"
echo "📦 App Bundle location: android/app/build/outputs/bundle/release/"
echo "🚀 Ready to upload to Google Play Console!"