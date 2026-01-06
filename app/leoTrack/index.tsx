import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AlertItem = {
  alert_id: string;
  timestamp: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
};

const BACKEND_URL = "http://172.20.10.13:8000";

export default function LeoTrackScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const router = useRouter();

  /* -------------------- Animations -------------------- */
  useState(() => {
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
  });

  /* -------------------- Helpers -------------------- */

  const generateAlertId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission required");
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({});
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  };

  /* -------------------- Backend sync -------------------- */

  const fetchAlertsFromBackend = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();
      setRecentAlerts(data.slice(0, 4));
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
    alert_id: string,
    coords: { latitude: number; longitude: number },
    source: "Camera" | "Gallery"
  ) => {
    try {
      await fetch(`${BACKEND_URL}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id,
          timestamp: new Date().toISOString(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          source,
        }),
      });
    } catch {
      console.warn("Backend alert save failed");
    }
  };

  const addRecentAlert = async (source: "Camera" | "Gallery") => {
    const coords = await getCurrentLocation();
    if (!coords) return;

    const alert_id = generateAlertId();
    setCurrentAlertId(alert_id);

    await saveAlertToBackend(alert_id, coords, source);
    fetchAlertsFromBackend();
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
    const { status} =
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🐆</Text>
            </View>
          </View>
          <Text style={styles.title}>Leopard Health Tracker</Text>
          <Text style={styles.subtitle}>
            Capture or upload an image of the observed leopard
          </Text>

          {/* Status Badge */}
          {imageUri && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Image Captured</Text>
            </View>
          )}
        </Animated.View>

        {/* Recent Alerts Card */}
        <Animated.View
          style={[
            styles.alertCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>📍 Recent Regional Alerts</Text>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{recentAlerts.length}</Text>
            </View>
          </View>

          {recentAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.alertEmpty}>
                No recent leopard sightings recorded
              </Text>
            </View>
          ) : (
            <>
              {recentAlerts.map((item, index) => (
                <TouchableOpacity
                  key={item.alert_id}
                  style={[
                    styles.alertItem,
                    index === recentAlerts.length - 1 && styles.alertItemLast,
                  ]}
                  onPress={() =>
                    router.push(`/leoTrack/result?alertId=${item.alert_id}` as any)
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.alertIconContainer,
                      { backgroundColor: item.source === "Camera" ? "#1A3D2E" : "#1A2E3D" },
                    ]}
                  >
                    <Text style={styles.alertIconEmoji}>
                      {item.source === "Camera" ? "📷" : "🖼️"}
                    </Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertText}>
                      Leopard identified via {item.source}
                    </Text>
                    <Text style={styles.alertTime}>
                      {new Date(item.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text style={styles.alertCoords}>
                      {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E
                    </Text>
                  </View>
                  <View style={styles.alertStatusContainer}>
                    <View style={styles.alertStatusDot} />
                    <Text style={styles.alertStatus}>Active</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push("/leoTrack/history")}
                activeOpacity={0.85}
              >
                <Text style={styles.viewAllText}>View Complete History</Text>
                <Text style={styles.viewAllArrow}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.actionsLabel}>Capture Method</Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTakeImage}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>📷</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.primaryText}>Take Image</Text>
                <Text style={styles.buttonSubtext}>Use camera to capture</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUploadImage}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonIconContainer}>
                <Text style={styles.buttonIcon}>🖼️</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.secondaryText}>Upload Image</Text>
                <Text style={styles.buttonSubtextSecondary}>
                  Select from gallery
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!imageUri || loading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!imageUri || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>
              {loading ? "🔄 Analyzing..." : "Continue to Analysis →"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 Secure image processing with AI-powered health assessment
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header Section
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2ECC71",
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2ECC71",
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#2ECC71",
    fontWeight: "600",
  },

  // Alert Card
  alertCard: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.3,
  },
  alertBadge: {
    backgroundColor: "#1A3D2E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  alertBadgeText: {
    color: "#2ECC71",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  alertEmpty: {
    color: "#6B9F88",
    fontSize: 13,
    textAlign: "center",
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3D2E",
  },
  alertItemLast: {
    borderBottomWidth: 0,
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertIconEmoji: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  alertTime: {
    color: "#8BC4A9",
    fontSize: 12,
    marginBottom: 2,
  },
  alertCoords: {
    color: "#6B9F88",
    fontSize: 11,
  },
  alertStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  alertStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ECC71",
    marginRight: 6,
  },
  alertStatus: {
    color: "#2ECC71",
    fontSize: 11,
    fontWeight: "700",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
  },
  viewAllText: {
    color: "#3498DB",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 6,
  },
  viewAllArrow: {
    color: "#3498DB",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Actions Section
  actionsContainer: {
    marginBottom: 20,
  },
  actionsLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#2ECC71",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#3FDD81",
  },
  primaryText: {
    color: "#022C22",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  buttonSubtext: {
    color: "#1A5335",
    fontSize: 12,
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "#0F2F23",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  secondaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  buttonSubtextSecondary: {
    color: "#8BC4A9",
    fontSize: 12,
    fontWeight: "500",
  },

  // Continue Button
  continueButton: {
    backgroundColor: "#F59E0B",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FBBF24",
    marginBottom: 24,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    textAlign: "center",
    color: "#451A03",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingTop: 20,
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#1A3D2E",
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#6B9F88",
    textAlign: "center",
    lineHeight: 18,
  },
});