import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const BACKEND_URL = "http://192.168.1.3:8000";

export default function LeoTrackScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);

  // Animation States
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const router = useRouter();

  /* -------------------- Animations -------------------- */
  useEffect(() => {
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

  /* -------------------- Helpers -------------------- */

  const generateAlertId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission required");
      return null;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch (error) {
      // Use default Gal Oya National Park coordinates if location unavailable
      console.log("Using default location: Gal Oya National Park");
      return {
        latitude: 7.19,
        longitude: 81.4,
      };
    }
  };

  /* -------------------- Backend sync -------------------- */

  const checkGeofence = async (coords: { latitude: number; longitude: number }) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/check-location?latitude=${coords.latitude}&longitude=${coords.longitude}`,
        { method: "POST" }
      );
      
      if (!res.ok) {
        console.warn("Geofence check failed, assuming inside park");
        return { is_inside: true, distance_to_boundary_km: null };
      }
      
      const data = await res.json();
      return {
        is_inside: data.is_inside,
        distance_to_boundary_km: data.distance_to_boundary_km,
        message: data.message,
      };
    } catch (error) {
      console.warn("Geofence check error:", error);
      // Assume inside park if check fails
      return { is_inside: true, distance_to_boundary_km: null };
    }
  };

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
    }, []),
  );

  const saveAlertToBackend = async (
    alert_id: string,
    coords: { latitude: number; longitude: number },
    source: "Camera" | "Gallery",
    is_outside: boolean = false,
    distance_to_boundary_km: number | null = null,
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
          is_outside,
          distance_to_boundary_km,
        }),
      });
    } catch {
      console.warn("Backend alert save failed");
    }
  };

  const addRecentAlert = async (source: "Camera" | "Gallery") => {
    setCreatingAlert(true);
    setStatusMessage('📍 Getting location...');
    
    const coords = await getCurrentLocation();
    if (!coords) {
      setCreatingAlert(false);
      return;
    }

    setStatusMessage('� Checking park boundary...');
    const geofenceStatus = await checkGeofence(coords);
    
    // If outside Gal Oya National Park, show confirmation dialog
    if (!geofenceStatus.is_inside) {
      setCreatingAlert(false);
      
      return new Promise<void>((resolve) => {
        Alert.alert(
          "⚠️ Detection Outside Gal Oya National Park",
          `This detection is ${geofenceStatus.distance_to_boundary_km?.toFixed(2) || 'several'} km from the park boundary.\n\n${geofenceStatus.message || ''}\n\nDo you want to continue and save this alert anyway?`,
          [
            {
              text: "No, Cancel",
              style: "cancel",
              onPress: () => {
                setStatusMessage('❌ Alert creation cancelled');
                setTimeout(() => {
                  setStatusMessage('');
                  setUploadStatus('idle');
                }, 2000);
                resolve();
              },
            },
            {
              text: "Yes, Continue",
              onPress: async () => {
                setCreatingAlert(true);
                setStatusMessage('💾 Creating alert...');
                
                const alert_id = generateAlertId();
                setCurrentAlertId(alert_id);

                await saveAlertToBackend(
                  alert_id,
                  coords,
                  source,
                  true, // is_outside = true
                  geofenceStatus.distance_to_boundary_km
                );
                fetchAlertsFromBackend();
                
                setCreatingAlert(false);
                setStatusMessage('✅ Alert created (outside park boundary)');
                resolve();
              },
            },
          ],
          { cancelable: false }
        );
      });
    }

    // Inside park - proceed normally
    setStatusMessage('💾 Creating alert...');
    const alert_id = generateAlertId();
    setCurrentAlertId(alert_id);

    await saveAlertToBackend(
      alert_id,
      coords,
      source,
      false, // is_outside = false
      geofenceStatus.distance_to_boundary_km
    );
    fetchAlertsFromBackend();
    
    setCreatingAlert(false);
    setStatusMessage('✅ Alert created successfully!');
  };

  /* -------------------- Image handlers -------------------- */

  const detectLeopard = async (uri: string) => {
    setUploadStatus('uploading');
    setStatusMessage('Uploading image...');
    
    try {
      // Convert to clean JPEG before upload
      const manipulated = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const formData = new FormData();
      formData.append("file", {
        uri: manipulated.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      setUploadStatus('analyzing');
      setStatusMessage('Analyzing with AI...');
      
      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Backend response:", data);

      // Detection now depends only on backend result
      if (data.result === "Leopard Detected") {
        setUploadStatus('success');
        setStatusMessage(`✅ Leopard detected! Confidence: ${(data.confidence * 100).toFixed(1)}%`);
        Alert.alert(
          "🐆 Leopard Detected!",
          `Confidence: ${(data.confidence * 100).toFixed(1)}%\n\nAlert has been created.`,
          [{ text: "OK" }]
        );
        return true;
      } else {
        setUploadStatus('error');
        setStatusMessage('❌ Not a leopard');
        Alert.alert(
          "Leopard Not Detected",
          `This image does not contain a leopard.\n\nConfidence: ${(data.confidence * 100).toFixed(1)}%`,
        );
        return false;
      }
    } catch (error) {
      console.log("Detection error:", error);
      setUploadStatus('error');
      setStatusMessage('❌ Connection failed');
      Alert.alert("Server Error", "Failed to connect to detection server. Please check your connection.");
      return false;
    }
  };

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
      const uri = result.assets[0].uri;

      setUploadStatus('idle');
      setStatusMessage('');
      setLoading(true);

      const isLeopard = await detectLeopard(uri);

      setLoading(false);

      if (!isLeopard) return;

      setImageUri(uri);
      await addRecentAlert("Camera");
    }
  };

  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Gallery access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setUploadStatus('idle');
      setStatusMessage('');
      setLoading(true);

      const isLeopard = await detectLeopard(uri);

      setLoading(false);

      if (!isLeopard) return;

      setImageUri(uri);
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
          <Text style={styles.title}>Leopard Tracker</Text>
          <Text style={styles.subtitle}>
            Capture or upload an image of the observed leopard for AI health
            assessment
          </Text>

          {/* Status Badge */}
          {(imageUri || uploadStatus !== 'idle' || creatingAlert) && (
            <View style={[
              styles.statusBadge,
              uploadStatus === 'success' && styles.statusBadgeSuccess,
              uploadStatus === 'error' && styles.statusBadgeError,
              (uploadStatus === 'uploading' || uploadStatus === 'analyzing' || creatingAlert) && styles.statusBadgeLoading
            ]}>
              <View style={[
                styles.statusDot,
                uploadStatus === 'success' && styles.statusDotSuccess,
                uploadStatus === 'error' && styles.statusDotError,
                (uploadStatus === 'uploading' || uploadStatus === 'analyzing' || creatingAlert) && styles.statusDotLoading
              ]} />
              <Text style={styles.statusText}>
                {statusMessage || 'Image Ready for Analysis'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Loading Overlay */}
        {(uploadStatus === 'uploading' || uploadStatus === 'analyzing' || creatingAlert) && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#2ECC71" />
              <Text style={styles.loadingText}>{statusMessage}</Text>
            </View>
          </View>
        )}

        {/* Recent Alerts Card */}
        <Animated.View style={[styles.alertCard, { opacity: fadeAnim }]}>
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
                No recent sightings recorded in this area
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
                    router.push(
                      `/leoTrack/result?alertId=${item.alert_id}` as any,
                    )
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.alertIconContainer,
                      {
                        backgroundColor:
                          item.source === "Camera" ? "#E8F5E9" : "#E3F2FD",
                      },
                    ]}
                  >
                    <Text style={styles.alertIconEmoji}>
                      {item.source === "Camera" ? "📷" : "🖼️"}
                    </Text>
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertText}>
                      Leopard logged via {item.source}
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
                      {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}
                      °E
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
                <Text style={styles.viewAllText}>View History</Text>
                <Text style={styles.viewAllArrow}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[{ opacity: fadeAnim }, styles.actionsContainer]}>
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
                <Text style={styles.buttonSubtext}>Use device camera</Text>
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
        <Animated.View style={[{ opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!imageUri || !currentAlertId || loading || creatingAlert) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!imageUri || !currentAlertId || loading || creatingAlert}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>
              {loading || creatingAlert ? "🔄 Processing..." : "Continue to Analysis →"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 AI-Powered Health Assessment & Tracking
          </Text>
        </View>
      </ScrollView>

      {/* FIXED FLOATING MAP BUTTON */}
      <Animated.View
        style={[
          styles.floatingMapContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 100],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.floatingMapBtn}
          onPress={() => router.push("/leoTrack/map")}
          activeOpacity={0.9}
        >
          <View style={styles.mapIconCircle}>
            <Text style={styles.mapIconEmoji}>🗺️</Text>
          </View>
          <Text style={styles.floatingMapText}>View Sightings Map</Text>
          <View style={styles.mapPulse} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
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
    backgroundColor: "#E8F5E9",
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
    color: "#1B5E20",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
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
    color: "#1B5E20",
    fontWeight: "700",
  },
  statusBadgeSuccess: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2ECC71",
  },
  statusBadgeError: {
    backgroundColor: "#FFEBEE",
    borderColor: "#EF5350",
  },
  statusBadgeLoading: {
    backgroundColor: "#E3F2FD",
    borderColor: "#42A5F5",
  },
  statusDotSuccess: {
    backgroundColor: "#2ECC71",
  },
  statusDotError: {
    backgroundColor: "#EF5350",
  },
  statusDotLoading: {
    backgroundColor: "#42A5F5",
  },

  // Alert Card
  alertCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  alertTitle: {
    color: "#1B5E20",
    fontWeight: "700",
    fontSize: 16,
  },
  alertBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  alertBadgeText: {
    color: "#1B5E20",
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
    color: "#757575",
    fontSize: 13,
    textAlign: "center",
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
    color: "#212121",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  alertTime: {
    color: "#616161",
    fontSize: 12,
  },
  alertCoords: {
    color: "#757575",
    fontSize: 11,
  },
  alertStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
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
    color: "#1B5E20",
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
    color: "#2ECC71",
    fontWeight: "700",
    fontSize: 14,
    marginRight: 6,
  },
  viewAllArrow: {
    color: "#2ECC71",
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
    color: "#1B5E20",
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
    borderWidth: 0,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  secondaryButton: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  secondaryText: {
    color: "#212121",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonSubtextSecondary: {
    color: "#757575",
    fontSize: 12,
  },

  // Continue Button
  continueButton: {
    backgroundColor: "#2ECC71",
    padding: 18,
    borderRadius: 16,
    borderWidth: 0,
    marginBottom: 24,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingTop: 10,
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "center",
  },

  // Floating Map Button
  floatingMapContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  floatingMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ECC71",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  mapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  mapIconEmoji: {
    fontSize: 18,
  },
  floatingMapText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  mapPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginLeft: 10,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
