import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

type AlertItem = {
  alert_id: string;
  latitude: number;
  longitude: number;
  is_outside?: boolean;
  distance_to_boundary_km?: number;
};

type AssessmentData = {
  alert_id: string;
  severity: "None" | "Low" | "Moderate" | "High" | "Critical";
  score: number;
};

type AlertWithAssessment = AlertItem & {
  severity?: "None" | "Low" | "Moderate" | "High" | "Critical";
};

const BACKEND_URL = "http://192.168.1.3:8000";
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
  const [alerts, setAlerts] = useState<AlertWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOutside, setShowOutside] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error();

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const alertsWithAssessments = await Promise.all(
        data.map(async (alert) => {
          try {
            const assessmentRes = await fetch(
              `${BACKEND_URL}/assessment/${alert.alert_id}`
            );
            if (assessmentRes.ok) {
              const assessment: AssessmentData = await assessmentRes.json();
              return { ...alert, severity: assessment.severity };
            }
          } catch {
            // no assessment yet
          }
          return { ...alert, severity: undefined };
        })
      );

      setAlerts(alertsWithAssessments);
    } catch {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setAlerts(JSON.parse(cached));
      } else {
        Alert.alert("Offline", "No cached map data available");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ FILTER ------------------ */
  const filteredAlerts = showOutside
    ? alerts
    : alerts.filter((a) => a.is_outside !== true);

  const insideCount = alerts.filter((a) => a.is_outside !== true).length;
  const outsideCount = alerts.filter((a) => a.is_outside === true).length;

  /* ------------------ DYNAMIC REGION ------------------ */
  const getMapRegion = () => {
    if (!showOutside || filteredAlerts.length === 0) return GAL_OYA_REGION;

    const lats = filteredAlerts.map((a) => a.latitude);
    const lons = filteredAlerts.map((a) => a.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.5),
      longitudeDelta: Math.max((maxLon - minLon) * 1.5, 0.5),
    };
  };

  /* ------------------ SEVERITY HELPERS ------------------ */
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "Critical": return "#EF4444";
      case "High":     return "#F97316";
      case "Moderate": return "#F59E0B";
      case "Low":      return "#2ECC71";
      case "None":     return "#2ECC71";
      default:         return "#94A3B8";
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "Critical": return "🔴";
      case "High":     return "🟠";
      case "Moderate": return "🟡";
      case "Low":      return "🟢";
      case "None":     return "✅";
      default:         return "📍";
    }
  };

  /* ------------------ LOADING ------------------ */
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading Gal Oya Map...</Text>
        </View>
      </View>
    );
  }

  /* ------------------ EMPTY STATE ------------------ */
  if (filteredAlerts.length === 0 && !showOutside) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>Gal Oya Region Inactive</Text>
          <Text style={styles.emptySubtitle}>
            The Gal Oya map is only displayed when leopard detection events occur.
          </Text>
          <Text style={styles.emptyInfo}>
            Upload a leopard image to activate this area.
          </Text>
          <TouchableOpacity
            style={styles.emptyBackBtn}
            onPress={() => router.push("/(tabs)/leoTrack" as any)}
          >
            <Text style={styles.emptyBackText}>← Return to Tracker</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ------------------ MAP VIEW ------------------ */
  return (
    <View style={styles.container}>

      {/* ── Map ── */}
      <MapView
        style={styles.map}
        region={getMapRegion()}
        minZoomLevel={showOutside ? 5 : 10}
        maxZoomLevel={18}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={showOutside}
        zoomEnabled={true}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        mapType="standard"
      >
        {filteredAlerts.map((alert) => {
          const isOutside = alert.is_outside === true;
          const severityColor = getSeverityColor(alert.severity);
          const severityIcon = getSeverityIcon(alert.severity);
          const borderColor   = isOutside ? "#F97316" : "#2ECC71";
          const markerBgColor = isOutside ? "#FFA500" : severityColor;
          const displayIcon   = isOutside ? "📍" : severityIcon;

          if (isOutside) {
            console.log(
              `Outside marker: ${alert.alert_id} at ${alert.latitude}, ${alert.longitude}`
            );
          }

          return (
            <Marker
              key={alert.alert_id}
              coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
              onPress={() =>
                router.push(`/leoTrack/result?alertId=${alert.alert_id}` as any)
              }
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: markerBgColor,
                    borderColor: borderColor,
                    borderWidth: isOutside ? 4 : 3,
                  },
                ]}
              >
                <Text style={styles.markerIcon}>{displayIcon}</Text>
                <Text style={styles.markerEmoji}>🐆</Text>
                {isOutside && (
                  <View style={styles.outsideBadge}>
                    <Text style={styles.outsideBadgeText}>⚠️</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Header Overlay ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🗺️ {showOutside ? "Sri Lanka" : "Gal Oya"} Leopard Map
        </Text>
        <Text style={styles.headerSubtitle}>
          {showOutside
            ? `${filteredAlerts.length} Total (${insideCount} Inside 🟢, ${outsideCount} Outside 🟠)`
            : `${insideCount} Gal Oya Detection${insideCount !== 1 ? "s" : ""}`}
        </Text>
        {showOutside && (
          <Text style={styles.headerNote}>📍 Scroll & zoom to explore</Text>
        )}
      </View>

      {/* ── Toggle Filter (bottom-left of header) ── */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Show Outside Detections</Text>
        <Switch
          value={showOutside}
          onValueChange={setShowOutside}
          trackColor={{ false: "#CBD5E1", true: "#F97316" }}
          thumbColor="#FFF"
        />
      </View>

      {/* ── Legend Button (top-right, same row as toggle) ── */}
      <TouchableOpacity
        style={styles.legendBtn}
        onPress={() => setLegendVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.legendBtnIcon}>📋</Text>
        <Text style={styles.legendBtnText}>Legend</Text>
      </TouchableOpacity>

      {/* ── Legend Modal ── */}
      <Modal
        visible={legendVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLegendVisible(false)}
      >
        {/* Tapping the backdrop closes the modal */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLegendVisible(false)}
        >
          {/* Inner card — tap does NOT close */}
          <TouchableOpacity activeOpacity={1} style={styles.legendCard} onPress={() => {}}>

            {/* Title row */}
            <View style={styles.legendCardHeader}>
              <Text style={styles.legendTitle}>Legend</Text>
              <TouchableOpacity
                onPress={() => setLegendVisible(false)}
                style={styles.legendCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.legendCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Severity */}
            <Text style={styles.legendSubtitle}>Severity (Inside Gal Oya):</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <Text style={styles.legendIcon}>🔴</Text>
                <Text style={styles.legendText}>Critical</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendIcon}>🟠</Text>
                <Text style={styles.legendText}>High</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <Text style={styles.legendIcon}>🟡</Text>
                <Text style={styles.legendText}>Moderate</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendIcon}>🟢</Text>
                <Text style={styles.legendText}>Low / None</Text>
              </View>
            </View>

            <View style={styles.legendDivider} />

            {/* Location markers */}
            <Text style={styles.legendSubtitle}>Location Markers:</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.locationMarker, { backgroundColor: "#EF4444", borderColor: "#2ECC71" }]}>
                  <Text style={styles.locationMarkerEmoji}>🐆</Text>
                </View>
                <Text style={styles.legendText}>Gal Oya</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.locationMarker, { backgroundColor: "#FFA500", borderColor: "#F97316" }]}>
                  <Text style={styles.locationMarkerEmoji}>🐆</Text>
                </View>
                <Text style={styles.legendText}>Outside</Text>
              </View>
            </View>

            <Text style={styles.legendNote}>
              * Gal Oya markers show health severity colors
            </Text>

            {/* Done button */}
            <TouchableOpacity
              style={styles.legendDoneBtn}
              onPress={() => setLegendVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.legendDoneBtnText}>Close</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Back Button ── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/(tabs)/leoTrack" as any)}
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

  // ── Markers ──
  marker: {
    padding: 12,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
    minWidth: 56,
    minHeight: 56,
  },
  markerIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  markerEmoji: {
    fontSize: 18,
  },
  outsideBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#DC2626",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 8,
  },
  outsideBadgeText: {
    fontSize: 14,
  },

  // ── Header ──
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
    fontSize: 11,
    marginTop: 4,
  },
  headerNote: {
    color: "#F97316",
    fontSize: 10,
    marginTop: 4,
    fontStyle: "italic",
  },

  // ── Toggle ──
  toggleContainer: {
    position: "absolute",
    top: 152,
    left: 20,
    backgroundColor: "rgba(26, 61, 46, 0.95)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 10,
  },

  // ── Legend trigger button ──
  legendBtn: {
    position: "absolute",
    top: 152,
    right: 20,
    backgroundColor: "rgba(26, 61, 46, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBtnIcon: {
    fontSize: 15,
  },
  legendBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Modal backdrop ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  // ── Legend card ──
  legendCard: {
    backgroundColor: "rgba(15, 40, 28, 0.98)",
    borderRadius: 20,
    padding: 22,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  legendCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  legendTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  legendCloseBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  legendCloseBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  legendSubtitle: {
    color: "#8BC4A9",
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  legendIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  legendText: {
    color: "#D1FAE5",
    fontSize: 13,
    fontWeight: "500",
  },
  legendDivider: {
    height: 1,
    backgroundColor: "#2ECC71",
    marginVertical: 14,
    opacity: 0.3,
  },
  locationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginRight: 10,
  },
  locationMarkerEmoji: {
    fontSize: 18,
  },
  legendNote: {
    color: "#8BC4A9",
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 18,
  },
  legendDoneBtn: {
    backgroundColor: "#2ECC71",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  legendDoneBtnText: {
    color: "#0A1F17",
    fontWeight: "800",
    fontSize: 15,
  },

  // ── Back button ──
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

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A1F17",
  },
  loadingText: {
    color: "#8BC4A9",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },

  // ── Empty state ──
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A1F17",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#8BC4A9",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyInfo: {
    color: "#6B8E7A",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 32,
  },
  emptyBackBtn: {
    backgroundColor: "#1A3D2E",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  emptyBackText: {
    color: "#2ECC71",
    fontWeight: "800",
    fontSize: 16,
  },

  // Legacy (kept for safety)
  locationBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});