# Walk Don't Run (NUS Orbital 2026)

A mobile-first social running app built with React Native, Expo, and Firebase.

## Tech Stack
- React Native + Expo (SDK 54)
- Firebase (Auth, Firestore, Storage)
- Jest (testing)
- Victory Native (data visualisation)

## Prerequisites
- Node.js (v24 LTS)
- Expo Go app on your phone

## Setup
1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in Firebase credentials
4. Run `npx expo start`
5. Scan the QR code with Expo Go

## Branching Strategy
- `main` — stable releases only
- `dev` — integration branch
- `feature/*` — all new work (e.g. feature/login-screen)
- Never commit directly to main or dev

## App Preview Instructions
### Android (Recommended):
1. Download the APK file: https://expo.dev/artifacts/eas/sL8J94EV1SHsLjBNhGmk69.apk 
2. Transfer the file to your Android phone (via cable, Google Drive, Telegram, etc.)
3. On your Android phone, go to Settings → Apps → Special app access → Install unknown apps
4. Allow your browser or file manager to install unknown apps
5. Open the downloaded .apk file and tap Install
6. Open Walk Don't Run from your app drawer

### macOS (Android Emulator):
1. Download the APK: https://expo.dev/artifacts/eas/sL8J94EV1SHsLjBNhGmk69.apk 
2. Download and install Android Studio — choose the Apple Silicon version for M1/M2/M3/M4 Macs, or Intel version for older Macs
3. Open Android Studio → click More Actions → Virtual Device Manager
4. Click Create Device → select Pixel 9 Pro (or any Pixel) → select the latest API system image → click Finish
5. Click the ▶ Play button next to your device to launch the emulator and wait for it to fully boot
6. Drag and drop the downloaded .apk file onto the emulator window — it will install automatically

### Windows (Android Emulator):
1. Download the APK: https://expo.dev/artifacts/eas/sL8J94EV1SHsLjBNhGmk69.apk 
2. Download and install Android Studio for Windows
3. During setup, ensure Android Virtual Device is checked in the installation components screen
4. Open Android Studio → click More Actions → Virtual Device Manager
5. Click Create Device → select Pixel 9 Pro (or any Pixel) → select the latest API system image → click Finish
6. Click the ▶ Play button to launch the emulator and wait for it to fully boot
7. Drag and drop the downloaded .apk file onto the emulator window — it will install automatically

### Linux (Android Emulator):
1. Download the APK: https://expo.dev/artifacts/eas/sL8J94EV1SHsLjBNhGmk69.apk 
2. Download Android Studio for Linux and extract it
3. Run ./studio.sh from the extracted folder to launch Android Studio
4. Follow the Setup Wizard to install the Android SDK
5. Open Virtual Device Manager → Create Device → select Pixel 9 Pro (or any Pixel) → select the latest API system image → click Finish
6. Launch the emulator by clicking the ▶ Play button and wait for it to fully boot
7. Open a terminal and run: ~/Android/Sdk/platform-tools/adb install /path/to/Walk-Dont-Run-M1.apk
8. Swipe up from the bottom of the emulator to open the app drawer and tap Walk Don’t Run
