import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ThermalAnalysis() {
  const router = useRouter();
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

  // 🔬 MOCK ANALYSIS VALUES
  const animal = "Sri Lankan Leopard";
  const avgTemp = "38.6 °C";
  const tsi = "0.27";
  const status = "Normal";
  const decision = "Releasing Pre-Requisites";

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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Thermal Analysis Report</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Live AI Assessment</Text>
            </View>
          </View>

          {/* Main Results Card */}
          <View style={styles.card}>
            <Info label="DETECTED ANIMAL" value={animal} icon="🐆" />
            <Info label="AVERAGE TEMPERATURE" value={avgTemp} icon="🌡️" />
            <Info label="THERMAL STRESS INDEX (TSI)" value={tsi} icon="📊" />
            <Info label="HEALTH STATUS" value={status} icon="✅" />
            
            {/* WildSense Accent Bar */}
            <View style={[styles.accentBar, { backgroundColor: "#E74C3C" }]} />
          </View>

          {/* Recommendation Section */}
          <View style={styles.recommendationCard}>
            <Text style={styles.recoTitle}>🔬 AI Recommendation</Text>
            <Text style={styles.recoText}>
              Thermal indicators are within normal physiological limits.
              No signs of heat stress detected.
            </Text>
          </View>

          <Text style={styles.decisionText}>{decision}</Text>

          {/* Navigation Links (Styled as WildSense Menu) */}
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

          {/* Primary Action */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("ThermalView/index" as any)}
          >
            <Text style={styles.primaryButtonText}>Analyze Another Image</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: string }) {
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
  container: {
    flex: 1,
    backgroundColor: "#0A1F17", // WildSense BG
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E74C3C", // Red accent for Thermal
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ECC71",
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#2ECC71",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1A3D2E",
    overflow: "hidden",
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
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  label: {
    color: "#8BC4A9", // WildSense Secondary Text
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  recommendationCard: {
    backgroundColor: "#1A3D2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: "#2ECC71",
  },
  recoTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  recoText: {
    color: "#8BC4A9",
    fontSize: 14,
    lineHeight: 20,
  },
  decisionText: {
    color: "#2ECC71",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  navGroup: {
    marginBottom: 30,
  },
  navItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F2F23",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1A3D2E",
  },
  navItemText: {
    color: "#8BC4A9",
    fontSize: 14,
    fontWeight: "600",
  },
  navArrow: {
    color: "#2ECC71",
    fontSize: 18,
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#2ECC71",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: "#0A1F17",
    fontSize: 16,
    fontWeight: "700",
  },
});