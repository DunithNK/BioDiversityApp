import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BACKEND_URL = "http://172.20.10.2:8000";

type Assessment = {
  alert_id: string;
  severity: string;
  score: number;
};

export default function ResultScreen() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!alertId) {
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/assessment/${alertId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) {
          setAssessment(null);
        } else {
          setAssessment({
            alert_id: data.alert_id,
            severity: data.severity,
            score: data.score,
          });
        }
      })
      .catch(() => setAssessment(null))
      .finally(() => setLoading(false));
  }, [alertId]);

  useEffect(() => {
    if (!loading) {
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
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for critical severity
      if (assessment?.severity === "Critical") {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }
    }
  }, [loading, assessment]);

  const getColorBySeverity = (severity?: string) => {
    switch (severity) {
      case "Low":
        return "#2ECC71";
      case "Moderate":
        return "#F59E0B";
      case "High":
        return "#F97316";
      case "Critical":
        return "#EF4444";
      case "None":
        return "#8BC4A9";
      default:
        return "#3498DB";
    }
  };

  const getIconBySeverity = (severity?: string) => {
    switch (severity) {
      case "Low":
        return "⚠️";
      case "Moderate":
        return "🟡";
      case "High":
        return "🟠";
      case "Critical":
        return "🔴";
      case "None":
        return "✅";
      default:
        return "📊";
    }
  };

  const getBackgroundBySeverity = (severity?: string) => {
    switch (severity) {
      case "Low":
        return "#1A3D2E";
      case "Moderate":
        return "#3D2E1A";
      case "High":
        return "#3D1F1A";
      case "Critical":
        return "#3D1A1A";
      case "None":
        return "#1A3D3D";
      default:
        return "#1A2E3D";
    }
  };

  const getRecommendation = (severity?: string) => {
    switch (severity) {
      case "None":
        return "No immediate action required. Continue standard monitoring protocols.";
      case "Low":
        return "Monitor the situation. Schedule follow-up observation within 48 hours.";
      case "Moderate":
        return "Increased monitoring recommended. Consider veterinary consultation if conditions worsen.";
      case "High":
        return "Urgent attention required. Coordinate with wildlife veterinary team immediately.";
      case "Critical":
        return "EMERGENCY: Immediate intervention required. Alert wildlife response team now.";
      default:
        return "Assessment pending. Please complete health evaluation.";
    }
  };

  /* -------------------- Loading -------------------- */

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconCircle}>
            <ActivityIndicator size="large" color="#2ECC71" />
          </View>
          <Text style={styles.loadingTitle}>Loading Assessment</Text>
          <Text style={styles.loadingText}>
            Retrieving health evaluation data...
          </Text>
        </View>
      </View>
    );
  }

  /* -------------------- No Assessment -------------------- */

  if (!assessment) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>⚠️</Text>
              </View>
            </View>
            <Text style={styles.emptyTitle}>No Assessment Found</Text>
            <Text style={styles.emptySubtitle}>
              This sighting has not been assessed yet. Complete a health
              assessment to generate results.
            </Text>

            <View style={styles.emptyInfoCard}>
              <Text style={styles.emptyInfoIcon}>💡</Text>
              <View style={styles.emptyInfoContent}>
                <Text style={styles.emptyInfoTitle}>Next Steps</Text>
                <Text style={styles.emptyInfoText}>
                  Return to the tracker and complete the health assessment form
                  to evaluate this leopard sighting.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.backText}>← Return to Tracker</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  /* -------------------- Result -------------------- */

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
            <View
              style={[
                styles.headerIconCircle,
                { borderColor: getColorBySeverity(assessment.severity) },
              ]}
            >
              <Text style={styles.headerIcon}>📋</Text>
            </View>
          </View>
          <Text style={styles.title}>Assessment Complete</Text>
          <Text style={styles.subtitle}>
            Health evaluation results for Alert #{alertId?.slice(-6)}
          </Text>
        </Animated.View>

        {/* Severity Card */}
        <Animated.View
          style={[
            styles.severityCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              borderColor: getColorBySeverity(assessment.severity),
              backgroundColor: getBackgroundBySeverity(assessment.severity),
            },
          ]}
        >
          <Text style={styles.severityLabel}>Severity Level</Text>
          <Animated.View
            style={[
              styles.severityContent,
              assessment.severity === "Critical" && {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.severityIcon}>
              {getIconBySeverity(assessment.severity)}
            </Text>
            <Text
              style={[
                styles.severityValue,
                { color: getColorBySeverity(assessment.severity) },
              ]}
            >
              {assessment.severity}
            </Text>
          </Animated.View>

          <View style={styles.severityDivider} />

          <View style={styles.scoreSection}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Risk Score</Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getColorBySeverity(assessment.severity) },
                ]}
              >
                {assessment.score}
              </Text>
              <Text style={styles.scoreUnit}>/ 100</Text>
            </View>

            {/* Progress Ring Visual */}
            <View style={styles.progressRing}>
              <View style={styles.progressBackground} />
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: getColorBySeverity(assessment.severity),
                    height: `${assessment.score}%`,
                  },
                ]}
              />
              <Text style={styles.progressPercent}>{assessment.score}%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recommendation Card */}
        <Animated.View
          style={[
            styles.recommendationCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationIcon}>📌</Text>
            <Text style={styles.recommendationTitle}>Recommendation</Text>
          </View>
          <Text style={styles.recommendationText}>
            {getRecommendation(assessment.severity)}
          </Text>
        </Animated.View>

        {/* Details Card */}
        <Animated.View
          style={[
            styles.detailsCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.detailsTitle}>Assessment Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🆔</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Alert ID</Text>
                <Text style={styles.detailValue}>
                  {alertId?.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📊</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>Completed</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🕒</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Assessed</Text>
                <Text style={styles.detailValue}>
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📈</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Priority</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getColorBySeverity(assessment.severity) },
                  ]}
                >
                  {assessment.severity}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/leoTrack")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>New Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/leoTrack/history")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryText}>View History</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 Assessment data stored securely for wildlife monitoring
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------- Styles -------------------- */

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

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0F2F23",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#1A3D2E",
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F59E0B",
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#8BC4A9",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyInfoCard: {
    flexDirection: "row",
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
    width: "100%",
  },
  emptyInfoIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  emptyInfoContent: {
    flex: 1,
  },
  emptyInfoTitle: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyInfoText: {
    fontSize: 13,
    color: "#8BC4A9",
    lineHeight: 19,
  },
  backButton: {
    backgroundColor: "#F59E0B",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FBBF24",
    width: "100%",
  },
  backText: {
    color: "#451A03",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
  headerIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
    lineHeight: 20,
  },

  // Severity Card
  severityCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 3,
    alignItems: "center",
  },
  severityLabel: {
    fontSize: 12,
    color: "#8BC4A9",
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  severityContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  severityIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  severityValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  severityDivider: {
    width: "100%",
    height: 2,
    backgroundColor: "#1A3D2E",
    marginBottom: 20,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  scoreBox: {
    flex: 1,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 13,
    color: "#8BC4A9",
    fontWeight: "600",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "800",
    lineHeight: 52,
  },
  scoreUnit: {
    fontSize: 16,
    color: "#6B9F88",
    fontWeight: "600",
  },
  progressRing: {
    width: 80,
    height: 120,
    backgroundColor: "#1A3D2E",
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
  },
  progressBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#0F2F23",
  },
  progressFill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderRadius: 40,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    zIndex: 2,
  },

  // Recommendation Card
  recommendationCard: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#1A3D2E",
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendationIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  recommendationText: {
    fontSize: 14,
    color: "#8BC4A9",
    lineHeight: 21,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    padding: 14,
    borderRadius: 12,
  },
  detailIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#8BC4A9",
    fontWeight: "600",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // Actions Container
  actionsContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#2ECC71",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3FDD81",
    marginBottom: 12,
  },
  primaryText: {
    color: "#022C22",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: "#0F2F23",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  secondaryText: {
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
    backgroundColor: "#1A3D2E",
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#6B9F88",
    textAlign: "center",
  },
});
