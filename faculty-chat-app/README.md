# CRMS Faculty Chat App
> React Native (Expo) mobile app for CRMS faculty members to chat with campus administration.

## Prerequisites
- Node.js 18+
- Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- OR an Android/iOS simulator

## Quick Start

```bash
# Install dependencies (if not already done)
cd faculty-chat-app
npm install

# Start the Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** on your phone to launch the app.

## Configuration

Edit `src/config.ts` and set `API_BASE` to your server's local IP address:

```ts
// When testing on a real device (not an emulator)
export const API_BASE = "http://192.168.1.XX:5000"; // <- your server LAN IP
```

Find your LAN IP on Windows with: `ipconfig` → look for "IPv4 Address"

## Features
- 🔐 Faculty login with CRMS credentials
- 💬 Real-time chat with campus administration (polls every 3.5s)
- 📧 Admin messages are also sent via email automatically
- 🤖 CRMS AI messages are displayed with a distinct style
- 📅 Message history with date groupings
- 🌙 Premium dark UI with purple accent theme

## Project Structure
```
faculty-chat-app/
├── src/
│   ├── App.tsx              # Root navigator (login ↔ chat)
│   ├── config.ts            # API base URL
│   ├── api/
│   │   └── messages.ts      # Fetch / send / mark-read API calls
│   ├── context/
│   │   └── AuthContext.tsx  # Faculty auth state
│   └── screens/
│       ├── LoginScreen.tsx  # Faculty sign-in UI
│       └── ChatScreen.tsx   # Full chat interface
└── App.js                   # Expo entry point → src/App.tsx
```
