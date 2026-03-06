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
};

const BACKEND_URL = "http://172.20.10.2:8000";

export default function AlertHistory() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filtered, setFiltered] = useState<AlertItem[]>([]);
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
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/alerts`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Validate data is an array
      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
        Alert.alert("Error", "Invalid data format from server");
        return;
      }
      
      console.log("Fetched alerts:", data.length);
      
      // Sort by timestamp (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });
      
      setAlerts(sortedData);
      setFiltered(sortedData);
    } catch (error) {
      console.error("Fetch alerts error:", error);
      Alert.alert(
        "Connection Error", 
        "Failed to load alert history. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  /* ---------------- Helper Functions ---------------- */

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Format date to local date string for comparison
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /* ---------------- Filter Functions (COMPLETELY FIXED) ---------------- */

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
          isInRange: isInRange
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
      const fromDateLocal = getLocalDateString(fromDate);
      const toDateLocal = getLocalDateString(toDate);
      
      console.log("From Date (local):", fromDateLocal);
      console.log("To Date (local):", toDateLocal);

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
        const isInRange = alertDateLocal >= fromDateLocal && alertDateLocal <= toDateLocal;
        
        console.log(`Alert ${a.alert_id}:`, {
          timestamp: a.timestamp,
          alertDateLocal: alertDateLocal,
          isInRange: isInRange
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

  /* ---------------- Date Picker Handlers (FIXED) ---------------- */

  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFromPicker(false);
    }
    
    if (event.type === 'dismissed') {
      setShowFromPicker(false);
      return;
    }
    
    if (selectedDate) {
      console.log("From date selected:", selectedDate.toISOString());
      setFromDate(selectedDate);
      
      if (Platform.OS === 'ios') {
        setShowFromPicker(false);
      }
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToPicker(false);
    }
    
    if (event.type === 'dismissed') {
      setShowToPicker(false);
      return;
    }
    
    if (selectedDate) {
      console.log("To date selected:", selectedDate.toISOString());
      setToDate(selectedDate);
      
      if (Platform.OS === 'ios') {
        setShowToPicker(false);
      }
    }
  };

  /* ---------------- Render Functions ---------------- */

  const renderItem = ({ item, index }: { item: AlertItem; index: number }) => {
    // Validate item data
    if (!item.alert_id || !item.timestamp) {
      console.warn("Invalid alert item:", item);
      return null;
    }

    return (
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
          onPress={() => {
            try {
              router.push(`/leoTrack/result?alertId=${item.alert_id}` as any);
            } catch (error) {
              console.error("Navigation error:", error);
              Alert.alert("Error", "Failed to open alert details");
            }
          }}
          activeOpacity={0.85}
        >
          <View style={styles.itemHeader}>
            <View
              style={[
                styles.itemIconContainer,
                {
                  backgroundColor:
                    item.source === "Camera" ? "#E8F5E9" : "#E3F2FD",
                },
              ]}
            >
              <Text style={styles.itemIcon}>
                {item.source === "Camera" ? "📷" : "🖼️"}
              </Text>
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
              <Text style={styles.itemDetailText}>
                {formatDate(item.timestamp)}
              </Text>
            </View>

            <View style={styles.itemDetail}>
              <Text style={styles.itemDetailIcon}>📍</Text>
              <Text style={styles.itemDetailText}>
                {typeof item.latitude === 'number' && typeof item.longitude === 'number'
                  ? `${item.latitude.toFixed(4)}°N, ${item.longitude.toFixed(4)}°E`
                  : "Location unavailable"}
              </Text>
            </View>
          </View>

          {/* Accent bar */}
          <View
            style={[
              styles.accentBar,
              {
                backgroundColor: item.source === "Camera" ? "#2ECC71" : "#42A5F5",
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
              disabled={loading}
            >
              <Text style={styles.filterIcon}>📅</Text>
              <Text style={styles.filterText}>Last 7 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => applyLastDays(30)}
              activeOpacity={0.85}
              disabled={loading}
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
              disabled={loading}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>
                {fromDate
                  ? fromDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
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
              disabled={loading}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>
                {toDate
                  ? toDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
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
              disabled={loading}
            >
              <Text style={styles.applyText}>Apply Range</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
              activeOpacity={0.85}
              disabled={loading}
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
                {alerts.length === 0
                  ? "No alerts have been recorded yet"
                  : "Try adjusting your filter criteria"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item, index) => item.alert_id || `alert-${index}`}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Animated.View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchAlerts}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.refreshText}>
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}
          </Text>
        </TouchableOpacity>

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

      {/* Date Pickers - FIXED to prevent future dates */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleFromDateChange}
          maximumDate={new Date()} // Prevent future dates
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleToDateChange}
          maximumDate={new Date()} // Prevent future dates
          minimumDate={fromDate || undefined} // Can't select before From date
        />
      )}
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#E8F5E9",
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
    color: "#1B5E20",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    textAlign: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    backgroundColor: "#FAFAFA",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    color: "#2ECC71",
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "600",
  },

  // Filters Section
  filtersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  filterText: {
    color: "#212121",
    fontWeight: "600",
    fontSize: 13,
  },

  // Date Section
  dateSection: {
    backgroundColor: "#FAFAFA",
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  dateLabel: {
    fontSize: 11,
    color: "#1B5E20",
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 15,
    color: "#1B5E20",
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
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  applyText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  resetText: {
    color: "#2ECC71",
    fontWeight: "700",
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
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  countText: {
    color: "#1B5E20",
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    gap: 12,
  },

  // Alert Item
  item: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    color: "#212121",
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
    color: "#616161",
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
    color: "#616161",
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
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },

  // Refresh Button
  refreshButton: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshText: {
    color: "#2ECC71",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },

  // Close Button
  closeButton: {
    backgroundColor: "#2ECC71",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeText: {
    color: "#FFFFFF",
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
    backgroundColor: "#E0E0E0",
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "center",
  },
});