import React, { useEffect, useState } from "react";
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
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { DetectionItem, getDetections } from "./storage";

/* ===== MAP REGION FROM YOUR COORDINATES ===== */

const GAL_OYA_REGION = {
  latitude: 7.19,
  longitude: 81.46,
  latitudeDelta: 0.35,
  longitudeDelta: 0.3,
};

/* ===== BOUNDARY FROM YOUR 4 CORNERS ===== */

const GAL_OYA_BOUNDARY = [
  { latitude: 7.336537, longitude: 81.347783 }, // Top Left
  { latitude: 7.343215, longitude: 81.567667 }, // Top Right
  { latitude: 7.042637, longitude: 81.578346 }, // Bottom Right
  { latitude: 7.040217, longitude: 81.353147 }, // Bottom Left
];

export default function DetectionMapScreen() {
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<DetectionItem | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    getDetections().then((data) => {
      const filtered = data.filter((d) => d.latitude && d.longitude);
      setDetections(filtered);
    });

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const liveDetections = detections.filter((d) => d.mode === "live");
  const recordedDetections = detections.filter((d) => d.mode === "recorded");
  const avgConfidence =
    detections.length > 0
      ? Math.round(
          detections.reduce((sum, d) => sum + d.confidence, 0) /
            detections.length
        )
      : 0;

  const getMarkerColor = (mode: string) => {
    return mode === "live" ? "#2ECC71" : "#9B59B6";
  };

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
          {/* Park boundary */}
          <Polygon
            coordinates={GAL_OYA_BOUNDARY}
            strokeColor="#2ECC71"
            strokeWidth={3}
            fillColor="rgba(46, 204, 113, 0.15)"
          />

          {/* Hotspot markers */}
          {detections.map((item) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: item.latitude!,
                longitude: item.longitude!,
              }}
              pinColor={getMarkerColor(item.mode)}
              onPress={() => setSelectedMarker(item)}
            >
              <View
                style={[
                  styles.customMarker,
                  {
                    backgroundColor: getMarkerColor(item.mode),
                  },
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
                  <Text style={styles.calloutText}>Date: {item.date}</Text>
                  <Text style={styles.calloutText}>
                    Confidence: {item.confidence}%
                  </Text>
                  <Text style={styles.calloutText}>
                    Frequency: {item.frequency}
                  </Text>
                  <Text style={styles.calloutText}>
                    Distance: {item.distance}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Legend */}
        <Animated.View style={[styles.legend, { opacity: fadeAnim }]}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>Legend</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#2ECC71" }]} />
            <Text style={styles.legendText}>Live Detection</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#9B59B6" }]} />
            <Text style={styles.legendText}>Recorded Audio</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLine} />
            <Text style={styles.legendText}>Park Boundary</Text>
          </View>
        </Animated.View>

        {/* Statistics Card */}
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
                <Text style={[styles.statValue, { color: "#2ECC71" }]}>
                  {liveDetections.length}
                </Text>
                <Text style={styles.statLabel}>Live</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#9B59B6" }]}>
                  {recordedDetections.length}
                </Text>
                <Text style={styles.statLabel}>Recorded</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{avgConfidence}%</Text>
                <Text style={styles.statLabel}>Avg. Conf.</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>🐆</Text>
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Detection Details</Text>
              <Text style={styles.infoDate}>{selectedMarker.date}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMarker(null)}
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
                        selectedMarker.mode === "live" ? "#1A3D2E" : "#2C1A3D",
                    },
                  ]}
                >
                  <Text style={styles.infoBadgeText}>
                    {selectedMarker.mode === "live" ? "🎙️ Live" : "📁 Recorded"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Confidence</Text>
                <Text style={styles.infoValueLarge}>
                  {selectedMarker.confidence}%
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Frequency</Text>
                <Text style={styles.infoValue}>{selectedMarker.frequency}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>{selectedMarker.distance}</Text>
              </View>
            </View>

            <View style={styles.coordinatesContainer}>
              <Text style={styles.infoLabel}>Coordinates</Text>
              <Text style={styles.coordinatesText}>
                {selectedMarker.latitude?.toFixed(6)},{" "}
                {selectedMarker.longitude?.toFixed(6)}
              </Text>
            </View>
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
            Detection locations will appear on the map once you start recording
            leopard sounds
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

  // Header
  header: {
    backgroundColor: "#0F2F23",
    paddingTop: 50,
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

  // Map Container
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },

  // Custom Marker
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

  // Callout
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

  // Legend
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

  // Statistics Card
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

  // Info Card
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

  // Empty State
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