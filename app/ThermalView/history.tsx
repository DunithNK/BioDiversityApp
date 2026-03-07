import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { API_CONFIG } from "@/constants/api";

interface HistoryItem {
  analysis_id: string;
  timestamp: string;
  tsi: number;
  health_status: string;
  leopard_mean_temp: number;
}

export default function HistoryScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/history`);
      const data = await response.json();

      if (data.success && data.history) {
        setHistoryData(data.history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Logic to determine color based on health status and TSI
  const getStatusColor = (healthStatus: string, tsi: number) => {
    if (healthStatus.includes("Normal")) return "#27AE60";
    if (healthStatus.includes("Mild")) return "#F39C12";
    if (healthStatus.includes("Moderate")) return "#E67E22";
    if (healthStatus.includes("Critical")) return "#E74C3C";

    // Fallback to TSI-based coloring
    if (tsi <= 0.05) return "#27AE60";
    if (tsi <= 0.10) return "#F39C12";
    if (tsi <= 0.15) return "#E67E22";
    return "#E74C3C";
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={{ color: "#4A6741", marginTop: 10 }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Thermal History</Text>
          <Text style={styles.subtitle}>
            {historyData.length} Analysis Records
          </Text>
        </View>

        {historyData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No analysis history yet</Text>
            <Text style={styles.emptySubtext}>Upload a thermal image to get started</Text>
          </View>
        ) : (
          <FlatList
            data={historyData}
            keyExtractor={(item) => item.analysis_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#27AE60"
              />
            }
            renderItem={({ item }) => {
              const statusColor = getStatusColor(item.health_status, item.tsi);

              return (
                <Pressable
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "ThermalView/historyDetail",
                      params: {
                        species: "Sri Lankan Leopard",
                        tsi: item.tsi.toString(),
                        date: formatDate(item.timestamp),
                        status: item.health_status,
                        temp: item.leopard_mean_temp.toString(),
                      },
                    })
                  }
                >
                  <View style={styles.cardTop}>
                    <View style={styles.speciesContainer}>
                      <Text style={styles.speciesIcon}>🐆</Text>
                      <View>
                        <Text style={styles.speciesName}>Sri Lankan Leopard</Text>
                        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.tsiBadge,
                        {
                          backgroundColor: statusColor + "18",
                          borderColor: statusColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tsiValue,
                          { color: statusColor },
                        ]}
                      >
                        TSI: {item.tsi.toFixed(4)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <Text style={[styles.statusValue, { color: statusColor }]}>
                      {item.health_status}
                    </Text>
                  </View>

                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Temperature:</Text>
                    <Text style={styles.statusValueDark}>
                      {item.leopard_mean_temp.toFixed(2)}°C
                    </Text>
                  </View>

                  {/* Subtle Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(item.tsi * 400, 100)}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Accent Bar */}
                  <View
                    style={[
                      styles.accentBar,
                      { backgroundColor: statusColor },
                    ]}
                  />
                </Pressable>
              );
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0A1F17",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#4A6741",
    marginTop: 4,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  speciesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  speciesIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  speciesName: {
    color: "#0A1F17",
    fontSize: 16,
    fontWeight: "700",
  },
  dateText: {
    color: "#7F8C8D",
    fontSize: 12,
    fontWeight: "600",
  },
  tsiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tsiValue: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginTop: 10,
    width: "100%",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.6,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    color: "#7F8C8D",
    fontSize: 13,
    fontWeight: "600",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusValueDark: {
    color: "#2C3E50",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A1F17",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#4A6741",
    textAlign: "center",
  },
});