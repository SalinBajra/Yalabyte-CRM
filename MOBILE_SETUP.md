# CRMByte Mobile Setup Guide

## Overview
CRMByte is configured to work as both a **web app** and **native mobile app** using Capacitor. The native shell reuses the existing React CRM, Supabase authentication, and realtime database integration.

## Project Structure

```
Yalabyte-CRM/
├── src/               # React CRM app
├── dist/              # Built web app (for mobile)
├── ios/               # Native iOS project (Xcode)
├── android/           # Native Android project
├── capacitor.config.json  # Mobile app configuration
└── package.json       # Updated with mobile build scripts
```

## New Features Added

### 1. Push Notification Readiness (`src/capacitor/pushNotifications.js`)
- Requests native notification permission on iOS/Android
- Registers the device with the native push system
- Stores device tokens in Supabase `device_tokens`
- Requires the `202607040001_mobile_device_tokens.sql` migration
- Still needs FCM/APNs credentials and a server-side sender before notifications can be delivered

### 2. Offline Storage (`src/capacitor/offlineStorage.js`)
- Caches leads and team members on device with Capacitor Preferences
- Falls back to cached leads/team members when Supabase is unavailable on mobile
- Queue helpers exist for future offline writes, but write replay is not enabled yet
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
✅ **Notification tokens** - Mobile devices register tokens in Supabase
✅ **Offline viewing** - Cached leads/team members load when the mobile app is offline
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

**Notifications not arriving?**
- Check permissions are granted in device settings
- Run the `device_tokens` Supabase migration
- Configure Firebase Cloud Messaging for Android
- Configure Apple Push Notification service and Push Notifications capability for iOS
- Add a server-side sender that reads `device_tokens` and sends messages through FCM/APNs

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
