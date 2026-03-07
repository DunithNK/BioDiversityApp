import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export default function ThermalAnalysis() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

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

  // 🔒 SAFE PARAM PARSER (important for Expo Router)
  const getParam = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) return value[0];
    return value ?? "N/A";
  };

  // 🧠 PARSE FULL ANALYSIS DATA
  const analysisDataString = getParam(params.analysisData);
  const analysisId = getParam(params.analysisId);
  
  let analysisData: any = {};
  try {
    analysisData = JSON.parse(analysisDataString);
  } catch (e) {
    console.error("Failed to parse analysis data:", e);
  }

  // Extract data from full analysis
  const animal = "Sri Lankan Leopard";
  const avgTemp = `${analysisData.leopard_mean_temp || "N/A"} °C`;
  const backgroundTemp = `${analysisData.background_mean_temp || "N/A"} °C`;
  const tsi = analysisData.tsi?.toFixed(4) || "N/A";
  const status = analysisData.health_status || "N/A";
  const decision = analysisData.recommendations?.[0] || "Pending Assessment";
  const confidence = analysisData.confidence?.toFixed(2) || "N/A";
  const timestamp = analysisData.timestamp || new Date().toISOString();
  const regions = analysisData.regions || [];
  const anomalies = analysisData.anomalies || [];
  const recommendations = analysisData.recommendations || [];
  const bilateralAsymmetry = analysisData.bilateral_asymmetry || {};

  // 🔬 Dynamic recommendation based on AI result
  const getRecommendation = () => {
    if (status.includes("Normal")) {
      return "Thermal indicators are within normal physiological limits. No signs of heat stress detected.";
    } else if (status.includes("Mild")) {
      return "Mild thermal stress detected. Monitor before release.";
    } else if (status.includes("Moderate")) {
      return "Moderate thermal stress detected. Continued monitoring is recommended before release.";
    } else if (status.includes("Critical")) {
      return "Critical physiological stress detected. Immediate intervention and rehabilitation monitoring required.";
    } else {
      return "Analyzing thermal data from AI backend.";
    }
  };

  // 📥 Download Report Function
  const downloadReport = async () => {
    try {
      const htmlContent = generateReportHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      console.log('PDF generated at:', uri);
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Thermal Analysis Report',
        UTI: 'com.adobe.pdf',
      });
      Alert.alert('Success', 'Report PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    }
  };

  // 📄 Generate Report Text
  const generateReportText = () => {
    const date = new Date(timestamp).toLocaleString();
    
    let report = `
╔════════════════════════════════════════════════╗
║  THERMAL WILDLIFE HEALTH ANALYSIS REPORT       ║
║  ThermalVital Monitor System                   ║
╚════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ANALYSIS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analysis ID:     ${analysisId}
Timestamp:       ${date}
Species:         ${animal}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 THERMAL MEASUREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Leopard Mean Temperature:    ${avgTemp}
Background Temperature:      ${backgroundTemp}
Thermal Stress Index (TSI):  ${tsi}
Health Status:               ${status}
Confidence Score:            ${confidence}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ANATOMICAL REGION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    regions.forEach((region: any) => {
      report += `${region.name.toUpperCase()}\n`;
      report += `  Mean:    ${region.mean_temp}°C\n`;
      report += `  Min:     ${region.min_temp}°C\n`;
      report += `  Max:     ${region.max_temp}°C\n`;
      report += `  Std Dev: ${region.std_temp}°C\n\n`;
    });

    if (Object.keys(bilateralAsymmetry).length > 0) {
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += ` BILATERAL ASYMMETRY\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      Object.entries(bilateralAsymmetry).forEach(([key, value]) => {
        report += `${key}: ${value}°C\n`;
      });
      report += `\n`;
    }

    if (anomalies.length > 0) {
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += ` DETECTED ANOMALIES\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      anomalies.forEach((anomaly: string, index: number) => {
        report += `${index + 1}. ${anomaly}\n`;
      });
      report += `\n`;
    }

    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += ` RECOMMENDATIONS\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    recommendations.forEach((rec: string, index: number) => {
      report += `${index + 1}. ${rec}\n`;
    });

    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += ` RELEASE DECISION\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `${decision}\n\n`;
    report += `Release Recommended: ${analysisData.release_recommended ? "YES" : "NO"}\n\n`;

    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Report generated by ThermalVital Monitor\n`;
    report += `Gal Oya Wildlife Conservation Project\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return report;
  };

  // 📄 Generate Report HTML for PDF
  const generateReportHTML = () => {
    const date = new Date(timestamp).toLocaleString();
    
    const getStatusColor = () => {
      if (status.includes('Normal')) return '#2ECC71';
      if (status.includes('Mild')) return '#F1C40F';
      if (status.includes('Moderate')) return '#F39C12';
      if (status.includes('Critical')) return '#E74C3C';
      return '#3498DB';
    };
    
    const statusColor = getStatusColor();
    
    let regionsHTML = '';
    regions.forEach((region: any) => {
      regionsHTML += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${region.name.toUpperCase()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${region.mean_temp}°C</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${region.min_temp}°C</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${region.max_temp}°C</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${region.std_temp}°C</td>
        </tr>
      `;
    });
    
    let asymmetryHTML = '';
    if (Object.keys(bilateralAsymmetry).length > 0) {
      asymmetryHTML = '<h2 style="color: #E67E22; border-bottom: 2px solid #E67E22; padding-bottom: 10px;">Bilateral Asymmetry</h2><ul>';
      Object.entries(bilateralAsymmetry).forEach(([key, value]) => {
        asymmetryHTML += `<li><strong>${key}:</strong> ${value}°C</li>`;
      });
      asymmetryHTML += '</ul>';
    }
    
    let anomaliesHTML = '';
    if (anomalies.length > 0) {
      anomaliesHTML = '<h2 style="color: #E74C3C; border-bottom: 2px solid #E74C3C; padding-bottom: 10px;">⚠️ Detected Anomalies</h2><ul>';
      anomalies.forEach((anomaly: string) => {
        anomaliesHTML += `<li style="color: #C0392B;">${anomaly}</li>`;
      });
      anomaliesHTML += '</ul>';
    }
    
    let recommendationsHTML = '<ul>';
    recommendations.forEach((rec: string) => {
      recommendationsHTML += `<li>${rec}</li>`;
    });
    recommendationsHTML += '</ul>';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thermal Analysis Report - ${analysisId}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #0A1F17 0%, #1A3D2E 100%);
              color: white;
              padding: 30px;
              border-radius: 10px;
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header p { margin: 5px 0; opacity: 0.9; }
            .section {
              background: white;
              padding: 25px;
              margin-bottom: 20px;
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h2 {
              color: #2C3E50;
              border-bottom: 2px solid #3498DB;
              padding-bottom: 10px;
              margin-top: 0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .summary-item {
              padding: 15px;
              background: #ECF0F1;
              border-radius: 8px;
              border-left: 4px solid #3498DB;
            }
            .summary-item strong {
              display: block;
              color: #7F8C8D;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-item span { font-size: 18px; color: #2C3E50; font-weight: bold; }
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              background: ${statusColor};
              color: white;
              border-radius: 20px;
              font-weight: bold;
              font-size: 16px;
            }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #34495E; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:hover { background: #f5f5f5; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            .footer {
              text-align: center;
              padding: 20px;
              color: #7F8C8D;
              font-size: 12px;
              border-top: 2px solid #ECF0F1;
              margin-top: 30px;
            }
            .decision-box {
              background: ${analysisData.release_recommended ? '#D5F4E6' : '#FADBD8'};
              border: 2px solid ${analysisData.release_recommended ? '#27AE60' : '#E74C3C'};
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              color: ${analysisData.release_recommended ? '#27AE60' : '#E74C3C'};
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐆 THERMAL WILDLIFE HEALTH ANALYSIS REPORT</h1>
            <p><strong>ThermalVital Monitor System</strong></p>
            <p>Gal Oya Wildlife Conservation Project</p>
          </div>
          <div class="section">
            <h2>📋 Analysis Summary</h2>
            <p><strong>Analysis ID:</strong> ${analysisId}</p>
            <p><strong>Timestamp:</strong> ${date}</p>
            <p><strong>Species:</strong> ${animal}</p>
          </div>
          <div class="section">
            <h2>🌡️ Thermal Measurements</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>Leopard Temperature</strong>
                <span>${avgTemp}</span>
              </div>
              <div class="summary-item">
                <strong>Background Temperature</strong>
                <span>${backgroundTemp}</span>
              </div>
              <div class="summary-item">
                <strong>Thermal Stress Index</strong>
                <span>${tsi}</span>
              </div>
              <div class="summary-item">
                <strong>Confidence Score</strong>
                <span>${confidence}</span>
              </div>
            </div>
            <p><strong>Health Status:</strong> <span class="status-badge">${status}</span></p>
          </div>
          <div class="section">
            <h2>📊 Anatomical Region Analysis</h2>
            <table>
              <thead>
                <tr>
                  <th>Region</th>
                  <th style="text-align: center;">Mean Temp</th>
                  <th style="text-align: center;">Min Temp</th>
                  <th style="text-align: center;">Max Temp</th>
                  <th style="text-align: center;">Std Dev</th>
                </tr>
              </thead>
              <tbody>${regionsHTML}</tbody>
            </table>
          </div>
          ${asymmetryHTML ? `<div class="section">${asymmetryHTML}</div>` : ''}
          ${anomaliesHTML ? `<div class="section">${anomaliesHTML}</div>` : ''}
          <div class="section">
            <h2>💡 Recommendations</h2>
            ${recommendationsHTML}
          </div>
          <div class="section">
            <h2>✅ Release Decision</h2>
            <div class="decision-box">
              ${decision}
              <br><br>
              Release Recommended: ${analysisData.release_recommended ? 'YES ✓' : 'NO ✗'}
            </div>
          </div>
          <div class="footer">
            <p>Report generated by ThermalVital Monitor</p>
            <p>© ${new Date().getFullYear()} Gal Oya Wildlife Conservation Project</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.headerSection}>
            <Text style={styles.title}>Thermal Analysis Report</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Live Assessment</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Info label="DETECTED ANIMAL" value={animal} icon="🐆" />
            <Info label="LEOPARD TEMPERATURE" value={avgTemp} icon="🌡️" />
            <Info label="BACKGROUND TEMPERATURE" value={backgroundTemp} icon="🌡️" />
            <Info label="THERMAL STRESS INDEX (TSI)" value={tsi} icon="📊" />
            <Info label="HEALTH STATUS" value={status} icon="✅" />
            <Info label="CONFIDENCE" value={confidence} icon="🎯" />
            <View style={[styles.accentBar, { backgroundColor: "#E74C3C" }]} />
          </View>

          {/* Regional Temperatures */}
          {regions.length > 0 && (
            <View style={styles.regionsCard}>
              <Text style={styles.sectionTitle}>📍 Regional Analysis</Text>
              {regions.map((region: any, index: number) => (
                <View key={index} style={styles.regionItem}>
                  <Text style={styles.regionName}>{region.name.toUpperCase()}</Text>
                  <Text style={styles.regionTemp}>{region.mean_temp}°C</Text>
                </View>
              ))}
            </View>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <View style={styles.anomaliesCard}>
              <Text style={styles.sectionTitle}>⚠️ Detected Anomalies</Text>
              {anomalies.map((anomaly: string, index: number) => (
                <Text key={index} style={styles.anomalyText}>• {anomaly}</Text>
              ))}
            </View>
          )}

          <View style={styles.recommendationCard}>
            <Text style={styles.recoTitle}>🔬 AI Recommendation</Text>
            <Text style={styles.recoText}>{getRecommendation()}</Text>
          </View>

          {/* 🔥 REAL DECISION FROM BACKEND */}
          <Text style={styles.decisionText}>{decision}</Text>

          <View style={styles.navGroup}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push("ThermalView/tsiInfo" as any)}
            >
              <Text style={styles.navItemText}>What is TSI?</Text>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push("ThermalView/decision" as any)}
            >
              <Text style={styles.navItemText}>Release Decision Logic</Text>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push("ThermalView/history" as any)}
            >
              <Text style={styles.navItemText}>Thermal History Logs</Text>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Download Report Button */}
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={downloadReport}
          >
            <Text style={styles.downloadButtonText}>📥 Download Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("ThermalView/index" as any)}
          >
            <Text style={styles.primaryButtonText}>
              Analyze Another Image
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBg}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSection: { alignItems: "center", marginBottom: 30 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0A1F17",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5EE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#27AE60",
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#27AE60",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E8F5EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  label: {
    color: "#7F8C8D",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  value: { color: "#1A1A2E", fontSize: 18, fontWeight: "600" },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  recommendationCard: {
    backgroundColor: "#F0FAF4",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: "#27AE60",
    borderWidth: 1,
    borderColor: "#D5EDE0",
  },
  recoTitle: {
    color: "#1A1A2E",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  recoText: { color: "#4A6741", fontSize: 14, lineHeight: 20 },
  decisionText: {
    color: "#27AE60",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  navGroup: { marginBottom: 30 },
  navItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  navItemText: {
    color: "#2C3E50",
    fontSize: 14,
    fontWeight: "600",
  },
  navArrow: {
    color: "#27AE60",
    fontSize: 18,
    fontWeight: "bold",
  },
  downloadButton: {
    backgroundColor: "#3498DB",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  regionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    color: "#1A1A2E",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  regionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  regionName: {
    color: "#4A5568",
    fontSize: 14,
    fontWeight: "600",
  },
  regionTemp: {
    color: "#27AE60",
    fontSize: 16,
    fontWeight: "700",
  },
  anomaliesCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFCCCC",
  },
  anomalyText: {
    color: "#C0392B",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
});