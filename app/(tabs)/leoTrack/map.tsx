import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
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
  const [alerts, setAlerts] = useState<AlertWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOutside, setShowOutside] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error();

      // Store raw alerts
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Fetch assessment data for ALL alerts (we'll filter by toggle later)
      const alertsWithAssessments = await Promise.all(
        data.map(async (alert) => {
          try {
            const assessmentRes = await fetch(`${BACKEND_URL}/assessment/${alert.alert_id}`);
            if (assessmentRes.ok) {
              const assessment: AssessmentData = await assessmentRes.json();
              return { ...alert, severity: assessment.severity };
            }
          } catch {
            // If assessment not found, return alert without severity
          }
          return { ...alert, severity: undefined };
        })
      );

      setAlerts(alertsWithAssessments);
    } catch {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setAlerts(parsed);
      } else {
        Alert.alert("Offline", "No cached map data available");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ FILTER ALERTS BY TOGGLE ------------------ */
  const filteredAlerts = showOutside 
    ? alerts // Show all alerts
    : alerts.filter(a => a.is_outside !== true); // Show only Gal Oya alerts (inside or undefined)
  
  const insideCount = alerts.filter(a => a.is_outside !== true).length;
  const outsideCount = alerts.filter(a => a.is_outside === true).length;

  /* ------------------ DYNAMIC MAP REGION ------------------ */
  const getMapRegion = () => {
    if (!showOutside || filteredAlerts.length === 0) {
      return GAL_OYA_REGION; // Default Gal Oya view
    }

    // Calculate bounds for all visible alerts
    const lats = filteredAlerts.map(a => a.latitude);
    const lons = filteredAlerts.map(a => a.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lonDelta = (maxLon - minLon) * 1.5;
    
    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: Math.max(latDelta, 0.5), // Minimum zoom
      longitudeDelta: Math.max(lonDelta, 0.5),
    };
  };

  /* ------------------ SEVERITY COLOR MAPPING ------------------ */
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "Critical":
        return "#EF4444"; // Red
      case "High":
        return "#F97316"; // Orange
      case "Moderate":
        return "#F59E0B"; // Yellow
      case "Low":
        return "#2ECC71"; // Green
      case "None":
        return "#2ECC71"; // Green
      default:
        return "#94A3B8"; // Gray for no assessment
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "Critical":
        return "🔴";
      case "High":
        return "🟠";
      case "Moderate":
        return "🟡";
      case "Low":
        return "🟢";
      case "None":
        return "✅";
      default:
        return "📍";
    }
  };

  /* ------------------ CONDITIONAL DISPLAY ------------------ */
  // Show loading state
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

  // Condition 1: Only show map if leopard detections exist
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
            onPress={() => router.back()}
          >
            <Text style={styles.emptyBackText}>← Return to Tracker</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show map with color-coded hotspots
  return (
    <View style={styles.container}>
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
          
          // Color scheme for markers - ONLY Gal Oya shows severity colors
          const borderColor = isOutside ? "#F97316" : "#2ECC71"; // Orange border for outside, Green for inside
          const markerBgColor = isOutside ? "#FFA500" : severityColor; // Plain orange for outside, severity color for inside
          const displayIcon = isOutside ? "📍" : severityIcon; // Location pin for outside, severity icon for inside
          
          // Debug: Log outside markers
          if (isOutside) {
            console.log(`Outside marker: ${alert.alert_id} at ${alert.latitude}, ${alert.longitude}`);
          }
          
          return (
            <Marker
              key={alert.alert_id}
              coordinate={{
                latitude: alert.latitude,
                longitude: alert.longitude,
              }}
              onPress={() =>
                router.push(`/leoTrack/result?alertId=${alert.alert_id}` as any)
              }
            >
              <View style={[styles.marker, { 
                backgroundColor: markerBgColor, 
                borderColor: borderColor, 
                borderWidth: isOutside ? 4 : 3 // Thicker border for outside markers to make them more visible
              }]}>
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

      {/* Header Overlay */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ {showOutside ? 'Sri Lanka' : 'Gal Oya'} Leopard Map</Text>
        <Text style={styles.headerSubtitle}>
          {showOutside 
            ? `${filteredAlerts.length} Total (${insideCount} Inside 🟢, ${outsideCount} Outside 🟠)` 
            : `${insideCount} Gal Oya Detection${insideCount !== 1 ? "s" : ""}`
          }
        </Text>
        {showOutside && (
          <Text style={styles.headerNote}>📍 Scroll & zoom to explore</Text>
        )}
      </View>

      {/* Toggle Filter */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Show Outside Detections</Text>
        <Switch
          value={showOutside}
          onValueChange={setShowOutside}
          trackColor={{ false: "#CBD5E1", true: "#F97316" }}
          thumbColor={showOutside ? "#FFF" : "#FFF"}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
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
            <Text style={styles.legendText}>Low/None</Text>
          </View>
        </View>
        <View style={styles.legendDivider} />
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
        <Text style={styles.legendNote}>* Gal Oya markers show health severity colors</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
  legend: {
    position: "absolute",
    top: 240,
    right: 20,
    backgroundColor: "rgba(26, 61, 46, 0.95)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  legendTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
  },
  legendSubtitle: {
    color: "#8BC4A9",
    fontWeight: "600",
    fontSize: 10,
    marginBottom: 4,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  legendIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  legendText: {
    color: "#8BC4A9",
    fontSize: 10,
  },
  legendNote: {
    color: "#8BC4A9",
    fontSize: 9,
    fontStyle: "italic",
    marginTop: 6,
  },
  legendDivider: {
    height: 1,
    backgroundColor: "#2ECC71",
    marginVertical: 8,
    opacity: 0.3,
  },
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
  locationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginRight: 6,
  },
  locationMarkerEmoji: {
    fontSize: 18,
  },
  toggleContainer: {
    position: "absolute",
    top: 140,
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
  // Loading state
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
  // Empty state (no detections)
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
});
