import Constants from "expo-constants";
import { Platform } from "react-native";

// Automatically detect host IP from Expo Go debugger or fallback to LAN IP / localhost
function getApiBase(): string {
  if (Platform.OS === "web") {
    return "http://localhost:5000";
  }

  // Check all possible places Expo stores the host URI in modern Expo / Expo Go
  const hostUri =
    (Constants.expoGoConfig as any)?.debuggerHost ||
    (Constants as any).debuggerHost ||
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;

  if (hostUri && typeof hostUri === "string") {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:5000`;
    }
  }

  // LAN IP fallback for physical devices on your Wi-Fi network
  return "http://192.168.254.117:5000";
}

export const API_BASE = getApiBase();
