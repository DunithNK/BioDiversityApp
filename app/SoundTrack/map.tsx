import { getHistory, type HistoryItem } from "@/services/history";
import {
  getTrackedLiveSessions,
  type TrackingPoint,
} from "@/services/trackingSessions";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, {
  Callout,
  Marker,
  Polygon,
  Polyline,
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

type LeopardDetection = {
  id: string;
  sessionId: number;
  mode: "live" | "recorded";
  formattedDate: string;
  rawDate: Date;
  confidence: number;
  location?: { latitude: number; longitude: number };
  trackedPath: TrackingPoint[];
  distance?: HistoryItem["distance"];
};

const PATH_COLORS = [
  "#F97316", "#3B82F6", "#8B5CF6", "#EF4444",
  "#EC4899", "#06B6D4", "#84CC16",
];

export default function DetectionMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [detections, setDetections] = useState<LeopardDetection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<LeopardDetection | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isMapLocked, setIsMapLocked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyData, trackedSessions] = await Promise.all([
          getHistory(),
          getTrackedLiveSessions(),
        ]);

        const leopardItems = historyData
          .filter((item) => item.is_leopard)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );

        const mapped: LeopardDetection[] = leopardItems.map((item) => {
          const confidenceRaw = item.confidence ?? 0;
          const confidence =
            confidenceRaw <= 1
              ? Math.round(confidenceRaw * 100)
              : Math.round(confidenceRaw);

          const trackedPath =
            item.source === "live"
              ? trackedSessions.find((s) => s.liveSessionId === item.id)?.points ?? []
              : [];

          const lat = item.location?.latitude;
          const lon = item.location?.longitude;

          return {
            id: `${item.source}-${item.id}`,
            sessionId: item.id,
            mode: item.source === "live" ? "live" : "recorded",
            formattedDate: new Date(item.created_at).toLocaleString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: new Date(item.created_at),
            confidence,
            location:
              lat != null && lon != null
                ? { latitude: lat, longitude: lon }
                : undefined,
            trackedPath,
            distance: item.distance ?? null,
          };
        });

        setDetections(mapped);

        // Collect all coordinates to fit the map view
        const allCoords: { latitude: number; longitude: number }[] = [];
        for (const d of mapped) {
          for (const pt of d.trackedPath) {
            allCoords.push({ latitude: pt.latitude, longitude: pt.longitude });
          }
          if (d.location) {
            allCoords.push(d.location);
          }
        }
        if (allCoords.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(allCoords, {
              edgePadding: { top: 80, right: 60, bottom: 180, left: 60 },
              animated: true,
            });
          }, 600);
        }
      } catch (error) {
        console.error("Failed to load detection history:", error);
        setDetections([]);
      }
    };

    loadData();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "#DC2626";
    if (confidence >= 60) return "#D97706";
    if (confidence >= 40) return "#CA8A04";
    return "#16A34A";
  };

  const formatConfidence = (confidence: number) => `${confidence}%`;

  const liveCount = detections.filter((d) => d.mode === "live").length;
  const recordedCount = detections.filter((d) => d.mode === "recorded").length;
  const withPathCount = detections.filter((d) => d.trackedPath.length > 1).length;

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={GAL_OYA_REGION}
          scrollEnabled={!isMapLocked}
          rotateEnabled={!isMapLocked}
          pitchEnabled={!isMapLocked}
          zoomEnabled={!isMapLocked}
          zoomTapEnabled={!isMapLocked}
          mapType="hybrid"
        >
          {/* Park boundary */}
          <Polygon
            coordinates={GAL_OYA_BOUNDARY}
            strokeColor="#16A34A"
            strokeWidth={3}
            fillColor="rgba(22, 163, 74, 0.15)"
          />

          {detections.map((detection, detIndex) => {
            const pathColor = PATH_COLORS[detIndex % PATH_COLORS.length];

            const startCoord =
              detection.trackedPath.length > 0
                ? {
                    latitude: detection.trackedPath[0].latitude,
                    longitude: detection.trackedPath[0].longitude,
                  }
                : detection.location ?? null;

            const endPoint =
              detection.trackedPath.length > 1
                ? detection.trackedPath[detection.trackedPath.length - 1]
                : null;

            const waypoints = detection.trackedPath.slice(1, -1);

            return (
              <React.Fragment key={detection.id}>
                {/* Tracked GPS path */}
                {detection.trackedPath.length > 1 && (
                  <Polyline
                    coordinates={detection.trackedPath.map((p) => ({
                      latitude: p.latitude,
                      longitude: p.longitude,
                    }))}
                    strokeColor={pathColor}
                    strokeWidth={3}
                    lineDashPattern={[8, 4]}
                  />
                )}

                {/* Waypoint dots */}
                {waypoints.map((pt, ptIdx) => (
                  <Marker
                    key={`${detection.id}-wp-${ptIdx}`}
                    coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={[styles.waypointDot, { backgroundColor: pathColor }]} />
                  </Marker>
                ))}

                {/* START / detection marker */}
                {startCoord && (
                  <Marker
                    key={`${detection.id}-start`}
                    coordinate={startCoord}
                    onPress={() => setSelectedDetection(detection)}
                  >
                    <View style={[styles.customMarker, { backgroundColor: pathColor }]}>
                      <Text style={styles.markerSequence}>{detIndex + 1}</Text>
                    </View>
                    <Callout>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>🐆 Leopard Detected</Text>
                        <Text style={styles.calloutDate}>
                          📅{" "}
                          {detection.rawDate.toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                        <Text style={styles.calloutDate}>
                          🕐{" "}
                          {detection.rawDate.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                        <Text style={styles.calloutText}>
                          #{detIndex + 1} ·{" "}
                          {detection.mode === "live" ? "🎙️ Live" : "📁 Recorded"}
                        </Text>
                        <Text style={styles.calloutText}>
                          Confidence: {formatConfidence(detection.confidence)}
                        </Text>
                        {detection.trackedPath.length > 0 && (
                          <Text style={styles.calloutText}>
                            Path: {detection.trackedPath.length} pts
                          </Text>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                )}

                {/* END marker */}
                {endPoint && (
                  <Marker
                    key={`${detection.id}-end`}
                    coordinate={{
                      latitude: endPoint.latitude,
                      longitude: endPoint.longitude,
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                    tracksViewChanges={false}
                  >
                    <View style={[styles.endMarker, { borderColor: pathColor }]}>
                      <Text style={styles.endMarkerText}>🏁</Text>
                    </View>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
        </MapView>

        {/* Map Lock Button */}
        <TouchableOpacity
          style={styles.mapLockButton}
          onPress={() => setIsMapLocked((prev) => !prev)}
        >
          <Text style={styles.mapLockButtonText}>
            {isMapLocked ? "🔒" : "↔️"}
          </Text>
        </TouchableOpacity>

        {/* Legend */}
        <Animated.View style={[styles.legend, { opacity: fadeAnim }]}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>Legend</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#DC2626" }]} />
            <Text style={styles.legendText}>High confidence</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#16A34A" }]} />
            <Text style={styles.legendText}>Low confidence</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDashLine} />
            <Text style={styles.legendText}>Movement path</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLine} />
            <Text style={styles.legendText}>Park boundary</Text>
          </View>
        </Animated.View>

        {/* Stats Card */}
        {showStats && !selectedDetection && (
          <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
            <Text style={styles.statsTitle}>Detection Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{detections.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                  {liveCount}
                </Text>
                <Text style={styles.statLabel}>Live</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#7C3AED" }]}>
                  {recordedCount}
                </Text>
                <Text style={styles.statLabel}>Recorded</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#F97316" }]}>
                  {withPathCount}
                </Text>
                <Text style={styles.statLabel}>Paths</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Detection Detail Card */}
      {selectedDetection && (
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>🐆</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Sri Lankan Leopard</Text>
              <Text style={styles.infoDate}>{selectedDetection.formattedDate}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedDetection(null)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Mode</Text>
                <View
                  style={[
                    styles.infoBadge,
                    {
                      backgroundColor:
                        selectedDetection.mode === "live" ? "#DCFCE7" : "#EDE9FE",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.infoBadgeText,
                      {
                        color:
                          selectedDetection.mode === "live" ? "#16A34A" : "#7C3AED",
                      },
                    ]}
                  >
                    {selectedDetection.mode === "live" ? "🎙️ Live" : "📁 Recorded"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Confidence</Text>
                <Text
                  style={[
                    styles.infoValueLarge,
                    { color: getConfidenceColor(selectedDetection.confidence) },
                  ]}
                >
                  {formatConfidence(selectedDetection.confidence)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {selectedDetection.distance?.estimated_m != null
                    ? `~ ${selectedDetection.distance.estimated_m} m`
                    : "N/A"}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Path Points</Text>
                <Text style={styles.infoValue}>
                  {selectedDetection.trackedPath.length > 0
                    ? `${selectedDetection.trackedPath.length} pts`
                    : "No path"}
                </Text>
              </View>
            </View>

            {selectedDetection.location && (
              <View style={styles.coordinatesContainer}>
                <Text style={styles.infoLabel}>Coordinates</Text>
                <Text style={styles.coordinatesText}>
                  {selectedDetection.location.latitude.toFixed(6)},{" "}
                  {selectedDetection.location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Empty State */}
      {detections.length === 0 && (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
          </View>
          <Text style={styles.emptyTitle}>No Detections Yet</Text>
          <Text style={styles.emptyText}>
            Leopard detection paths will appear here after a live session is
            completed
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  iconText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  statsToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statsToggleText: {
    fontSize: 20,
  },

  // Map
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },

  // Marker
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
  markerSequence: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Waypoint dot along a path
  waypointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  // End-of-path marker
  endMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  endMarkerText: {
    fontSize: 16,
  },

  // Callout
  callout: {
    padding: 10,
    minWidth: 180,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111827",
  },
  calloutDate: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },

  // Legend
  legend: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  legendHeader: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  legendTitle: {
    fontSize: 13,
    color: "#111827",
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
  legendDashLine: {
    width: 20,
    height: 3,
    backgroundColor: "#F97316",
    marginRight: 8,
    borderRadius: 2,
    borderStyle: "dashed",
  },
  legendLine: {
    width: 20,
    height: 3,
    backgroundColor: "#16A34A",
    marginRight: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Stats Card
  statsCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 14,
    color: "#111827",
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
    backgroundColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 20,
    color: "#16A34A",
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Info Card
  infoCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
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
    color: "#111827",
    fontWeight: "bold",
    marginBottom: 2,
  },
  infoDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  closeText: {
    fontSize: 16,
    color: "#6B7280",
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
    color: "#9CA3AF",
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
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  infoValueLarge: {
    fontSize: 20,
    color: "#16A34A",
    fontWeight: "bold",
  },
  coordinatesContainer: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  coordinatesText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "monospace",
  },

  // Empty State
  emptyState: {
    position: "absolute",
    top: "30%",
    left: 40,
    right: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // Map Lock Button
  mapLockButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapLockButtonText: {
    fontSize: 22,
  },
});