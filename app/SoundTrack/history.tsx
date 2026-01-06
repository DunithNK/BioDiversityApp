import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DetectionItem, getDetections } from "./storage";

export default function DetectionHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<DetectionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "live" | "recorded">("all");

  const loadHistory = async () => {
    const data = await getDetections();
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    return item.mode === filter;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "#2ECC71";
    if (confidence >= 60) return "#F39C12";
    return "#E74C3C";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.iconBadge}>
            <Text style={styles.headerIcon}>📋</Text>
          </View>
        </View>
        <Text style={styles.title}>Detection History</Text>
        <Text style={styles.subtitle}>
          {history.length} {history.length === 1 ? "detection" : "detections"} recorded
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === "all" && styles.activeFilter]}
          onPress={() => setFilter("all")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.activeFilterText,
            ]}
          >
            All ({history.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === "live" && styles.activeFilter]}
          onPress={() => setFilter("live")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              filter === "live" && styles.activeFilterText,
            ]}
          >
            🎙️ Live ({history.filter((h) => h.mode === "live").length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "recorded" && styles.activeFilter,
          ]}
          onPress={() => setFilter("recorded")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              filter === "recorded" && styles.activeFilterText,
            ]}
          >
            📁 Recorded ({history.filter((h) => h.mode === "recorded").length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2ECC71"
            colors={["#2ECC71"]}
          />
        }
      >
        {filteredHistory.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "No Detections Yet"
                : `No ${filter} detections`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Start listening to leopard sounds to see detections here"
                : `No ${filter} detections found. Try a different filter.`}
            </Text>
            {filter !== "all" && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setFilter("all")}
              >
                <Text style={styles.emptyButtonText}>Show All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {filteredHistory.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.card,
              index === 0 && styles.firstCard,
              index === filteredHistory.length - 1 && styles.lastCard,
            ]}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.modeContainer}>
                <View
                  style={[
                    styles.modeBadge,
                    item.mode === "live"
                      ? styles.liveBadge
                      : styles.recordedBadge,
                  ]}
                >
                  <Text style={styles.modeIcon}>
                    {item.mode === "live" ? "🎙️" : "📁"}
                  </Text>
                  <Text style={styles.modeText}>
                    {item.mode === "live" ? "Live" : "Recorded"}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor: `${getConfidenceColor(item.confidence)}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.confidenceText,
                    { color: getConfidenceColor(item.confidence) },
                  ]}
                >
                  {item.confidence}%
                </Text>
              </View>
            </View>

            {/* Species Info */}
            <View style={styles.speciesSection}>
              <Text style={styles.speciesIcon}>🐆</Text>
              <View style={styles.speciesTextContainer}>
                <Text style={styles.speciesName}>Sri Lankan Leopard</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>

            {/* Detection Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>〰️</Text>
                <View>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>{item.frequency}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <View>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>{item.distance}</Text>
                </View>
              </View>
            </View>

            {/* Location (if available) */}
            {item.latitude && item.longitude && (
              <View style={styles.locationContainer}>
                <Text style={styles.locationIcon}>🌍</Text>
                <Text style={styles.locationText}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            {/* Confidence Level Indicator */}
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${item.confidence}%`,
                    backgroundColor: getConfidenceColor(item.confidence),
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.confidenceLabel,
                { color: getConfidenceColor(item.confidence) },
              ]}
            >
              {getConfidenceLabel(item.confidence)} Confidence
            </Text>
          </View>
        ))}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.newDetectionBtn}
          onPress={() => router.push("/SoundTrack")}
          activeOpacity={0.9}
        >
          <Text style={styles.newDetectionText}>+ New Detection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
    paddingTop: 40,
  },

  // Header Styles
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTop: {
    marginBottom: 12,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2ECC71",
  },
  headerIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#0F2F23",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  activeFilter: {
    backgroundColor: "#123B2C",
    borderColor: "#2ECC71",
  },
  filterText: {
    fontSize: 13,
    color: "#8BC4A9",
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#2ECC71",
  },

  // Scroll View
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0F2F23",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#8BC4A9",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#2ECC71",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#0A1F17",
    fontWeight: "bold",
    fontSize: 15,
  },

  // History Cards
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A3D2E",
  },
  firstCard: {
    marginTop: 0,
  },
  lastCard: {
    marginBottom: 0,
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  liveBadge: {
    backgroundColor: "#1A3D2E",
  },
  recordedBadge: {
    backgroundColor: "#2C1A3D",
  },
  modeIcon: {
    fontSize: 16,
  },
  modeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  confidenceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "bold",
  },

  // Species Section
  speciesSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3D2E",
  },
  speciesIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  speciesTextContainer: {
    flex: 1,
  },
  speciesName: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: "#8BC4A9",
  },

  // Details Row
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  detailDivider: {
    width: 1,
    backgroundColor: "#1A3D2E",
    marginHorizontal: 12,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailLabel: {
    fontSize: 11,
    color: "#8BC4A9",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Location
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 12,
    color: "#8BC4A9",
    fontFamily: "monospace",
  },

  // Confidence Bar
  confidenceBar: {
    height: 6,
    backgroundColor: "#1A3D2E",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },

  // Bottom Spacing
  bottomSpacer: {
    height: 20,
  },

  // Action Buttons
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1A3D2E",
  },
  newDetectionBtn: {
    flex: 2,
    backgroundColor: "#2ECC71",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newDetectionText: {
    textAlign: "center",
    color: "#0A1F17",
    fontWeight: "bold",
    fontSize: 16,
  },
  backBtn: {
    flex: 1,
    backgroundColor: "#0F2F23",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  backText: {
    textAlign: "center",
    color: "#2ECC71",
    fontWeight: "600",
    fontSize: 16,
  },
});