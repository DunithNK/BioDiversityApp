import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TSIInfo() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

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
          {/* Header */}
          <Text style={styles.title}>Thermal Stress Index (TSI)</Text>

          <View style={styles.definitionCard}>
            <Text style={styles.text}>
              TSI is a normalized metric used to estimate physiological heat strain in
              wildlife. It leverages infrared thermography to monitor body temperature
              gradients against environmental baselines.
            </Text>
          </View>

          {/* Scientific Formula Section */}
          <View style={styles.formulaSection}>
            <Text style={styles.formulaLabel}>Metric Logic</Text>
            <Text style={styles.formula}>TSI = (Current_Mean_Temp- Baseline_Normal_Temp) / Baseline_Normal_Temp</Text>
          </View>

          {/* Leopard Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🐆</Text>
              <Text style={styles.cardTitle}>Sri Lankan Leopard</Text>
            </View>

            <ThresholdRow label="Normal" range="0.00 – 0.30" color="#27AE60" />
            <ThresholdRow label="Moderate Stress" range="0.31 – 0.55" color="#F39C12" />
            <ThresholdRow label="High Stress" range="> 0.55" color="#E74C3C" />

            <View style={[styles.accentBar, { backgroundColor: "#27AE60" }]} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.footer}>
              Thresholds are calibrated based on species-specific fur density,
              metabolic rate, and cutaneous evaporation capabilities.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ThresholdRow({ label, range, color }: { label: string; range: string; color: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelGroup}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color: color }]}>{range}</Text>
    </View>
  );
}

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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0A1F17",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  definitionCard: {
    backgroundColor: "#F0FAF4",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#27AE60",
    borderWidth: 1,
    borderColor: "#D5EDE0",
  },
  text: {
    color: "#2C3E50",
    fontSize: 15,
    lineHeight: 22,
  },
  formulaSection: {
    alignItems: "center",
    marginBottom: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#D0E8DA",
    borderRadius: 12,
    borderStyle: "dashed",
    backgroundColor: "#F7FCF9",
  },
  formulaLabel: {
    color: "#7F8C8D",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  formula: {
    color: "#1A7A40",
    fontFamily: "monospace",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    color: "#0A1F17",
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rowLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  rowLabel: {
    color: "#4A5568",
    fontSize: 14,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  infoBox: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  footer: {
    flex: 1,
    color: "#7F8C8D",
    fontSize: 12,
    lineHeight: 18,
  },
});