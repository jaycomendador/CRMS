import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import ChatScreen from "./screens/ChatScreen";

function AppNavigator() {
  const { user } = useAuth();
  return user ? <ChatScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
