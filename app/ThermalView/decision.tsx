import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

export default function DecisionScreen() {
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

  // 🔬 DYNAMIC DATA
  const species = "Sri Lankan Leopard";
  const tsi = 0.42;
  const decision = "Not Ready for Release";

  // ✅ FIXED LINE (ONLY CHANGE)
  const isReady = decision?.toLowerCase() === "ready for release";

  const accentColor = isReady ? "#2ECC71" : "#E74C3C"; // Green if ready, Red if not

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Section Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Final Release Decision</Text>
            <View style={[styles.statusBadge, { borderColor: accentColor }]}>
              <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.statusText, { color: accentColor }]}>
                Final Protocol Assessment
              </Text>
            </View>
          </View>

          {/* Decision Summary Card */}
          <View style={styles.card}>
            <View style={styles.dataRow}>
              <Text style={styles.label}>TARGET SPECIES</Text>
              <Text style={styles.value}>{species}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.dataRow}>
              <Text style={styles.label}>THERMAL STRESS INDEX</Text>
              <Text style={[styles.value, { color: accentColor }]}>{tsi}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.decisionContainer}>
              <Text style={styles.label}>FINAL DECISION</Text>
              <Text style={[styles.decisionText, { color: accentColor }]}>
                {decision.toUpperCase()}
              </Text>
            </View>

            {/* WildSense Accent Bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          </View>

          {/* Detailed Guidance Note */}
          <View style={[styles.noteBox, { borderLeftColor: accentColor }]}>
            <Text style={styles.noteTitle}>Clinical Recommendation</Text>
            <Text style={styles.noteText}>
              The current Thermal Stress Index (TSI){" "}
              <Text style={{ fontWeight: "700" }}>{tsi}</Text>, indicates elevated physiological stress beyond normal limits. According to wildlife release protocols, thermal parameters must stabilize before the animal can be safely transported or released.
            </Text>
          </View>

          {/* Research Context Footer */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              ⚠️ Decisions are calculated using species-specific baselines and
              should be cross-verified by a certified wildlife veterinarian.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 25,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1A3D2E",
    overflow: "hidden",
    elevation: 4,
  },
  dataRow: {
    marginVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#1A3D2E",
    marginVertical: 12,
  },
  label: {
    color: "#4A6B5A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  decisionContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  decisionText: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  noteBox: {
    backgroundColor: "#1A3D2E",
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  noteTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  noteText: {
    color: "#8BC4A9",
    fontSize: 14,
    lineHeight: 22,
  },
  footerInfo: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  footerText: {
    color: "#4A6B5A",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
  },
});
