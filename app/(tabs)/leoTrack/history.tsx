import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AlertItem = {
  alert_id: string;
  timestamp: string;
  source: "Camera" | "Gallery";
  latitude: number;
  longitude: number;
  status: "active" | "released";
  released_at?: string | null;
};

type AssessmentMap = Record<string, { severity: string; score: number }>;

const BACKEND_URL = "http://192.168.1.3:8000";

type TabType = "active" | "released";

export default function AlertHistory() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("active");

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [releasedAlerts, setReleasedAlerts] = useState<AlertItem[]>([]);
  const [filtered, setFiltered] = useState<AlertItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentMap>({});
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  /* ---------------- Animations ---------------- */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  /* ---------------- Fetch ---------------- */
  const fetchAlerts = async () => {
    try {
      setLoading(true);

      const [activeRes, releasedRes] = await Promise.all([
        fetch(`${BACKEND_URL}/alerts`),
        fetch(`${BACKEND_URL}/alerts/released`),
      ]);

      if (!activeRes.ok || !releasedRes.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const activeData: AlertItem[] = await activeRes.json();
      const releasedData: AlertItem[] = await releasedRes.json();

      if (!Array.isArray(activeData) || !Array.isArray(releasedData)) {
        Alert.alert("Error", "Invalid data format from server");
        return;
      }

      const sortedActive = activeData.sort(
        (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );
      const sortedReleased = releasedData.sort(
        (a, b) =>
          new Date(b.released_at || b.timestamp || 0).getTime() -
          new Date(a.released_at || a.timestamp || 0).getTime()
      );

      setAlerts(sortedActive);
      setFiltered(sortedActive);
      setReleasedAlerts(sortedReleased);

      // Fetch assessments for released alerts
      const assessmentMap: AssessmentMap = {};
      await Promise.all(
        sortedReleased.map(async (a) => {
          try {
            const res = await fetch(`${BACKEND_URL}/assessment/${a.alert_id}`);
            if (res.ok) {
              const data = await res.json();
              assessmentMap[a.alert_id] = { severity: data.severity, score: data.score };
            }
          } catch {
            // assessment may not exist
          }
        })
      );
      setAssessments(assessmentMap);
    } catch (error) {
      console.error("Fetch alerts error:", error);
      Alert.alert("Connection Error", "Failed to load alert history. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  /* ---------------- Helpers ---------------- */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "Low": return "#2ECC71";
      case "Moderate": return "#F59E0B";
      case "High": return "#F97316";
      case "Critical": return "#EF4444";
      default: return "#9E9E9E";
    }
  };

  /* ---------------- Filters ---------------- */
  const applyLastDays = (days: number) => {
    try {
      console.log(`\n=== Applying Last ${days} Days Filter ===`);

      // Get current date and time
      const now = new Date();
      console.log("Current time:", now.toISOString());

      // Calculate cutoff date (X days ago)
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - days);
      console.log(`Cutoff (${days} days ago):`, cutoff.toISOString());

      const result = alerts.filter((a) => {
        if (!a.timestamp) {
          console.warn("Alert missing timestamp:", a.alert_id);
          return false;
        }

        const alertDate = new Date(a.timestamp);

        // Check if date is valid
        if (isNaN(alertDate.getTime())) {
          console.warn("Invalid timestamp:", a.timestamp);
          return false;
        }

        const isInRange = alertDate >= cutoff && alertDate <= now;

        console.log(`Alert ${a.alert_id}:`, {
          timestamp: a.timestamp,
          alertDate: alertDate.toISOString(),
          isInRange: isInRange,
        });

        return isInRange;
      });

      console.log(`Found ${result.length} alerts in last ${days} days`);
      console.log("=== End Filter ===\n");

      setFiltered(result);

      // Show feedback only if no results
      if (result.length === 0) {
        Alert.alert(
          "No Results",
          `No alerts found in the last ${days} days.`
        );
      }
    } catch (error) {
      console.error("Filter error:", error);
      Alert.alert("Error", "Failed to apply filter");
    }
  };

  const applyCustomRange = () => {
    try {
      console.log("\n=== Applying Custom Range Filter ===");

      // Validation
      if (!fromDate || !toDate) {
        Alert.alert(
          "Missing Dates",
          "Please select both From and To dates."
        );
        return;
      }

      if (fromDate > toDate) {
        Alert.alert(
          "Invalid Range",
          "From date cannot be after To date. Please adjust your selection."
        );
        return;
      }

      console.log("From Date:", fromDate.toISOString());
      console.log("To Date:", toDate.toISOString());

      // Create date boundaries in LOCAL timezone
      const fromLocal = getLocalDateString(fromDate);
      const toLocal = getLocalDateString(toDate);

      console.log("From Date (local):", fromLocal);
      console.log("To Date (local):", toLocal);

      // Apply filter
      const result = alerts.filter((a) => {
        if (!a.timestamp) {
          console.warn("Alert missing timestamp:", a.alert_id);
          return false;
        }

        const alertDate = new Date(a.timestamp);

        // Check if date is valid
        if (isNaN(alertDate.getTime())) {
          console.warn("Invalid timestamp:", a.timestamp);
          return false;
        }

        // Get alert date in local timezone
        const alertDateLocal = getLocalDateString(alertDate);

        // Compare date strings (YYYY-MM-DD format)
        const isInRange =
          alertDateLocal >= fromLocal && alertDateLocal <= toLocal;

        console.log(`Alert ${a.alert_id}:`, {
          timestamp: a.timestamp,
          alertDateLocal: alertDateLocal,
          isInRange: isInRange,
        });

        return isInRange;
      });

      console.log(`Found ${result.length} alerts in custom range`);
      console.log("=== End Filter ===\n");

      setFiltered(result);

      // Show feedback only if no results
      if (result.length === 0) {
        Alert.alert(
          "No Results",
          `No alerts found between ${fromDate.toLocaleDateString()} and ${toDate.toLocaleDateString()}.`
        );
      }
    } catch (error) {
      console.error("Custom range error:", error);
      Alert.alert("Error", "Failed to apply custom date range");
    }
  };

  const resetFilters = () => {
    console.log("Resetting filters");
    setFiltered(alerts);
    setFromDate(null);
    setToDate(null);
  };

  /* ---------------- Date Picker Handlers ---------------- */
  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowFromPicker(false);
    if (event.type === "dismissed") { setShowFromPicker(false); return; }
    if (selectedDate) {
      setFromDate(selectedDate);
      if (Platform.OS === "ios") setShowFromPicker(false);
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowToPicker(false);
    if (event.type === "dismissed") { setShowToPicker(false); return; }
    if (selectedDate) {
      setToDate(selectedDate);
      if (Platform.OS === "ios") setShowToPicker(false);
    }
  };

  /* ---------------- Render: Active Alert Card ---------------- */
  const renderActiveItem = ({ item }: { item: AlertItem }) => {
    if (!item.alert_id || !item.timestamp) return null;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            try {
              router.push(`/leoTrack/result?alertId=${item.alert_id}` as any);
            } catch {
              Alert.alert("Error", "Failed to open alert details");
            }
          }}
          activeOpacity={0.85}
        >
          <View style={styles.itemHeader}>
            <View style={[styles.itemIconContainer, { backgroundColor: item.source === "Camera" ? "#E8F5E9" : "#E3F2FD" }]}>
              <Text style={styles.itemIcon}>{item.source === "Camera" ? "📷" : "🖼️"}</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Leopard via {item.source}</Text>
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
              <Text style={styles.itemDetailText}>{formatDate(item.timestamp)}</Text>
            </View>
            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>📍</Text>
              <Text style={styles.itemDetailText}>
                {typeof item.latitude === "number" && typeof item.longitude === "number"
                  ? `${item.latitude.toFixed(4)}°N, ${item.longitude.toFixed(4)}°E`
                  : "Location unavailable"}
              </Text>
            </View>
          </View>

          <View style={[styles.accentBar, { backgroundColor: item.source === "Camera" ? "#2ECC71" : "#42A5F5" }]} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  /* ---------------- Render: Released Alert Card ---------------- */
  const renderReleasedItem = ({ item }: { item: AlertItem }) => {
    const assessment = assessments[item.alert_id];
    const severityColor = getSeverityColor(assessment?.severity);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[styles.releasedItem, { borderColor: severityColor + "44" }]}
          onPress={() => {
            try {
              router.push(`/leoTrack/result?alertId=${item.alert_id}` as any);
            } catch {
              Alert.alert("Error", "Failed to open details");
            }
          }}
          activeOpacity={0.85}
        >
          {/* Released badge */}
          <View style={styles.releasedBadge}>
            <Text style={styles.releasedBadgeText}>✅ Released</Text>
          </View>

          <View style={styles.releasedHeader}>
            <View style={[styles.releasedIconCircle, { backgroundColor: severityColor + "22", borderColor: severityColor }]}>
              <Text style={styles.releasedIconEmoji}>🐆</Text>
            </View>
            <View style={styles.releasedHeaderContent}>
              <Text style={styles.releasedTitle}>
                Alert #{item.alert_id.slice(-8).toUpperCase()}
              </Text>
              {assessment && (
                <View style={[styles.severityTag, { backgroundColor: severityColor + "22" }]}>
                  <Text style={[styles.severityTagText, { color: severityColor }]}>
                    {assessment.severity}
                  </Text>
                </View>
              )}
            </View>
            {assessment && (
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreCircleValue, { color: severityColor }]}>{assessment.score}</Text>
                <Text style={styles.scoreCircleLabel}>/ 100</Text>
              </View>
            )}
          </View>

          <View style={styles.releasedDetails}>
            {item.released_at && (
              <View style={styles.itemDetail}>
                <Text style={styles.itemDetailIcon}>🕊️</Text>
                <View>
                  <Text style={styles.releasedDetailLabel}>Release Date</Text>
                  <Text style={styles.itemDetailText}>{formatDate(item.released_at)}</Text>
                </View>
              </View>
            )}
            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>📅</Text>
              <View>
                <Text style={styles.releasedDetailLabel}>Detection Date</Text>
                <Text style={styles.itemDetailText}>{formatDate(item.timestamp)}</Text>
              </View>
            </View>
            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>📍</Text>
              <View>
                <Text style={styles.releasedDetailLabel}>Location</Text>
                <Text style={styles.itemDetailText}>
                  {typeof item.latitude === "number" && typeof item.longitude === "number"
                    ? `${item.latitude.toFixed(4)}°N, ${item.longitude.toFixed(4)}°E`
                    : "Location unavailable"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.viewDetailsRow}>
            <Text style={[styles.viewDetailsText, { color: severityColor }]}>View Details →</Text>
          </View>

          <View style={[styles.accentBar, { backgroundColor: severityColor }]} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  /* ---------------- Main Render ---------------- */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerIconContainer}>
            <View style={styles.headerIconCircle}>
              <Text style={styles.headerIcon}>📜</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Alert History</Text>
          <Text style={styles.headerSubtitle}>View and filter past leopard sightings</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{alerts.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#1B5E20" }]}>{releasedAlerts.length}</Text>
              <Text style={styles.statLabel}>Released</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#1E88E5" }]}>{filtered.length}</Text>
              <Text style={styles.statLabel}>Filtered</Text>
            </View>
          </View>
        </Animated.View>

        {/* ---- Tabs ---- */}
        <Animated.View style={[styles.tabRow, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "active" && styles.tabButtonActive]}
            onPress={() => setActiveTab("active")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
              Active Alerts
            </Text>
            {alerts.length > 0 && (
              <View style={[styles.tabBadge, activeTab === "active" && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === "active" && styles.tabBadgeTextActive]}>
                  {alerts.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "released" && styles.tabButtonActive]}
            onPress={() => setActiveTab("released")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, activeTab === "released" && styles.tabTextActive]}>
              Released Leopards
            </Text>
            {releasedAlerts.length > 0 && (
              <View style={[styles.tabBadge, activeTab === "released" && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === "released" && styles.tabBadgeTextActive]}>
                  {releasedAlerts.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ---- Active Alerts Tab ---- */}
        {activeTab === "active" && (
          <>
            {/* Quick Filters */}
            <Animated.View style={[styles.filtersSection, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Quick Filters</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity style={styles.filterButton} onPress={() => applyLastDays(7)} activeOpacity={0.85} disabled={loading}>
                  <Text style={styles.filterIcon}>📅</Text>
                  <Text style={styles.filterText}>Last 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton} onPress={() => applyLastDays(30)} activeOpacity={0.85} disabled={loading}>
                  <Text style={styles.filterIcon}>📆</Text>
                  <Text style={styles.filterText}>Last 30 Days</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Custom Date Range */}
            <Animated.View style={[styles.dateSection, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Custom Date Range</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowFromPicker(true)} activeOpacity={0.85} disabled={loading}>
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>
                    {fromDate ? fromDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select"}
                  </Text>
                </TouchableOpacity>
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>→</Text>
                </View>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowToPicker(true)} activeOpacity={0.85} disabled={loading}>
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>
                    {toDate ? toDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.applyButton} onPress={applyCustomRange} activeOpacity={0.85} disabled={loading}>
                  <Text style={styles.applyText}>Apply Range</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters} activeOpacity={0.85} disabled={loading}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Alert List */}
            <Animated.View style={[styles.listSection, { opacity: fadeAnim }]}>
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Recorded Alerts</Text>
                {filtered.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{filtered.length}</Text>
                  </View>
                )}
              </View>

              {loading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>⏳</Text>
                  <Text style={styles.emptyTitle}>Loading...</Text>
                  <Text style={styles.emptyText}>Fetching alert history</Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No Alerts Found</Text>
                  <Text style={styles.emptyText}>
                    {alerts.length === 0 ? "No active alerts recorded yet" : "Try adjusting your filter criteria"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(item, index) => item.alert_id || `alert-${index}`}
                  renderItem={renderActiveItem}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </Animated.View>
          </>
        )}

        {/* ---- Released Leopards Tab ---- */}
        {activeTab === "released" && (
          <Animated.View style={[styles.listSection, { opacity: fadeAnim }]}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Released Leopards</Text>
              {releasedAlerts.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: "#E8F5E9", borderColor: "#2ECC71" }]}>
                  <Text style={[styles.countText, { color: "#1B5E20" }]}>{releasedAlerts.length}</Text>
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏳</Text>
                <Text style={styles.emptyTitle}>Loading...</Text>
                <Text style={styles.emptyText}>Fetching released records</Text>
              </View>
            ) : releasedAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🐆</Text>
                <Text style={styles.emptyTitle}>No Releases Yet</Text>
                <Text style={styles.emptyText}>
                  Leopards marked as released will appear here for longitudinal tracking.
                </Text>
              </View>
            ) : (
              <FlatList
                data={releasedAlerts}
                keyExtractor={(item, index) => item.alert_id || `released-${index}`}
                renderItem={renderReleasedItem}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </Animated.View>
        )}

        {/* Refresh */}
        <TouchableOpacity style={styles.refreshButton} onPress={fetchAlerts} activeOpacity={0.85} disabled={loading}>
          <Text style={styles.refreshText}>{loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}</Text>
        </TouchableOpacity>

        {/* Back */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.closeText}>← Back to Tracker</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>🔒 Secure historical data storage</Text>
        </View>
      </ScrollView>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleFromDateChange}
          maximumDate={new Date()}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleToDateChange}
          maximumDate={new Date()}
          minimumDate={fromDate || undefined}
        />
      )}
    </View>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },

  // Header
  header: { alignItems: "center", marginBottom: 24 },
  headerIconContainer: { marginBottom: 16 },
  headerIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8F5E9",
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#2ECC71",
  },
  headerIcon: { fontSize: 40 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1B5E20", marginBottom: 8, textAlign: "center", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: "#4A4A4A", textAlign: "center", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    backgroundColor: "#FAFAFA", paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 16, alignItems: "center", borderWidth: 2, borderColor: "#E0E0E0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, color: "#2ECC71", fontWeight: "bold", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#757575", fontWeight: "600" },

  // Tabs
  tabRow: {
    flexDirection: "row", backgroundColor: "#F5F5F5", borderRadius: 14,
    padding: 4, marginBottom: 24, gap: 4,
  },
  tabButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 11, gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9E9E9E" },
  tabTextActive: { color: "#1B5E20", fontWeight: "700" },
  tabBadge: { backgroundColor: "#E0E0E0", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tabBadgeActive: { backgroundColor: "#E8F5E9" },
  tabBadgeText: { fontSize: 11, fontWeight: "700", color: "#9E9E9E" },
  tabBadgeTextActive: { color: "#1B5E20" },

  // Filters
  filtersSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1B5E20", marginBottom: 12, letterSpacing: -0.3 },
  filterRow: { flexDirection: "row", gap: 12 },
  filterButton: {
    flex: 1, backgroundColor: "#FAFAFA", padding: 16, borderRadius: 14, alignItems: "center",
    borderWidth: 2, borderColor: "#E0E0E0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  filterIcon: { fontSize: 24, marginBottom: 6 },
  filterText: { color: "#212121", fontWeight: "600", fontSize: 13 },

  // Date Section
  dateSection: {
    backgroundColor: "#FAFAFA", padding: 18, borderRadius: 18, marginBottom: 24,
    borderWidth: 2, borderColor: "#E0E0E0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dateButton: {
    flex: 1, backgroundColor: "#E8F5E9", padding: 14, borderRadius: 12, alignItems: "center",
    borderWidth: 2, borderColor: "#2ECC71",
  },
  dateLabel: { fontSize: 11, color: "#1B5E20", fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  dateValue: { fontSize: 15, color: "#1B5E20", fontWeight: "700" },
  dateSeparator: { paddingHorizontal: 12 },
  dateSeparatorText: { fontSize: 20, color: "#2ECC71", fontWeight: "bold" },
  actionRow: { flexDirection: "row", gap: 12 },
  applyButton: {
    flex: 2, backgroundColor: "#2ECC71", padding: 14, borderRadius: 12, alignItems: "center",
    shadowColor: "#2ECC71", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  applyText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15, letterSpacing: -0.2 },
  resetButton: {
    flex: 1, backgroundColor: "#FAFAFA", padding: 14, borderRadius: 12, alignItems: "center",
    borderWidth: 2, borderColor: "#2ECC71",
  },
  resetText: { color: "#2ECC71", fontWeight: "700", fontSize: 15 },

  // List Section
  listSection: { marginBottom: 24 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  countBadge: {
    backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: "#2ECC71",
  },
  countText: { color: "#1B5E20", fontSize: 12, fontWeight: "700" },
  listContent: { gap: 12 },

  // Active Alert Item
  item: {
    backgroundColor: "#FAFAFA", borderRadius: 16, padding: 16, borderWidth: 2, borderColor: "#E0E0E0",
    position: "relative", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  itemHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  itemIconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  itemIcon: { fontSize: 24 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "700", color: "#212121", marginBottom: 4, letterSpacing: -0.3 },
  itemBadge: { flexDirection: "row", alignItems: "center" },
  itemBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2ECC71", marginRight: 6 },
  itemBadgeText: { fontSize: 11, color: "#616161", fontWeight: "600" },
  itemArrow: { fontSize: 22, color: "#2ECC71", fontWeight: "bold" },
  itemDetails: { gap: 8 },
  itemDetail: { flexDirection: "row", alignItems: "flex-start" },
  itemDetailIcon: { fontSize: 14, marginRight: 8, marginTop: 1 },
  itemDetailText: { fontSize: 13, color: "#616161", lineHeight: 18 },
  accentBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4 },

  // Released Alert Item
  releasedItem: {
    backgroundColor: "#FAFAFA", borderRadius: 16, padding: 16, borderWidth: 2,
    position: "relative", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  releasedBadge: {
    alignSelf: "flex-start", backgroundColor: "#E8F5E9", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12,
    borderWidth: 1, borderColor: "#2ECC71",
  },
  releasedBadgeText: { fontSize: 12, fontWeight: "700", color: "#1B5E20" },
  releasedHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  releasedIconCircle: {
    width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
    marginRight: 12, borderWidth: 2,
  },
  releasedIconEmoji: { fontSize: 26 },
  releasedHeaderContent: { flex: 1 },
  releasedTitle: { fontSize: 16, fontWeight: "700", color: "#212121", marginBottom: 6, letterSpacing: -0.3 },
  severityTag: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  severityTagText: { fontSize: 12, fontWeight: "700" },
  scoreCircle: { alignItems: "center" },
  scoreCircleValue: { fontSize: 26, fontWeight: "800" },
  scoreCircleLabel: { fontSize: 11, color: "#9E9E9E", fontWeight: "600" },
  releasedDetails: { gap: 10, marginBottom: 12 },
  releasedDetailLabel: { fontSize: 10, color: "#9E9E9E", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  viewDetailsRow: { alignItems: "flex-end" },
  viewDetailsText: { fontSize: 13, fontWeight: "700" },

  // Empty State
  emptyState: {
    alignItems: "center", paddingVertical: 40, paddingHorizontal: 20,
    backgroundColor: "#FAFAFA", borderRadius: 16, borderWidth: 2,
    borderColor: "#E0E0E0", borderStyle: "dashed",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#212121", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#757575", textAlign: "center" },

  // Refresh / Close Buttons
  refreshButton: {
    backgroundColor: "#FAFAFA", padding: 16, borderRadius: 16, alignItems: "center",
    marginBottom: 12, borderWidth: 2, borderColor: "#2ECC71",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  refreshText: { color: "#2ECC71", fontWeight: "700", fontSize: 15, letterSpacing: -0.2 },
  closeButton: {
    backgroundColor: "#2ECC71", padding: 18, borderRadius: 16, alignItems: "center", marginBottom: 24,
    shadowColor: "#2ECC71", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  closeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16, letterSpacing: -0.2 },

  // Footer
  footer: { alignItems: "center", paddingTop: 20 },
  footerDivider: { width: "100%", height: 1, backgroundColor: "#E0E0E0", marginBottom: 16 },
  footerText: { fontSize: 12, color: "#9E9E9E", textAlign: "center" },
});