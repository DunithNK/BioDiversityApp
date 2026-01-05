import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AlertItem = {
  id: string;
  time: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
};

const BACKEND_URL = "http://192.168.206.199:8000";

export default function LeoTrackScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);

  const router = useRouter();

  /* -------------------- Helpers -------------------- */

  const getTimeLabel = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const generateAlertId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission required");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  /* -------------------- Backend sync -------------------- */

  const fetchAlertsFromBackend = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();

      // Normalize backend format → frontend format
      const normalized: AlertItem[] = data.map((item: any) => ({
        id: item.alert_id,
        time: item.time,
        source: item.source,
        latitude: item.latitude,
        longitude: item.longitude,
      }));

      setRecentAlerts(normalized.slice(0, 5));
    } catch {
      console.warn("Failed to fetch alerts");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlertsFromBackend();
    }, [])
  );

  const saveAlertToBackend = async (
    alertId: string,
    time: string,
    latitude: number,
    longitude: number,
    source: "Camera" | "Gallery"
  ) => {
    try {
      await fetch(`${BACKEND_URL}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertId,
          time,
          latitude,
          longitude,
          source,
        }),
      });
    } catch {
      console.warn("Backend alert save failed");
    }
  };

  const addRecentAlert = async (source: "Camera" | "Gallery") => {
    const location = await getCurrentLocation();
    if (!location) return;

    const alertId = generateAlertId();
    const time = getTimeLabel();

    const newAlert: AlertItem = {
      id: alertId,
      time,
      source,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setCurrentAlertId(alertId);
    setRecentAlerts((prev) => [newAlert, ...prev].slice(0, 5));

    await saveAlertToBackend(
      alertId,
      time,
      location.latitude,
      location.longitude,
      source
    );
  };

  /* -------------------- Image handlers -------------------- */

  const handleTakeImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await addRecentAlert("Camera");
    }
  };

  const handleUploadImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Gallery access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await addRecentAlert("Gallery");
    }
  };

  /* -------------------- Navigation -------------------- */

  const handleContinue = () => {
    if (!imageUri || !currentAlertId) {
      Alert.alert("Missing Data", "Please capture an image first");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(`/leoTrack/health?alertId=${currentAlertId}` as any);
    }, 600);
  };

  /* -------------------- UI -------------------- */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 24 }}
    >
      <Text style={styles.icon}>🐆</Text>
      <Text style={styles.title}>Leopard Health Tracker</Text>
      <Text style={styles.subtitle}>
        Capture or upload an image of the observed leopard
      </Text>

      {/* Recent Alerts */}
      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>Recent Regional Alerts</Text>

        {recentAlerts.length === 0 ? (
          <Text style={styles.alertEmpty}>
            No recent leopard sightings recorded
          </Text>
        ) : (
          recentAlerts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.alertItem}
              onPress={() =>
                router.push(`/leoTrack/result?alertId=${item.id}` as any)
              }
            >
              <Text style={styles.alertIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertText}>
                  Leopard identified via {item.source}
                </Text>
                <Text style={styles.alertTime}>
                  {item.time} • Lat {item.latitude.toFixed(4)}, Lon{" "}
                  {item.longitude.toFixed(4)}
                </Text>
              </View>
              <Text style={styles.alertStatus}>Active</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleTakeImage}>
        <Text style={styles.primaryText}>Take Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleUploadImage}
      >
        <Text style={styles.secondaryText}>Upload Image</Text>
      </TouchableOpacity>

      {/* Continue */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          (!imageUri || loading) && { opacity: 0.4 },
        ]}
        onPress={handleContinue}
        disabled={!imageUri || loading}
      >
        <Text style={styles.continueText}>
          {loading ? "Analyzing..." : "Continue"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* -------------------- Styles (UNCHANGED) -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  icon: { fontSize: 48, textAlign: "center", marginBottom: 6 },
  title: { fontSize: 24, fontWeight: "700", color: "#f8fafc", textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16,
  },

  alertCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  alertTitle: { color: "#e5e7eb", fontWeight: "700", marginBottom: 10 },
  alertEmpty: { color: "#64748b", fontSize: 12 },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  alertIcon: { fontSize: 18, marginRight: 10 },
  alertText: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  alertTime: { color: "#94a3b8", fontSize: 11 },
  alertStatus: { color: "#22c55e", fontSize: 11, fontWeight: "700" },

  primaryButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryText: { textAlign: "center", color: "#022c22", fontWeight: "600" },

  secondaryButton: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  secondaryText: { textAlign: "center", color: "#e5e7eb", fontWeight: "600" },

  continueButton: {
    backgroundColor: "#f59e0b",
    padding: 14,
    borderRadius: 10,
  },
  continueText: {
    textAlign: "center",
    color: "#451a03",
    fontWeight: "700",
  },
});
