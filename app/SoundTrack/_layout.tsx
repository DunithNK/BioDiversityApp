import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function SoundTrackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#16A34A",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "#111827",
        },
        headerBackTitle: "Back",
        headerBackTitleStyle: {
          fontSize: 16,
        },
        headerShadowVisible: true,
        contentStyle: {
          backgroundColor: "#F9FAFB",
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
          headerLargeTitleStyle: {
            color: "#111827",
            fontWeight: "700",
          },
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
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />

      {/* Analysis Result Screen */}
      <Stack.Screen
        name="analysis-result"
        options={{
          title: "Detection Results",
          headerBackVisible: false,
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