import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function SoundTrackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0F2F23",
        },
        headerTintColor: "#2ECC71",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "#FFFFFF",
        },
        headerBackTitle: "Back",
        headerBackTitleStyle: {
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#0A1F17",
        },
        animation: "slide_from_right",
      }}
    >
      {/* Home Screen */}
      <Stack.Screen
        name="index"
        options={{
          title: "Eco-Acoustic Monitor",
          headerLargeTitle: Platform.OS === "ios",
          headerTransparent: false,
        }}
      />

      {/* Listening Screen */}
      <Stack.Screen
        name="listening"
        options={{
          title: "Sound Listening",
          headerBackTitle: "Home",
        }}
      />

      {/* Processing Screen */}
      <Stack.Screen
        name="processing"
        options={{
          title: "Processing Audio",
          headerBackVisible: false, // Prevent going back during processing
          gestureEnabled: false, // Disable swipe back gesture
        }}
      />

      {/* Analysis Result Screen */}
      <Stack.Screen
        name="analysis-result"
        options={{
          title: "Detection Results",
          headerBackVisible: false, // User should navigate via buttons
          gestureEnabled: false,
        }}
      />

      {/* History Screen */}
      <Stack.Screen
        name="history"
        options={{
          title: "Detection History",
          headerBackTitle: "Home",
        }}
      />

      {/* Map Screen */}
      <Stack.Screen
        name="map"
        options={{
          title: "Hotspot Map",
          headerBackTitle: "Home",
        }}
      />
    </Stack>
  );
}