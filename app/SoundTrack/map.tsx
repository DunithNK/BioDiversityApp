import {
  AlertDetail,
  AlertListItem,
  getAlertDetail,
  getAlerts,
} from "@/services/alerts";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Callout,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from "react-native-maps";

const GAL_OYA_REGION = {
  latitude: 7.19,
  longitude: 81.46,
  latitudeDelta: 0.35,
  longitudeDelta: 0.3,
};

const GAL_OYA_BOUNDARY = [
  { latitude: 7.336537, longitude: 81.347783 },
  { latitude: 7.343215, longitude: 81.567667 },
  { latitude: 7.042637, longitude: 81.578346 },
  { latitude: 7.040217, longitude: 81.353147 },
];

export default function DetectionMapScreen() {
  const [detections, setDetections] = useState<AlertListItem[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<AlertListItem | null>(
    null,
  );
  const [selectedMarkerDetail, setSelectedMarkerDetail] =
    useState<AlertDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await getAlerts();

        const filtered = data.filter(
          (d) => d.location?.latitude != null && d.location?.longitude != null,
        );

        setDetections(filtered);
      } catch (error) {
        console.error("Failed to load alerts:", error);
        setDetections([]);
      }
    };

    loadAlerts();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleMarkerPress = async (item: AlertListItem) => {
    setSelectedMarker(item);
    setSelectedMarkerDetail(null);
    setLoadingDetail(true);

    try {
      const detail = await getAlertDetail(item.alert_id);
      setSelectedMarkerDetail(detail);
    } catch (error) {
      console.error("Failed to load alert detail:", error);
      setSelectedMarkerDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const criticalDetections = detections.filter(
    (d) => d.severity?.toLowerCase() === "critical",
  );
  const highDetections = detections.filter(
    (d) => d.severity?.toLowerCase() === "high",
  );
  const mediumDetections = detections.filter(
    (d) => d.severity?.toLowerCase() === "medium",
  );
  const lowDetections = detections.filter(
    (d) => d.severity?.toLowerCase() === "low",
  );

  const getSeverityColor = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "#E74C3C";
      case "high":
        return "#F39C12";
      case "medium":
        return "#F1C40F";
      case "low":
        return "#2ECC71";
      default:
        return "#95A5A6";
    }
  };

  const formatConfidence = (confidence?: number | null) => {
    if (confidence == null) return "N/A";
    return `${Math.round(confidence <= 1 ? confidence * 100 : confidence)}%`;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.iconText}>🗺️</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Gal Oya National Park</Text>
            <Text style={styles.subtitle}>Leopard Detection Hotspots</Text>
          </View>
          <TouchableOpacity
            style={styles.statsToggle}
            onPress={() => setShowStats(!showStats)}
          >
            <Text style={styles.statsToggleText}>
              {showStats ? "📊" : "📈"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={GAL_OYA_REGION}
          scrollEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          zoomEnabled
          zoomTapEnabled
          minZoomLevel={11}
          maxZoomLevel={16}
          mapType="hybrid"
        >
          <Polygon
            coordinates={GAL_OYA_BOUNDARY}
            strokeColor="#2ECC71"
            strokeWidth={3}
            fillColor="rgba(46, 204, 113, 0.15)"
          />

          {detections.map((item) => (
            <Marker
              key={item.alert_id}
              coordinate={{
                latitude: item.location!.latitude!,
                longitude: item.location!.longitude!,
              }}
              pinColor={getSeverityColor(item.mode)}
              onPress={() => handleMarkerPress(item)}
            >
              <View
                style={[
                  styles.customMarker,
                  { backgroundColor: getSeverityColor(item.mode) },
                ]}
              >
                <Text style={styles.markerIcon}>
                  {item.mode === "live" ? "🎙️" : "📁"}
                </Text>
              </View>

              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>Leopard Detected</Text>
                  <Text style={styles.calloutText}>
                    Mode: {item.mode === "live" ? "Live" : "Recorded"}
                  </Text>
                  <Text style={styles.calloutText}>
                    Date:{" "}
                    {item.detected_at
                      ? new Date(item.detected_at).toLocaleString()
                      : "Unknown date"}
                  </Text>
                  <Text style={styles.calloutText}>
                    Severity: {item.severity ?? "N/A"}
                  </Text>
                  <Text style={styles.calloutText}>
                    Status: {item.status ?? "N/A"}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        <Animated.View style={[styles.legend, { opacity: fadeAnim }]}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>Legend</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E74C3C" }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F39C12" }]} />
            <Text style={styles.legendText}>High</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F1C40F" }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#2ECC71" }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={styles.legendLine} />
            <Text style={styles.legendText}>Park Boundary</Text>
          </View>
        </Animated.View>

        {showStats && (
          <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
            <Text style={styles.statsTitle}>Detection Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{detections.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#E74C3C" }]}>
                  {criticalDetections.length}
                </Text>
                <Text style={styles.statLabel}>Critical</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#F39C12" }]}>
                  {highDetections.length}
                </Text>
                <Text style={styles.statLabel}>High</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#F1C40F" }]}>
                  {mediumDetections.length}
                </Text>
                <Text style={styles.statLabel}>Medium</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#2ECC71" }]}>
                  {lowDetections.length}
                </Text>
                <Text style={styles.statLabel}>Low</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {selectedMarker && (
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>🐆</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Detection Details</Text>
              <Text style={styles.infoDate}>
                {selectedMarker.detected_at
                  ? new Date(selectedMarker.detected_at).toLocaleString()
                  : "Unknown date"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSelectedMarker(null);
                setSelectedMarkerDetail(null);
              }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContent}>
            {loadingDetail ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#2ECC71" />
                <Text style={{ color: "#8BC4A9", marginTop: 10 }}>
                  Loading details...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Mode</Text>
                    <View
                      style={[
                        styles.infoBadge,
                        {
                          backgroundColor:
                            selectedMarker.mode === "live"
                              ? "#1A3D2E"
                              : "#2C1A3D",
                        },
                      ]}
                    >
                      <Text style={styles.infoBadgeText}>
                        {selectedMarker.mode === "live"
                          ? "🎙️ Live"
                          : "📁 Recorded"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Confidence</Text>
                    <Text style={styles.infoValueLarge}>
                      {formatConfidence(selectedMarkerDetail?.confidence)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Distance</Text>
                    <Text style={styles.infoValue}>
                      {"~ " +
                        selectedMarkerDetail?.distance.estimated_m +
                        " meter"}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Severity</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color: getSeverityColor(
                            selectedMarkerDetail?.severity ??
                              selectedMarker.severity,
                          ),
                        },
                      ]}
                    >
                      {selectedMarkerDetail?.severity ??
                        selectedMarker.severity ??
                        "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={styles.infoValue}>
                      {selectedMarkerDetail?.status ??
                        selectedMarker.status ??
                        "N/A"}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Risk Score</Text>
                    <Text style={styles.infoValue}>
                      {selectedMarkerDetail?.risk_score ?? "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.coordinatesContainer}>
                  <Text style={styles.infoLabel}>Coordinates</Text>
                  <Text style={styles.coordinatesText}>
                    {selectedMarker.location?.latitude?.toFixed(6)},{" "}
                    {selectedMarker.location?.longitude?.toFixed(6)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      )}

      {detections.length === 0 && (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
          </View>
          <Text style={styles.emptyTitle}>No Detections Yet</Text>
          <Text style={styles.emptyText}>
            Detection locations will appear on the map once alerts are available
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },

  header: {
    backgroundColor: "#0F2F23",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1A3D2E",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  iconText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#8BC4A9",
  },
  statsToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
  },
  statsToggleText: {
    fontSize: 20,
  },

  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },

  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 18,
  },

  callout: {
    padding: 10,
    minWidth: 180,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#0A1F17",
  },
  calloutText: {
    fontSize: 12,
    color: "#1A3D2E",
    marginBottom: 2,
  },

  legend: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#0F2F23",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#1A3D2E",
    minWidth: 150,
  },
  legendHeader: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3D2E",
  },
  legendTitle: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  legendLine: {
    width: 20,
    height: 3,
    backgroundColor: "#2ECC71",
    marginRight: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: "#8BC4A9",
  },

  statsCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  statsTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#1A3D2E",
  },
  statValue: {
    fontSize: 20,
    color: "#2ECC71",
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#8BC4A9",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2ECC71",
    overflow: "hidden",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#123B2C",
    borderBottomWidth: 1,
    borderBottomColor: "#1A3D2E",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 2,
  },
  infoDate: {
    fontSize: 12,
    color: "#8BC4A9",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    color: "#8BC4A9",
    fontWeight: "bold",
  },
  infoContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#8BC4A9",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  infoBadgeText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  infoValueLarge: {
    fontSize: 20,
    color: "#2ECC71",
    fontWeight: "bold",
  },
  coordinatesContainer: {
    backgroundColor: "#1A3D2E",
    padding: 10,
    borderRadius: 10,
  },
  coordinatesText: {
    fontSize: 13,
    color: "#8BC4A9",
    fontFamily: "monospace",
  },

  emptyState: {
    position: "absolute",
    top: "30%",
    left: 40,
    right: 40,
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
    lineHeight: 20,
  },
});
