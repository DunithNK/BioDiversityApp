import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BACKEND_URL = "http://192.168.1.3:8000";

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
  const [alertStatus, setAlertStatus] = useState<"active" | "released">("active");
  const [releasing, setReleasing] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [toastAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!alertId) {
      setLoading(false);
      return;
    }

    // Fetch assessment and alert status in parallel
    Promise.all([
      fetch(`${BACKEND_URL}/assessment/${alertId}`).then((res) => res.json()),
      fetch(`${BACKEND_URL}/alert/${alertId}`).then((res) => res.ok ? res.json() : null),
    ])
      .then(([assessmentData, alertData]) => {
        if (!assessmentData || assessmentData.error) {
          setAssessment(null);
        } else {
          setAssessment({
            alert_id: assessmentData.alert_id,
            severity: assessmentData.severity,
            score: assessmentData.score,
          });
        }
        if (alertData && alertData.status) {
          setAlertStatus(alertData.status);
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

  /* -------------------- Toast Helper -------------------- */
  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  /* -------------------- Release Handler -------------------- */
  const handleRelease = async () => {
    if (!alertId) return;

    try {
      setReleasing(true);
      setShowReleaseModal(false);

      const res = await fetch(`${BACKEND_URL}/alert/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Release failed");
      }

      showToast();

      // Navigate back to history after toast displays
      setTimeout(() => {
        router.replace("/leoTrack/history");
      }, 1800);
    } catch (error: any) {
      console.error("Release error:", error);
      Alert.alert(
        "Release Failed",
        error.message || "Could not release the leopard. Please try again."
      );
    } finally {
      setReleasing(false);
    }
  };

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
        return "#2ECC71";
      default:
        return "#2ECC71";
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

  const getBgBySeverity = (severity?: string) => {
    switch (severity) {
      case "Low":
        return "#E8F5E9";
      case "Moderate":
        return "#FFF8E1";
      case "High":
        return "#FFF3E0";
      case "Critical":
        return "#FFEBEE";
      case "None":
        return "#E8F5E9";
      default:
        return "#E8F5E9";
    }
  };

  const getBorderBySeverity = (severity?: string) => {
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
        return "#2ECC71";
      default:
        return "#2ECC71";
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

  /* -------------------- PDF Report Generation -------------------- */

  const generatePDFReport = async () => {
    if (!assessment) {
      Alert.alert("Error", "No assessment data available to generate report.");
      return;
    }

    try {
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Helvetica', 'Arial', sans-serif;
                padding: 40px;
                background: #ffffff;
                color: #212121;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 4px solid ${getColorBySeverity(assessment.severity)};
                padding-bottom: 20px;
              }
              .logo {
                font-size: 48px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 32px;
                font-weight: bold;
                color: #1B5E20;
                margin-bottom: 8px;
              }
              .subtitle {
                font-size: 14px;
                color: #757575;
              }
              .severity-section {
                background: ${getBgBySeverity(assessment.severity)};
                border: 3px solid ${getBorderBySeverity(assessment.severity)};
                border-radius: 16px;
                padding: 30px;
                margin: 30px 0;
                text-align: center;
              }
              .severity-icon {
                font-size: 64px;
                margin-bottom: 15px;
              }
              .severity-label {
                font-size: 14px;
                color: #757575;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 10px;
              }
              .severity-value {
                font-size: 42px;
                font-weight: bold;
                color: ${getColorBySeverity(assessment.severity)};
                margin-bottom: 20px;
              }
              .score-row {
                display: flex;
                justify-content: center;
                align-items: baseline;
                margin-top: 15px;
              }
              .score-value {
                font-size: 56px;
                font-weight: bold;
                color: ${getColorBySeverity(assessment.severity)};
              }
              .score-unit {
                font-size: 24px;
                color: #9E9E9E;
                margin-left: 8px;
              }
              .section {
                background: #FAFAFA;
                border: 2px solid #E0E0E0;
                border-left: 5px solid ${getColorBySeverity(assessment.severity)};
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
              }
              .section-title {
                font-size: 20px;
                font-weight: bold;
                color: #1B5E20;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
              }
              .section-icon {
                font-size: 24px;
                margin-right: 10px;
              }
              .recommendation-text {
                font-size: 15px;
                line-height: 1.8;
                color: #4A4A4A;
              }
              .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 15px;
              }
              .detail-item {
                background: #ffffff;
                border: 1px solid #E0E0E0;
                border-radius: 10px;
                padding: 15px;
              }
              .detail-label {
                font-size: 11px;
                color: #9E9E9E;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
              }
              .detail-value {
                font-size: 16px;
                font-weight: bold;
                color: #212121;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #E0E0E0;
                text-align: center;
              }
              .footer-text {
                font-size: 12px;
                color: #9E9E9E;
              }
              .timestamp {
                font-size: 11px;
                color: #BDBDBD;
                margin-top: 10px;
              }
              .alert-box {
                background: ${assessment.severity === "Critical" ? "#FFEBEE" : "#FFF8E1"};
                border: 2px solid ${assessment.severity === "Critical" ? "#EF4444" : "#F59E0B"};
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
              }
              .alert-text {
                font-size: 14px;
                font-weight: bold;
                color: ${assessment.severity === "Critical" ? "#C62828" : "#F57C00"};
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🐆</div>
              <div class="title">Leopard Health Assessment Report</div>
              <div class="subtitle">Wildlife Tracking & Monitoring System</div>
            </div>

            ${
              assessment.severity === "Critical" ||
              assessment.severity === "High"
                ? `
              <div class="alert-box">
                <div class="alert-text">⚠️ ${assessment.severity.toUpperCase()} PRIORITY - IMMEDIATE ATTENTION REQUIRED</div>
              </div>
            `
                : ""
            }

            <div class="severity-section">
              <div class="severity-icon">${getIconBySeverity(assessment.severity)}</div>
              <div class="severity-label">Severity Level</div>
              <div class="severity-value">${assessment.severity}</div>
              <div class="score-row">
                <span class="score-value">${assessment.score}</span>
                <span class="score-unit">/ 100</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">
                <span class="section-icon">📌</span>
                Recommendation
              </div>
              <div class="recommendation-text">${getRecommendation(assessment.severity)}</div>
            </div>

            <div class="section">
              <div class="section-title">
                <span class="section-icon">📊</span>
                Assessment Details
              </div>
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">🆔 Alert ID</div>
                  <div class="detail-value">${alertId?.slice(-8).toUpperCase()}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">📈 Priority Level</div>
                  <div class="detail-value" style="color: ${getColorBySeverity(assessment.severity)}">${assessment.severity}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">📊 Risk Score</div>
                  <div class="detail-value">${assessment.score} / 100</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">✅ Status</div>
                  <div class="detail-value">Assessment Completed</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">📅 Assessment Date</div>
                  <div class="detail-value">${currentDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">🕒 Time</div>
                  <div class="detail-value">${currentTime}</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">🔒 This report is generated securely for wildlife monitoring purposes</div>
              <div class="footer-text" style="margin-top: 8px;">Gal Oya National Park - Leopard Conservation Program</div>
              <div class="timestamp">Generated on ${currentDate} at ${currentTime}</div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      Alert.alert(
        "Report Generated",
        "Your assessment report has been created successfully.",
        [
          {
            text: "View & Share",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                  mimeType: "application/pdf",
                  dialogTitle: "Share Assessment Report",
                  UTI: "com.adobe.pdf",
                });
              } else {
                Alert.alert("Error", "Sharing is not available on this device");
              }
            },
          },
          { text: "OK", style: "cancel" },
        ],
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Error", "Failed to generate PDF report. Please try again.");
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
      {/* ---- Release Confirmation Modal ---- */}
      <Modal
        visible={showReleaseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReleaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🐆</Text>
            <Text style={styles.modalTitle}>Confirm Release</Text>
            <Text style={styles.modalMessage}>
              This will mark the leopard as released and remove it from active alerts.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReleaseModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleRelease}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>Confirm Release</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Toast ---- */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]}>
          <Text style={styles.toastText}>✅ Leopard successfully released</Text>
        </Animated.View>
      )}

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
              borderColor: getBorderBySeverity(assessment.severity),
              backgroundColor: getBgBySeverity(assessment.severity),
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

            {/* Progress Visual */}
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
          style={[styles.recommendationCard, { opacity: fadeAnim }]}
        >
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationIcon}>📌</Text>
            <Text style={styles.recommendationTitle}>Recommendation</Text>
          </View>
          <Text style={styles.recommendationText}>
            {getRecommendation(assessment.severity)}
          </Text>
        </Animated.View>

        {/* ---- Release Leopard Button (only for active alerts) ---- */}
        {alertStatus !== "released" && (
          <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
            <TouchableOpacity
              style={[
                styles.releaseButton,
                releasing && styles.releaseButtonDisabled,
              ]}
              onPress={() => setShowReleaseModal(true)}
              activeOpacity={0.85}
              disabled={releasing}
            >
              <Text style={styles.releaseIcon}>🐆</Text>
              <Text style={styles.releaseText}>
                {releasing ? "Releasing..." : "Release Leopard"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ---- Released Badge (read-only view from Released tab) ---- */}
        {alertStatus === "released" && (
          <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
            <View style={styles.releasedBanner}>
              <Text style={styles.releasedBannerIcon}>✅</Text>
              <Text style={styles.releasedBannerText}>
                This leopard has been released
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Details Card */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
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
                <Text
                  style={[
                    styles.detailValue,
                    { color: alertStatus === "released" ? "#2ECC71" : "#212121" },
                  ]}
                >
                  {alertStatus === "released" ? "Released" : "Active"}
                </Text>
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
        <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
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

          <TouchableOpacity
            style={styles.reportButton}
            onPress={generatePDFReport}
            activeOpacity={0.85}
          >
            <Text style={styles.reportIcon}>📄</Text>
            <Text style={styles.reportText}>Generate PDF Report</Text>
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2ECC71",
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#757575",
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
    backgroundColor: "#FFF8E1",
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
    color: "#212121",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#757575",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyInfoCard: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: "#2ECC71",
    borderWidth: 2,
    borderColor: "#E0E0E0",
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
    color: "#212121",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyInfoText: {
    fontSize: 13,
    color: "#757575",
    lineHeight: 19,
  },
  backButton: {
    backgroundColor: "#2ECC71",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backText: {
    color: "#FFFFFF",
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
    backgroundColor: "#E8F5E9",
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
  },

  // Severity Card
  severityCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  severityLabel: {
    fontSize: 12,
    color: "#757575",
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
    height: 1,
    backgroundColor: "#E0E0E0",
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
    color: "#757575",
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
    color: "#9E9E9E",
    fontWeight: "600",
  },
  progressRing: {
    width: 80,
    height: 120,
    backgroundColor: "#F5F5F5",
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  progressBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#FAFAFA",
  },
  progressFill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderRadius: 40,
    opacity: 0.85,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
    zIndex: 2,
  },

  // Recommendation Card
  recommendationCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderLeftWidth: 4,
    borderLeftColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    color: "#1B5E20",
    letterSpacing: -0.3,
  },
  recommendationText: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 21,
  },

  // Released Banner (read-only state)
  releasedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#2ECC71",
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
  },
  releasedBannerIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  releasedBannerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B5E20",
    letterSpacing: -0.2,
  },

  // Release Button
  releaseButton: {
    backgroundColor: "#1B5E20",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  releaseButtonDisabled: {
    opacity: 0.6,
  },
  releaseIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  releaseText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B5E20",
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
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    color: "#9E9E9E",
    fontWeight: "600",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
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
    marginBottom: 12,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: "#FAFAFA",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  secondaryText: {
    color: "#212121",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  reportButton: {
    backgroundColor: "#1E88E5",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#1565C0",
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  reportIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reportText: {
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: 15,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  modalCancelText: {
    color: "#616161",
    fontWeight: "700",
    fontSize: 15,
  },
  modalConfirmBtn: {
    flex: 1.5,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#1B5E20",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  // Toast
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});