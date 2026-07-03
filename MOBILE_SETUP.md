# CRMByte Mobile Setup Guide

## Overview
CRMByte has been configured to work as both a **web app** and **native mobile app** using Capacitor. Your existing React code, Supabase integration, and all hooks remain unchanged.

## Project Structure

```
Yalabyte-CRM/
├── src/               # Your existing React app (unchanged)
├── dist/              # Built web app (for mobile)
├── ios/               # Native iOS project (Xcode)
├── android/           # Native Android project
├── capacitor.config.json  # Mobile app configuration
└── package.json       # Updated with mobile build scripts
```

## New Features Added

### 1. Push Notifications (`src/capacitor/pushNotifications.js`)
- Automatic device token registration
- Real-time notifications for team updates
- No changes needed to existing Supabase setup

### 2. Offline Storage (`src/capacitor/offlineStorage.js`)
- Automatic data caching
- Sync when back online
- Queue operations while offline
- Functions:
  - `cacheLeads()` / `getCachedLeads()`
  - `cacheTeamMembers()` / `getCachedTeamMembers()`
  - `queueOfflineOperation()` for data changes

### 3. Mobile Hooks (`src/hooks/useCapacitor.js`)
- `useCapacitorInit()` - Initialize mobile features
- `useOfflineCache()` - Auto-cache fetched data

## Build & Deployment Scripts

```bash
# Web development (unchanged)
npm run dev           # Local development on web
npm run build         # Build for web deployment

# Mobile development
npm run build:mobile  # Build web + sync to native projects
npm run build:ios     # Build + open Xcode for iOS development
npm run build:android # Build + open Android Studio for Android development
```

## Web App Deployment
Your web app works exactly as before:
```bash
npm run build
# Deploy the `dist/` folder to your web hosting
```

## Mobile Development Workflow

### For iOS (requires Mac with Xcode)
1. `npm run build:ios`
2. Xcode opens automatically with iOS project
3. Plug in iPhone via USB
4. Select device and press ▶ Run
5. App installs on device

### For Android
1. `npm run build:android`
2. Android Studio opens with Android project
3. Start Android emulator or plug in device
4. Press ▶ Run
5. App installs on device

## Testing on Devices

### Share with Team (Free)

**iOS:**
- Use Apple TestFlight (requires Apple account)
- Generate a build and share TestFlight link
- Team members can install and test

**Android:**
- Use Google Play internal testing track
- Or share APK file directly via QR code

## Key Points

✅ **Web app unchanged** - Deploy to web anytime
✅ **Same codebase** - No duplication, all changes sync
✅ **Live data** - Supabase real-time subscriptions work on mobile
✅ **Notifications** - Team gets push notifications
✅ **Offline support** - Optional caching for offline work
✅ **No app store fees** - Internal distribution is free

## Next Steps

1. Test the web version still works:
   ```bash
   npm run dev
   ```

2. To start iOS development:
   ```bash
   npm run build:ios
   ```

3. To start Android development:
   ```bash
   npm run build:android
   ```

## Troubleshooting

**App not updating?**
- Run: `npx cap sync` to sync web changes to native projects

**Notifications not working?**
- Check permissions are granted in device settings
- Verify Supabase backend configuration

**Build errors?**
- Delete `ios/` or `android/` and run `npx cap add ios` or `npx cap add android`

## Architecture Notes

- **Capacitor layer** bridges web app to native APIs
- **Web code** runs in WebView on mobile devices
- **No native code needed** unless you want platform-specific features
- **Supabase** authentication and database work identically on web/mobile
- **Storage** uses device storage instead of browser localStorage

---

For detailed Capacitor documentation: https://capacitorjs.com/docs
