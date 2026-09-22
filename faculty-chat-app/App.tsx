import React, { useState } from "react";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import ChatScreen from "./src/screens/ChatScreen";
import SplashScreen from "./src/screens/SplashScreen";

function AppNavigator() {
  const { user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Show splash screen on first launch until its animation finishes
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return user ? <ChatScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
