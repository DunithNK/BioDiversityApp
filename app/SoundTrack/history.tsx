import { getHistory } from "@/services/history";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DetectionItem = {
  id: string;
  mode: "live" | "recorded";
  date: string;
  latitude?: number;
  longitude?: number;
  frequency: string;

  distance?: {
    estimated_m?: number | null;
    min_m?: number | null;
    max_m?: number | null;
    confidence?: number | null;
  } | null;

  confidence: number;
  isLeopard: boolean;
};

export default function DetectionHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<DetectionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "live" | "recorded">("all");

  const loadHistory = async () => {
    try {
      const data = await getHistory();

      const mapped: DetectionItem[] = data.map((item) => {
        const confidenceRaw = item.confidence ?? 0;
        const confidence =
          confidenceRaw <= 1
            ? Math.round(confidenceRaw * 100)
            : Math.round(confidenceRaw);

        const latitude = item.location?.latitude ?? undefined;
        const longitude = item.location?.longitude ?? undefined;

        return {
          id: String(item.id),
          mode: item.source === "live_session" ? "live" : "recorded",
          date: item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "Unknown date",
          latitude,
          longitude,
          frequency: "N/A",
          distance: item.distance ?? null,
          confidence,
          isLeopard: !!item.is_leopard,
        };
      });

      setHistory(mapped);
    } catch (error) {
      console.error("Failed to load history:", error);
      setHistory([]);
    }
  };
  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const leopardHistory = useMemo(
    () => history.filter((item) => item.isLeopard),
    [history],
  );

  const liveCount = useMemo(
    () => leopardHistory.filter((h) => h.mode === "live").length,
    [leopardHistory],
  );

  const recordedCount = useMemo(
    () => leopardHistory.filter((h) => h.mode === "recorded").length,
    [leopardHistory],
  );

  const filteredHistory = leopardHistory.filter((item) => {
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.iconBadge}>
            <Text style={styles.headerIcon}>📋</Text>
          </View>
        </View>
        <Text style={styles.title}>Detection History</Text>
        <Text style={styles.subtitle}>
          {leopardHistory.length}{" "}
          {leopardHistory.length === 1 ? "detection" : "detections"} recorded
        </Text>
      </View>

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
            All ({leopardHistory.length})
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
            🎙️ Live ({liveCount})
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
            📁 Recorded ({recordedCount})
          </Text>
        </TouchableOpacity>
      </View>

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

            <View style={styles.speciesSection}>
              <Text style={styles.speciesIcon}>🐆</Text>
              <View style={styles.speciesTextContainer}>
                <Text style={styles.speciesName}>Sri Lankan Leopard</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>

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
                  <Text style={styles.detailValue}>
                    {item.distance?.min_m != null &&
                    item.distance?.max_m != null
                      ? `${Math.round(item.distance.min_m)} – ${Math.round(item.distance.max_m)} m`
                      : item.distance?.estimated_m != null
                        ? `${Math.round(item.distance.estimated_m)} m`
                        : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {item.latitude !== undefined && item.longitude !== undefined && (
              <View style={styles.locationContainer}>
                <Text style={styles.locationIcon}>🌍</Text>
                <Text style={styles.locationText}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </View>
            )}

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

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: "#0A1F17",
  },
  headerTop: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  headerIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#8BC4A9",
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    backgroundColor: "#0F2F23",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1A3D2E",
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#2ECC71",
    borderColor: "#2ECC71",
  },
  filterText: {
    color: "#8BC4A9",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  activeFilterText: {
    color: "#0A1F17",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#0F2F23",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#0A1F17",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1A3D2E",
  },
  firstCard: {
    marginTop: 4,
  },
  lastCard: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modeContainer: {
    flexDirection: "row",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveBadge: {
    backgroundColor: "#2ECC7120",
  },
  recordedBadge: {
    backgroundColor: "#3498DB20",
  },
  modeIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  modeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  confidenceText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  speciesSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  speciesIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  speciesTextContainer: {
    flex: 1,
  },
  speciesName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateText: {
    color: "#8BC4A9",
    fontSize: 13,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#0A1F17",
    borderRadius: 14,
    padding: 14,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  detailLabel: {
    color: "#8BC4A9",
    fontSize: 11,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  detailDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#1A3D2E",
    marginHorizontal: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#0A1F17",
    borderRadius: 12,
    padding: 12,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    color: "#8BC4A9",
    fontSize: 13,
    fontWeight: "500",
  },
  confidenceBar: {
    height: 8,
    backgroundColor: "#1A3D2E",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  bottomSpacer: {
    height: 90,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#0A1F17",
    borderTopWidth: 1,
    borderTopColor: "#1A3D2E",
  },
  newDetectionBtn: {
    flex: 1,
    backgroundColor: "#2ECC71",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  newDetectionText: {
    color: "#0A1F17",
    fontWeight: "bold",
    fontSize: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#2ECC71",
    fontWeight: "bold",
    fontSize: 16,
  },
});
