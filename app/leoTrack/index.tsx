import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

type AlertItem = {
  id: string;
  time: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
};

export default function LeoTrackScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const router = useRouter();

  const getTimeLabel = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  const addRecentAlert = async (source: "Camera" | "Gallery") => {
    const location = await getCurrentLocation();
    if (!location) return;

    const newAlert: AlertItem = {
      id: Date.now().toString(),
      time: getTimeLabel(),
      source,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setRecentAlerts((prev) => [newAlert, ...prev].slice(0, 5));
  };

  // Open camera
  const handleTakeImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await addRecentAlert("Camera");
    }
  };

  // Open gallery
  const handleUploadImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Gallery access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await addRecentAlert("Gallery");
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleContinue = () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please take or upload an image first");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/leoTrack/health");
    }, 600);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <Text style={styles.icon}>🐆</Text>
      <Text style={styles.title}>Leopard Health Tracker</Text>
      <Text style={styles.subtitle}>
        Capture or upload an image of the observed leopard
      </Text>

      {/* Recent Regional Alerts */}
      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>Recent Regional Alerts</Text>

        {recentAlerts.length === 0 ? (
          <Text style={styles.alertEmpty}>
            No recent leopard sightings recorded
          </Text>
        ) : (
          recentAlerts.map((item) => (
            <View key={item.id} style={styles.alertItem}>
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
            </View>
          ))
        )}
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleTakeImage}>
        <Text style={styles.primaryText}>Take Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleUploadImage}
      >
        <Text style={styles.secondaryText}>Upload Image</Text>
      </TouchableOpacity>

      {/* Image Preview */}
      {!imageUri ? (
        <TouchableOpacity
          style={styles.uploadZone}
          onPress={handleUploadImage}
        >
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadTitle}>No image selected</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <View style={styles.imageActions}>
            <Text style={styles.imageStatusText}>
              ✓ Image ready for analysis
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveImage}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  icon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
  },
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
  alertTitle: {
    color: "#e5e7eb",
    fontWeight: "700",
    marginBottom: 10,
  },
  alertEmpty: {
    color: "#64748b",
    fontSize: 12,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  alertIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  alertText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
  },
  alertTime: {
    color: "#94a3b8",
    fontSize: 11,
  },
  alertStatus: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryText: {
    textAlign: "center",
    color: "#022c22",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  secondaryText: {
    textAlign: "center",
    color: "#e5e7eb",
    fontWeight: "600",
  },
  uploadZone: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadIcon: {
    fontSize: 36,
  },
  uploadTitle: {
    color: "#e5e7eb",
    fontWeight: "600",
    marginTop: 6,
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#052e16",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  imageStatusText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#fecaca",
    fontSize: 12,
    fontWeight: "600",
  },
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
