# ClarityLog Mobile App

The comprehensive mobile companion for Licensed Associate Counselors tracking their path to LPC licensure.

## 🚀 Features

- **Smart Hour Logging** with voice-to-text capability
- **AI-Powered Insights** from session notes
- **Milestone Celebrations** with push notifications
- **Progress Tracking** toward licensure goals
- **Offline Note-Taking** for session documentation
- **Swipeable Insight Cards** with gesture controls

## 📱 Setup Instructions

### Prerequisites

1. **React Native Development Environment**
   ```bash
   npm install -g @react-native-community/cli
   ```

2. **iOS Development** (Mac required)
   - Xcode 14+ from App Store
   - iOS Simulator or physical device

3. **Android Development**
   - Android Studio with SDK 33+
   - Android Emulator or physical device

### Installation

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure Environment**
   Create `.env` file in mobile directory:
   ```
   API_URL=https://your-claritylog-domain.com
   ```

### Firebase Configuration

1. **iOS Configuration**
   - Download `GoogleService-Info.plist` from Firebase Console
   - Add to `ios/ClarityLogMobile/` directory
   - Add to Xcode project

2. **Android Configuration**
   - Download `google-services.json` from Firebase Console
   - Add to `android/app/` directory

### Running the App

**iOS**
```bash
npm run ios
```

**Android**
```bash
npm run android
```

## 🏗️ Build for Production

### iOS App Store

1. **Configure Xcode Project**
   ```bash
   open ios/ClarityLogMobile.xcworkspace
   ```

2. **Update Bundle Identifier**
   - Set to `com.claritylog.mobile`
   - Configure signing certificates

3. **Build Archive**
   - Product → Archive in Xcode
   - Upload to App Store Connect

### Android Google Play

1. **Generate Signed APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Upload to Google Play Console**
   - Create new app listing
   - Upload APK from `android/app/build/outputs/apk/release/`

## 📋 App Store Listing

### App Name
**ClarityLog - LPC Hour Tracker**

### Description
```
Transform your path to Licensed Professional Counselor (LPC) licensure with ClarityLog Mobile - the intelligent companion for Licensed Associate Counselors.

🎯 SMART HOUR TRACKING
• Voice-to-text session logging for hands-free entry
• Quick hour selection with one-tap shortcuts
• Automatic milestone celebrations at key achievements
• Weekly and daily progress tracking

🧠 AI-POWERED INSIGHTS
• Intelligent analysis of your session notes
• Pattern recognition across multiple sessions
• Personalized growth recommendations
• Reflective prompts for professional development

📱 MOBILE-OPTIMIZED FEATURES
• Offline note-taking capability
• Push notifications for goals and milestones
• Swipeable insight cards with smooth animations
• Dark mode support

🏆 MILESTONE CELEBRATIONS
• Achievements at 25, 50, 100, 250, 500+ hours
• Streak tracking for consistent logging
• Motivational messages and reminders
• Progress visualization toward LPC goal

Perfect for LACs in supervision working toward their 4,000-hour licensure requirement. Sync seamlessly with the ClarityLog web platform for comprehensive progress tracking.

Privacy-focused with secure Firebase authentication and encrypted data storage.
```

### Keywords
```
LPC, Licensed Professional Counselor, LAC, supervision hours, therapy, counseling, licensure, clinical hours, mental health, professional development
```

### Screenshots Needed
1. Dashboard with progress visualization
2. Add Entry screen with voice input
3. AI Insights with swipeable cards
4. Settings and goal management
5. Milestone celebration notification

## 🔧 Configuration Files

### iOS Info.plist Additions
```xml
<key>NSMicrophoneUsageDescription</key>
<string>ClarityLog uses the microphone for voice-to-text session note entry</string>
<key>NSCameraUsageDescription</key>
<string>ClarityLog may use the camera for future features</string>
```

### Android Permissions
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
```

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] Test on iOS and Android devices
- [ ] Verify Firebase authentication
- [ ] Test voice-to-text functionality
- [ ] Confirm push notifications work
- [ ] Test offline capability
- [ ] Verify API connectivity to backend

### App Store Submission
- [ ] Complete app metadata
- [ ] Upload app screenshots
- [ ] Set pricing (Free recommended)
- [ ] Configure in-app privacy details
- [ ] Submit for review

### Post-Launch
- [ ] Monitor app analytics
- [ ] Track user feedback
- [ ] Plan feature updates
- [ ] Monitor crash reports

## 📊 Analytics Integration

The app automatically tracks:
- Session logging frequency
- AI insights usage
- Feature adoption rates
- User engagement patterns

Data flows to your existing ClarityLog analytics dashboard for comprehensive user behavior insights.

## 🔒 Security & Privacy

- End-to-end encryption for sensitive data
- Firebase security rules implementation
- Local data encryption on device
- HIPAA-compliant session note handling
- User consent for analytics tracking

## 🆕 Future Enhancements

**Planned Features:**
- Offline sync capability
- Apple Watch integration
- Calendar integration for supervision appointments
- Group supervision features
- Advanced analytics dashboard
- Supervisor collaboration tools

## 📞 Support

For technical support or feature requests:
- Email: support@claritylog.net
- Documentation: https://claritylog.net/help
- Web Platform: https://claritylog.net

---

**Built for Licensed Associate Counselors by ClarityLog**
*Empowering your journey to LPC licensure*