# 🎯 Step-by-Step Mobile App Setup Guide

Let's get your ClarityLog mobile app ready for testing and deployment!

## Step 1: Install Required Development Tools

### For Mac Users (iOS + Android):

1. **Install Xcode** (Required for iOS)
   - Open Mac App Store
   - Search "Xcode" and install (this takes a while - it's ~15GB)
   - Once installed, open Xcode and accept license agreements

2. **Install Android Studio** (Required for Android)
   - Go to https://developer.android.com/studio
   - Download Android Studio
   - Install and open it
   - Follow the setup wizard to install Android SDK

3. **Install Node.js** (if not already installed)
   - Go to https://nodejs.org
   - Download LTS version
   - Install and verify: `node --version`

### For Windows/Linux Users (Android only):

1. **Install Android Studio** (same as above)
2. **Install Node.js** (same as above)
3. **Note**: iOS development requires macOS

## Step 2: Set Up React Native CLI

Open Terminal/Command Prompt and run:

```bash
# Install React Native CLI globally
npm install -g @react-native-community/cli

# Verify installation
npx react-native --version
```

## Step 3: Configure Your Mobile Project

Navigate to your mobile directory:

```bash
cd mobile
```

Install all dependencies:

```bash
npm install
```

For iOS (Mac only):
```bash
cd ios
pod install
cd ..
```

## Step 4: Test on Device Simulators

### Test iOS Simulator (Mac only):

```bash
npm run ios
```

This should:
- Start Metro bundler
- Open iOS Simulator
- Install and launch ClarityLog app

### Test Android Emulator:

First, create an Android Virtual Device:
1. Open Android Studio
2. Click "AVD Manager" 
3. Create Virtual Device → Phone → Pixel 6
4. Download a system image (API 33+)
5. Finish setup

Then run:
```bash
npm run android
```

## Step 5: Connect Real Devices (Recommended)

### iOS Device Setup:
1. Connect iPhone via USB
2. Open Xcode
3. Window → Devices and Simulators
4. Trust computer on iPhone
5. Run: `npm run ios --device`

### Android Device Setup:
1. Enable Developer Options on Android:
   - Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect via USB and allow debugging
4. Run: `npm run android`

## What You Should See:

When the app launches successfully, you'll see:
- 🏠 **Dashboard** with progress visualization
- ➕ **Add Entry** tab for logging hours
- 🧠 **Insights** tab for AI analysis
- ⚙️ **Settings** tab for preferences

## Troubleshooting Common Issues:

**Metro bundler won't start:**
```bash
npx react-native start --reset-cache
```

**iOS build fails:**
```bash
cd ios && pod install && cd ..
```

**Android build fails:**
```bash
cd android && ./gradlew clean && cd ..
```

## Next Steps:

Once you can run the app on simulators/devices:
1. ✅ Test voice-to-text functionality
2. ✅ Verify navigation between screens
3. ✅ Test with your ClarityLog backend
4. ✅ Ready for app store preparation!