import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

type AlertItem = {
  alert_id: string;
  time: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
};

const BACKEND_URL = "http://172.20.10.13:8000";

export default function AlertHistory() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filtered, setFiltered] = useState<AlertItem[]>([]);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

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

  /* ---------------- Fetch Alerts ---------------- */

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/alerts`);
      const data = await res.json();
      setAlerts(data);
      setFiltered(data);
    } catch {
      Alert.alert("Error", "Failed to load alert history");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  /* ---------------- Filters ---------------- */

  const applyLastDays = (days: number) => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    const result = alerts.filter((a) => {
      const t = new Date(a.time);
      return t >= cutoff && t <= now;
    });

    setFiltered(result);
  };

  const applyCustomRange = () => {
    if (!fromDate || !toDate) {
      Alert.alert("Validation", "Select both From and To dates");
      return;
    }

    if (fromDate > toDate) {
      Alert.alert("Validation", "From date cannot be after To date");
      return;
    }

    const result = alerts.filter((a) => {
      const t = new Date(a.time);
      return t >= fromDate && t <= toDate;
    });

    setFiltered(result);
  };

  const resetFilters = () => {
    setFiltered(alerts);
    setFromDate(null);
    setToDate(null);
  };

  /* ---------------- Render ---------------- */

  const renderItem = ({ item, index }: { item: AlertItem; index: number }) => (
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
        style={styles.item}
        onPress={() =>
          router.push(`/leoTrack/result?alertId=${item.alert_id}` as any)
        }
        activeOpacity={0.85}
      >
        <View style={styles.itemHeader}>
          <View
            style={[
              styles.itemIconContainer,
              {
                backgroundColor:
                  item.source === "Camera" ? "#1A3D2E" : "#1A2E3D",
              },
            ]}
          >
            <Text style={styles.itemIcon}>
              {item.source === "Camera" ? "📷" : "🖼️"}
            </Text>
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>
              Leopard via {item.source}
            </Text>
            <View style={styles.itemBadge}>
              <View style={styles.itemBadgeDot} />
              <Text style={styles.itemBadgeText}>Recorded</Text>
            </View>
          </View>
          <Text style={styles.itemArrow}>→</Text>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemDetail}>
            <Text style={styles.itemDetailIcon}>🕒</Text>
            <Text style={styles.itemDetailText}>
              {new Date(item.time).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View style={styles.itemDetail}>
            <Text style={styles.itemDetailIcon}>📍</Text>
            <Text style={styles.itemDetailText}>
              {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E
            </Text>
          </View>
        </View>

        {/* Accent bar */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor:
                item.source === "Camera" ? "#2ECC71" : "#3498DB",
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );

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
              <Text style={styles.headerIcon}>📜</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Alert History</Text>
          <Text style={styles.headerSubtitle}>
            View and filter past leopard sightings
          </Text>

          {/* Stats Badge */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{alerts.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{filtered.length}</Text>
              <Text style={styles.statLabel}>Filtered</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Filters */}
        <Animated.View
          style={[
            styles.filtersSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Filters</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => applyLastDays(7)}
              activeOpacity={0.85}
            >
              <Text style={styles.filterIcon}>📅</Text>
              <Text style={styles.filterText}>Last 7 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => applyLastDays(30)}
              activeOpacity={0.85}
            >
              <Text style={styles.filterIcon}>📆</Text>
              <Text style={styles.filterText}>Last 30 Days</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Date Range */}
        <Animated.View
          style={[
            styles.dateSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Custom Date Range</Text>
          
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFromPicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>
                {fromDate
                  ? fromDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Select"}
              </Text>
            </TouchableOpacity>

            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>→</Text>
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowToPicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>
                {toDate
                  ? toDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Select"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyCustomRange}
              activeOpacity={0.85}
            >
              <Text style={styles.applyText}>Apply Range</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
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
            <Text style={styles.sectionTitle}>Recorded Alerts</Text>
            {filtered.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filtered.length}</Text>
              </View>
            )}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Alerts Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filter criteria
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.alert_id}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
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
            🔒 Secure historical data storage
          </Text>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate ?? new Date()}
          mode="date"
          onChange={(_, d) => {
            setShowFromPicker(false);
            if (d) setFromDate(d);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate ?? new Date()}
          mode="date"
          onChange={(_, d) => {
            setShowToPicker(false);
            if (d) setToDate(d);
          }}
        />
      )}
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
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
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2ECC71",
  },
  headerIcon: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    backgroundColor: "#0F2F23",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1A3D2E",
  },
  statValue: {
    fontSize: 22,
    color: "#2ECC71",
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#8BC4A9",
  },

  // Filters Section
  filtersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#0F2F23",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  filterIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  filterText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

  // Date Section
  dateSection: {
    backgroundColor: "#0F2F23",
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#1A3D2E",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  dateLabel: {
    fontSize: 11,
    color: "#8BC4A9",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dateSeparator: {
    paddingHorizontal: 12,
  },
  dateSeparatorText: {
    fontSize: 20,
    color: "#2ECC71",
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  applyButton: {
    flex: 2,
    backgroundColor: "#2ECC71",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3FDD81",
  },
  applyText: {
    color: "#022C22",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#1A3D2E",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  resetText: {
    color: "#2ECC71",
    fontWeight: "600",
    fontSize: 15,
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
  countBadge: {
    backgroundColor: "#1A3D2E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  countText: {
    color: "#2ECC71",
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    gap: 12,
  },

  // Alert Item
  item: {
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#1A3D2E",
    position: "relative",
    overflow: "hidden",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
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
    backgroundColor: "#2ECC71",
    marginRight: 6,
  },
  itemBadgeText: {
    fontSize: 11,
    color: "#8BC4A9",
    fontWeight: "600",
  },
  itemArrow: {
    fontSize: 22,
    color: "#2ECC71",
    fontWeight: "bold",
  },
  itemDetails: {
    gap: 8,
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
    color: "#8BC4A9",
    lineHeight: 18,
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
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
  },

  // Close Button
  closeButton: {
    backgroundColor: "#F59E0B",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FBBF24",
    marginBottom: 24,
  },
  closeText: {
    color: "#451A03",
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
    backgroundColor: "#1A3D2E",
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#6B9F88",
    textAlign: "center",
  },
});