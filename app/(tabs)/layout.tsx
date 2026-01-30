import "react-native-gesture-handler";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopWidth: 0,
          height: 64,
        },
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Leopard Health */}
      <Tabs.Screen
        name="leoTrack"
        options={{
          title: "Leopard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="paw-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Footprint Identification */}
      <Tabs.Screen
        name="footPrint"
        options={{
          title: "Tracks",
          tabBarIcon: ({ color }) => (
            <Ionicons name="footsteps-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Sound Tracking */}
      <Tabs.Screen
        name="SoundTrack"
        options={{
          title: "Audio",
          tabBarIcon: ({ color }) => (
            <Ionicons name="mic-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Thermal View */}
      <Tabs.Screen
        name="ThermalView"
        options={{
          title: "Thermal",
          tabBarIcon: ({ color }) => (
            <Ionicons name="flame-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
