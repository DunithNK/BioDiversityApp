import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

const BACKEND_URL = "http://192.168.1.3:8000";

type CapturedLeopard = {
  alert_id: string;
  timestamp: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
  capture_timestamp: string;
  is_released: boolean;
  release_timestamp?: string;
  severity?: string;
  score?: number;
};

export default function CapturedScreen() {
  const router = useRouter();

  const [capturedLeopards, setCapturedLeopards] = useState<CapturedLeopard[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  /* ---------------- Animations ---------------- */
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

  /* ---------------- Fetch Captured Leopards ---------------- */

  const fetchCapturedLeopards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/captured-leopards`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
        Alert.alert("Error", "Invalid data format from server");
        return;
      }
      
      console.log("Fetched captured leopards:", data.length);
      
      // Sort: not released first, then by capture date (newest first)
      const sortedData = data.sort((a, b) => {
        // Not released first
        if (a.is_released !== b.is_released) {
          return a.is_released ? 1 : -1;
        }
        // Then by capture date
        const dateA = new Date(a.capture_timestamp || 0).getTime();
        const dateB = new Date(b.capture_timestamp || 0).getTime();
        return dateB - dateA;
      });
      
      setCapturedLeopards(sortedData);
    } catch (error) {
      console.error("Fetch captured leopards error:", error);
      Alert.alert(
        "Connection Error", 
        "Failed to load captured leopards. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCapturedLeopards();
    }, [])
  );

  /* ---------------- Release Leopard ---------------- */

  const handleReleaseLeopard = async (alertId: string) => {
    Alert.alert(
      "Confirm Release",
      "Are you sure this leopard has been released back into the wild?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm Release",
          style: "default",
          onPress: async () => {
            setReleasingId(alertId);
            try {
              const res = await fetch(`${BACKEND_URL}/release/${alertId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  is_released: true,
                  release_timestamp: new Date().toISOString(),
                }),
              });

              const data = await res.json();

              if (res.ok) {
                Alert.alert(
                  "Release Confirmed",
                  "Leopard has been marked as released.",
                  [{ text: "OK" }]
                );
                
                // Refresh list
                fetchCapturedLeopards();
              } else {
                throw new Error(data.error || "Failed to confirm release");
              }
            } catch (error) {
              console.error("Release confirmation error:", error);
              Alert.alert("Error", "Failed to confirm release. Please try again.");
            } finally {
              setReleasingId(null);
            }
          },
        },
      ]
    );
  };

  /* ---------------- Helper Functions ---------------- */

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getColorBySeverity = (severity?: string) => {
    switch (severity) {
      case "Low":
        return "#2ECC71";
      case "Moderate":
        return "#F59E0B";
      case "High":
        return "#F97316";
      case "Critical":
        return "#EF4444";
      default:
        return "#9E9E9E";
    }
  };

  /* ---------------- Render Functions ---------------- */

  const renderItem = ({ item }: { item: CapturedLeopard }) => {
    if (!item.alert_id) {
      return null;
    }

    const isReleasing = releasingId === item.alert_id;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[
            styles.item,
            item.is_released && styles.itemReleased,
          ]}
          onPress={() => router.push(`/leoTrack/result?alertId=${item.alert_id}` as any)}
          activeOpacity={0.85}
        >
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.is_released ? "#E3F2FD" : "#FFF8E1",
                borderColor: item.is_released ? "#1E88E5" : "#F59E0B",
              },
            ]}
          >
            <Text style={styles.statusIcon}>
              {item.is_released ? "✅" : "🔒"}
            </Text>
            <Text
              style={[
                styles.statusText,
                {
                  color: item.is_released ? "#1565C0" : "#F57C00",
                },
              ]}
            >
              {item.is_released ? "Released" : "Captured"}
            </Text>
          </View>

          {/* Header */}
          <View style={styles.itemHeader}>
            <View style={styles.leopardIconContainer}>
              <Text style={styles.leopardIcon}>🐆</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>
                Leopard #{item.alert_id.slice(-6).toUpperCase()}
              </Text>
              <View style={styles.itemBadge}>
                <View
                  style={[
                    styles.itemBadgeDot,
                    { backgroundColor: getColorBySeverity(item.severity) },
                  ]}
                />
                <Text style={styles.itemBadgeText}>
                  {item.severity || "Assessed"}
                </Text>
              </View>
            </View>
            <Text style={styles.itemArrow}>→</Text>
          </View>

          {/* Details */}
          <View style={styles.itemDetails}>
            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>📸</Text>
              <Text style={styles.itemDetailText}>
                Detected: {formatDate(item.timestamp)}
              </Text>
            </View>

            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>🔒</Text>
              <Text style={styles.itemDetailText}>
                Captured: {formatDate(item.capture_timestamp)}
              </Text>
            </View>

            {item.is_released && item.release_timestamp && (
              <View style={styles.itemDetail}>
                <Text style={styles.itemDetailIcon}>✅</Text>
                <Text style={styles.itemDetailText}>
                  Released: {formatDate(item.release_timestamp)}
                </Text>
              </View>
            )}

            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>📍</Text>
              <Text style={styles.itemDetailText}>
                {typeof item.latitude === 'number' && typeof item.longitude === 'number'
                  ? `${item.latitude.toFixed(4)}°N, ${item.longitude.toFixed(4)}°E`
                  : "Location unavailable"}
              </Text>
            </View>
          </View>

          {/* Release Button - Only show if not released */}
          {!item.is_released && (
            <TouchableOpacity
              style={styles.releaseButton}
              onPress={() => handleReleaseLeopard(item.alert_id)}
              disabled={isReleasing}
              activeOpacity={0.85}
            >
              {isReleasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.releaseIcon}>🌿</Text>
                  <Text style={styles.releaseText}>Mark as Released</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Accent bar */}
          <View
            style={[
              styles.accentBar,
              {
                backgroundColor: item.is_released ? "#1E88E5" : "#F59E0B",
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerIconContainer}>
            <View style={styles.headerIconCircle}>
              <Text style={styles.headerIcon}>🐆</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Captured Leopards</Text>
          <Text style={styles.headerSubtitle}>
            View and manage captured leopards
          </Text>

          {/* Stats Badge */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {capturedLeopards.filter(l => !l.is_released).length}
              </Text>
              <Text style={styles.statLabel}>In Care</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {capturedLeopards.filter(l => l.is_released).length}
              </Text>
              <Text style={styles.statLabel}>Released</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{capturedLeopards.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Animated.View>

        {/* Alert List */}
        <Animated.View
          style={[
            styles.listSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Captured Leopards</Text>
            {capturedLeopards.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{capturedLeopards.length}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⏳</Text>
              <Text style={styles.emptyTitle}>Loading...</Text>
              <Text style={styles.emptyText}>Fetching captured leopards</Text>
            </View>
          ) : capturedLeopards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Captured Leopards</Text>
              <Text style={styles.emptyText}>
                No leopards have been marked as captured yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={capturedLeopards}
              keyExtractor={(item, index) => item.alert_id || `captured-${index}`}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Animated.View>

        {/* Info Card */}
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Leopard Management</Text>
            <Text style={styles.infoText}>
              Track captured leopards undergoing treatment or monitoring. Mark them as released when they return to the wild.
            </Text>
          </View>
        </Animated.View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.closeText}>← Back to Tracker</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 Secure wildlife management system
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  headerIconContainer: {
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF8E1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F59E0B",
  },
  headerIcon: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    textAlign: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    backgroundColor: "#FAFAFA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    color: "#F59E0B",
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "600",
  },

  // List Section
  listSection: {
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  countText: {
    color: "#F57C00",
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    gap: 16,
  },

  // Item
  item: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemReleased: {
    opacity: 0.75,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    zIndex: 10,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  leopardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF8E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  leopardIcon: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  itemBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginRight: 6,
  },
  itemBadgeText: {
    fontSize: 11,
    color: "#616161",
    fontWeight: "600",
  },
  itemArrow: {
    fontSize: 22,
    color: "#F59E0B",
    fontWeight: "bold",
  },
  itemDetails: {
    gap: 8,
    marginBottom: 12,
  },
  itemDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemDetailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  itemDetailText: {
    fontSize: 13,
    color: "#616161",
    lineHeight: 18,
  },
  releaseButton: {
    backgroundColor: "#2ECC71",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#27AE60",
    marginTop: 8,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  releaseIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  releaseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    color: "#212121",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  infoText: {
    fontSize: 13,
    color: "#757575",
    lineHeight: 19,
  },

  // Close Button
  closeButton: {
    backgroundColor: "#2ECC71",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeText: {
    color: "#FFFFFF",
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
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "center",
  },
});