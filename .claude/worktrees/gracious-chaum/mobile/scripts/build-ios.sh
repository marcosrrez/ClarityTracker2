#!/bin/bash

# ClarityLog iOS Build Script
echo "🚀 Building ClarityLog for iOS App Store..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd ios
xcodebuild clean -workspace ClarityLogMobile.xcworkspace -scheme ClarityLogMobile
cd ..

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd ios && pod install && cd ..

# Build for release
echo "🔨 Building release version..."
cd ios
xcodebuild archive \
  -workspace ClarityLogMobile.xcworkspace \
  -scheme ClarityLogMobile \
  -configuration Release \
  -archivePath ./build/ClarityLogMobile.xcarchive \
  -allowProvisioningUpdates

# Export for App Store
echo "📤 Exporting for App Store..."
xcodebuild -exportArchive \
  -archivePath ./build/ClarityLogMobile.xcarchive \
  -exportPath ./build/ \
  -exportOptionsPlist exportOptions.plist

echo "✅ iOS build complete! Check ios/build/ directory for .ipa file"
echo "📱 Ready to upload to App Store Connect!"