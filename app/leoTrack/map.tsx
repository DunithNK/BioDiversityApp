import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AlertItem = {
  alert_id: string;
  latitude: number;
  longitude: number;
};

const BACKEND_URL = "http://192.168.1.2:8000";
const STORAGE_KEY = "CACHED_ALERTS";

/* ------------------ GAL OYA SAFE BOUNDARY ------------------ */
const LAT_MIN = 6.8;
const LAT_MAX = 7.4;
const LON_MIN = 81.2;
const LON_MAX = 81.6;

/* Center of Gal Oya */
const GAL_OYA_REGION = {
  latitude: 7.1,
  longitude: 81.4,
  latitudeDelta: 0.6,
  longitudeDelta: 0.6,
};

export default function AlertMapScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error();

      // Store raw alerts
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Filter only Gal Oya alerts
      setAlerts(data.filter(isInsideGalOya));
    } catch {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setAlerts(parsed.filter(isInsideGalOya));
      } else {
        Alert.alert("Offline", "No cached map data available");
      }
    }
  };

  /* ------------------ GEO-FENCE CHECK ------------------ */
  const isInsideGalOya = (a: AlertItem) =>
    a.latitude >= LAT_MIN &&
    a.latitude <= LAT_MAX &&
    a.longitude >= LON_MIN &&
    a.longitude <= LON_MAX;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={GAL_OYA_REGION}
        minZoomLevel={10}
        maxZoomLevel={14}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={false}   // 🔒 lock map
        zoomEnabled={true}      // controlled zoom only
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        mapType="standard"
      >
        {alerts.map((alert) => (
          <Marker
            key={alert.alert_id}
            coordinate={{
              latitude: alert.latitude,
              longitude: alert.longitude,
            }}
            onPress={() =>
              router.push(
                `/leoTrack/result?alertId=${alert.alert_id}` as any
              )
            }
          >
            <View style={styles.marker}>
              <Text style={styles.markerIcon}>🐆</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header Overlay */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gal Oya Leopard Map</Text>
        <Text style={styles.headerSubtitle}>
          {alerts.length} Verified Detections (Restricted View)
        </Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back to Tracker</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  map: {
    flex: 1,
  },
  marker: {
    backgroundColor: "#1A3D2E",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  markerIcon: {
    fontSize: 18,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    alignItems: "center",
    backgroundColor: "rgba(26, 61, 46, 0.95)",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  headerSubtitle: {
    color: "#8BC4A9",
    fontSize: 12,
    marginTop: 4,
  },
  backBtn: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#1A3D2E",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  backText: {
    color: "#2ECC71",
    fontWeight: "800",
    fontSize: 15,
  },
});
