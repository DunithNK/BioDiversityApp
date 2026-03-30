import { Platform } from "react-native";

const EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function getDefaultApiBaseUrl() {
  if (EXPO_PUBLIC_API_BASE_URL) {
    return EXPO_PUBLIC_API_BASE_URL;
  }

  if (Platform.OS === "android") {
    // Android emulator cannot reach the host machine via 127.0.0.1.
    return "http://10.0.2.2:8000";
  }

  return "http://127.0.0.1:8000";
}

export const API_BASE_URL = getDefaultApiBaseUrl();

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        message =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
