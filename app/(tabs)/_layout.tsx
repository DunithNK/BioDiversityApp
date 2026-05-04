import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#071A12",
          borderTopColor: "#0F2F23",
        },
        tabBarActiveTintColor: "#2ECC71",
        tabBarInactiveTintColor: "#6B8F7C",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* 🔴 HIDE TAB BAR FOR SOUNTRACK */}
      <Tabs.Screen
        name="SoundTrack"
        options={{
          title: "SoundTrack",
          href: null, // 🔥 removes tab button completely
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
