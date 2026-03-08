import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BACKEND_URL = "http://192.168.1.3:8000";

export default function HealthAssessment() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();

  const [submitting, setSubmitting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  const [form, setForm] = useState({
    limping: false,
    visible_injury: false,
    abnormal_behavior: false,
    near_human_area: false,
  });

  /* -------------------- Animations -------------------- */
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const activeCount = Object.values(form).filter(Boolean).length;
  const riskScore = activeCount * 25;

  const getRiskLevel = () => {
    if (riskScore === 0) return "None";
    if (riskScore <= 25) return "Low";
    if (riskScore <= 50) return "Moderate";
    if (riskScore <= 75) return "High";
    return "Critical";
  };

  const getRiskColor = () => {
    const level = getRiskLevel();
    if (level === "None") return "#2ECC71";
    if (level === "Low") return "#2ECC71";
    if (level === "Moderate") return "#F59E0B";
    if (level === "High") return "#F97316";
    return "#EF4444";
  };

  const getRiskBg = () => {
    const level = getRiskLevel();
    if (level === "None") return "#E8F5E9";
    if (level === "Low") return "#E8F5E9";
    if (level === "Moderate") return "#FFF8E1";
    if (level === "High") return "#FFF3E0";
    return "#FFEBEE";
  };

  const getRiskIcon = () => {
    const level = getRiskLevel();
    if (level === "None") return "✅";
    if (level === "Low") return "⚠️";
    if (level === "Moderate") return "🟡";
    if (level === "High") return "🟠";
    return "🔴";
  };

  const submitAssessment = async () => {
    if (!alertId) {
      Alert.alert("Error", "Missing alert reference");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertId,
          severity: getRiskLevel(),
          score: riskScore,
          indicators: form,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save assessment");
      }

      router.push(`/leoTrack/result?alertId=${alertId}` as any);
    } catch {
      Alert.alert(
        "Save Failed",
        "Assessment could not be saved. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderSwitch = (
    label: string,
    key: keyof typeof form,
    icon: string,
    description: string,
  ) => (
    <Animated.View
      style={[
        styles.switchCard,
        form[key] && styles.switchCardActive,
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.switchHeader}>
        <View
          style={[
            styles.switchIconContainer,
            form[key] && styles.switchIconContainerActive,
          ]}
        >
          <Text style={styles.switchIcon}>{icon}</Text>
        </View>
        <View style={styles.switchContent}>
          <Text style={styles.switchLabel}>{label}</Text>
          <Text style={styles.switchDescription}>{description}</Text>
        </View>
        <Switch
          value={form[key]}
          onValueChange={(value) => setForm({ ...form, [key]: value })}
          trackColor={{ false: "#E0E0E0", true: "#2ECC71" }}
          thumbColor={form[key] ? "#FFFFFF" : "#BDBDBD"}
          ios_backgroundColor="#E0E0E0"
        />
      </View>
      {form[key] && <View style={styles.activeIndicator} />}
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
              <Text style={styles.headerIcon}>🏥</Text>
            </View>
          </View>
          <Text style={styles.title}>Health Assessment</Text>
          <Text style={styles.subtitle}>
            Evaluate leopard health indicators and risk factors
          </Text>
        </Animated.View>

        {/* Risk Score Card */}
        <Animated.View
          style={[
            styles.riskCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              borderColor: getRiskColor(),
              backgroundColor: getRiskBg(),
            },
          ]}
        >
          <Text style={styles.riskLabel}>Current Risk Assessment</Text>
          <View style={styles.riskContent}>
            <Text style={styles.riskIcon}>{getRiskIcon()}</Text>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskLevel, { color: getRiskColor() }]}>
                {getRiskLevel()}
              </Text>
              <Text style={styles.riskSubtext}>
                {activeCount} indicator{activeCount !== 1 ? "s" : ""} active
              </Text>
            </View>
            <View
              style={[styles.scoreContainer, { borderColor: getRiskColor() }]}
            >
              <Text style={[styles.scoreValue, { color: getRiskColor() }]}>
                {riskScore}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${riskScore}%`,
                    backgroundColor: getRiskColor(),
                    opacity: fadeAnim,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{riskScore}% Risk Level</Text>
          </View>
        </Animated.View>

        {/* Assessment Section */}
        <Animated.View
          style={[styles.assessmentSection, { opacity: fadeAnim }]}
        >
          <Text style={styles.sectionTitle}>Health Indicators</Text>
          <Text style={styles.sectionSubtitle}>
            Toggle each indicator observed during the sighting
          </Text>

          {renderSwitch(
            "Limping Observed",
            "limping",
            "🦵",
            "Difficulty walking or abnormal gait",
          )}
          {renderSwitch(
            "Visible Injury",
            "visible_injury",
            "🩹",
            "Wounds, cuts, or physical damage",
          )}
          {renderSwitch(
            "Abnormal Behavior",
            "abnormal_behavior",
            "🧠",
            "Unusual actions or disorientation",
          )}
          {renderSwitch(
            "Near Human Settlement",
            "near_human_area",
            "🏘️",
            "Close proximity to populated areas",
          )}
        </Animated.View>

        {/* Info Card */}
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Assessment Guidelines</Text>
            <Text style={styles.infoText}>
              Enable indicators based on direct observation. Multiple active
              indicators increase the risk score and priority for wildlife
              intervention.
            </Text>
          </View>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={submitAssessment}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>
              {submitting ? "💾 Saving Assessment..." : "Submit Assessment →"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 Assessment data is securely stored and analyzed
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Risk Card
  riskCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  riskLabel: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  riskContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  riskIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  riskInfo: {
    flex: 1,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  riskSubtext: {
    fontSize: 13,
    color: "#757575",
  },
  scoreContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    fontWeight: "600",
  },

  // Assessment Section
  assessmentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 16,
    lineHeight: 18,
  },

  // Switch Card
  switchCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  switchCardActive: {
    borderColor: "#2ECC71",
    backgroundColor: "#F0FBF4",
  },
  switchHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  switchIconContainerActive: {
    backgroundColor: "#E8F5E9",
  },
  switchIcon: {
    fontSize: 22,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  switchDescription: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 16,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#2ECC71",
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderLeftWidth: 4,
    borderLeftColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    color: "#1B5E20",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  infoText: {
    fontSize: 13,
    color: "#4A4A4A",
    lineHeight: 19,
  },

  // Submit Button
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
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
