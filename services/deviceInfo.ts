import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function getDeviceIdentifier(): Promise<string> {
  try {
    if (Platform.OS === "android") {
      const androidId = Application.getAndroidId();
      if (androidId) return androidId;
    }

    if (Platform.OS === "ios") {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) return iosId;
    }
  } catch (error) {
    console.error("Failed to get native device identifier:", error);
  }

  return [
    Application.applicationId ?? "bio-diversity-app",
    Device.modelName ?? Platform.OS,
  ].join("-");
}

export function getDeviceLabel(): string {
  return `${Device.modelName ?? "Unknown Device"} • ${Application.applicationId ?? "unknown-app"}`;
}
