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