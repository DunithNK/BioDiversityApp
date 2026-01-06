import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AlertItem = {
  alert_id: string;
  time: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
};

const BACKEND_URL = "http://172.20.10.13:8000";
const STORAGE_KEY = "CACHED_ALERTS";

export default function AlertMapScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchAlerts();
    
    // Start entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid backend data");
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAlerts(data);
    } catch {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) setAlerts(JSON.parse(cached));
      else Alert.alert("Offline", "No cached map data available");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Initializing WildSense Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        // Applying a dark forest theme style here is recommended via customMapStyle prop
        initialRegion={{
          latitude: alerts[0]?.latitude ?? 7.8731,
          longitude: alerts[0]?.longitude ?? 80.7718,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {alerts.map((alert) => (
          <Marker
            key={alert.alert_id}
            coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
            onPress={() => router.push(`/leoTrack/result?alertId=${alert.alert_id}` as any)}
          >
            <View style={[
                styles.markerContainer, 
                { borderColor: alert.source === "Camera" ? "#2ECC71" : "#3498DB" }
            ]}>
              <Text style={styles.markerIcon}>
                {alert.source === "Camera" ? "🐆" : "🖼️"}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Animated Overlay Header */}
      <Animated.View 
        style={[
          styles.header, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Leopard Alert Map</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {alerts.length} Conservation Data Points Detected
        </Text>
      </Animated.View>

      {/* Animated Back Button */}
      <Animated.View 
        style={[
          styles.bottomControls, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>← Return to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  center: {
    flex: 1,
    backgroundColor: "#0A1F17",
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    color: "#8BC4A9",
    fontSize: 16,
    fontWeight: "600",
  },

  // Header Overlay (Matching Hero/Status Badge style)
  header: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#8BC4A9",
    fontSize: 12,
    marginTop: 10,
    backgroundColor: "rgba(10, 31, 23, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },

  // Marker Styling
  markerContainer: {
    backgroundColor: "#0F2F23",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  markerIcon: {
    fontSize: 18,
  },

  // Back Button (Matching Card style)
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  backBtn: {
    backgroundColor: "#1A3D2E",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2ECC71",
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  backText: {
    color: "#2ECC71",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});