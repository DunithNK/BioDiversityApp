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

export default function ThermalIndex() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.95));

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
      Animated.timing(scaleAnim, {
        toValue: 1,
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
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🌡️</Text>
            </View>
            {/* Decorative rings */}
            <View style={[styles.ring, styles.ring1]} />
            <View style={[styles.ring, styles.ring2]} />
          </View>

          <Text style={styles.title}>Thermal Wildlife Monitoring</Text>
          <Text style={styles.subtitle}>
            Analyze thermal images to detect wildlife presence and assess health
            conditions using temperature patterns
          </Text>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Thermal Scanner Ready</Text>
          </View>
        </Animated.View>

        {/* Info Cards */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Heat Detection</Text>
              <Text style={styles.infoText}>
                Identify temperature patterns and anomalies in wildlife
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🎯</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Health Assessment</Text>
              <Text style={styles.infoText}>
                Monitor vital signs through thermal signatures
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push("/ThermalView/capture" as any)}
            style={styles.ctaButton}
            activeOpacity={0.85}
          >
            <View style={styles.ctaContent}>
              <Text style={styles.ctaText}>Start Thermal Analysis</Text>
              <View style={styles.ctaArrow}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
            <View style={styles.accentBar} />
          </TouchableOpacity>

          <Text style={styles.ctaHint}>
            Position thermal camera and capture image
          </Text>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View
          style={[
            styles.featuresGrid,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.featureBox}>
            <Text style={styles.featureValue}>TH</Text>
            <Text style={styles.featureLabel}>Thermal</Text>
          </View>
          <View style={styles.featureBox}>
            <Text style={styles.featureValue}>24/7</Text>
            <Text style={styles.featureLabel}>Active</Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 Advanced thermal imaging technology
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  // Header Section
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#E74C3C",
    zIndex: 2,
  },
  icon: {
    fontSize: 36,
  },
  ring: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#E74C3C",
  },
  ring1: {
    width: 90,
    height: 90,
    opacity: 0.25,
  },
  ring2: {
    width: 110,
    height: 110,
    opacity: 0.12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0A1F17",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#4A6741",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E74C3C",
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#E74C3C",
    fontWeight: "600",
  },

  // Info Section
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F7F9FC",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#E74C3C",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: "#0A1F17",
    fontWeight: "700",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#4A6741",
    lineHeight: 20,
  },

  // CTA Section
  ctaContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: "#F7F9FC",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E74C3C",
    overflow: "hidden",
    width: "100%",
    position: "relative",
    shadowColor: "#E74C3C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A1F17",
    letterSpacing: -0.3,
  },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E74C3C",
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#E74C3C",
  },
  ctaHint: {
    fontSize: 13,
    color: "#7F8C8D",
    marginTop: 12,
    textAlign: "center",
  },

  // Features Grid
  featuresGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  featureBox: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureValue: {
    fontSize: 20,
    color: "#E74C3C",
    fontWeight: "bold",
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 11,
    color: "#4A6741",
    textAlign: "center",
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
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#7F8C8D",
    textAlign: "center",
  },
});