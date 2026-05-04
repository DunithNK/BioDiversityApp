import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getHistory } from "@/services/history";

export default function SoundTrackHome() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [detectionCount, setDetectionCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadDetectionCount = async () => {
        try {
          const history = await getHistory();
          const leopardDetections = history.filter((item) => item.is_leopard);
          setDetectionCount(leopardDetections.length);
        } catch (error) {
          console.error("Failed to load detection count:", error);
        }
      };

      loadDetectionCount();
    }, []),
  );

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🎧</Text>
            </View>
            <View style={styles.waveContainer}>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
              <View style={[styles.wave, styles.wave3]} />
            </View>
          </View>

          <Text style={styles.title}>Eco-Acoustic Monitor</Text>
          <Text style={styles.subtitle}>
            Advanced parabolic microphone system for wildlife detection and
            conservation
          </Text>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>System Ready</Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{detectionCount}</Text>
            <Text style={styles.statLabel}>Total Detections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🐆</Text>
            <Text style={styles.statLabel}>Sri Lankan Leopard</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>📡</Text>
            <Text style={styles.statLabel}>Active Monitoring</Text>
          </View>
        </Animated.View>

        {/* Primary Action */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/SoundTrack/listening")}
            activeOpacity={0.9}
          >
            <View style={styles.btnContent}>
              <View style={styles.btnIconContainer}>
                <Text style={styles.btnIcon}>🎙️</Text>
              </View>
              <View style={styles.btnTextContainer}>
                <Text style={styles.primaryText}>Start Listening</Text>
                <Text style={styles.primarySubtext}>Begin audio detection</Text>
              </View>
              <Text style={styles.btnArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Explore Features</Text>

          {/* Map Card */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push("/SoundTrack/map")}
            activeOpacity={0.8}
          >
            <View style={styles.featureIconBox}>
              <Text style={styles.featureIcon}>🗺️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Hotspot Map</Text>
              <Text style={styles.featureDesc}>
                View leopard detection locations across Gal Oya National Park
              </Text>
            </View>
            <View style={styles.featureArrow}>
              <Text style={styles.featureArrowText}>›</Text>
            </View>
          </TouchableOpacity>

          {/* History Card */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push("/SoundTrack/history")}
            activeOpacity={0.8}
          >
            <View style={styles.featureIconBox}>
              <Text style={styles.featureIcon}>📋</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Detection History</Text>
              <Text style={styles.featureDesc}>
                Browse all recorded leopard vocalizations and analysis
              </Text>
            </View>
            <View style={styles.featureArrow}>
              <Text style={styles.featureArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Section */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>How It Works</Text>
              <Text style={styles.infoText}>
                Our parabolic microphone captures distant wildlife sounds, which
                are analyzed using a trained sound recognition model developed
                through this research to identify Sri Lankan leopard
                vocalizations.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🌿</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Conservation Impact</Text>
              <Text style={styles.infoText}>
                Your detections help researchers track leopard populations and
                protect their habitat in Gal Oya National Park.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },

  // Hero Section
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#16A34A",
    zIndex: 2,
  },
  logoIcon: {
    fontSize: 48,
  },
  waveContainer: {
    position: "absolute",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  wave1: {
    width: 120,
    height: 120,
    opacity: 0.25,
  },
  wave2: {
    width: 140,
    height: 140,
    opacity: 0.15,
  },
  wave3: {
    width: 160,
    height: 160,
    opacity: 0.08,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#16A34A",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },

  // Stats Section
  statsSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    color: "#16A34A",
    fontWeight: "bold",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 14,
  },

  // Primary Action
  actionSection: {
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  btnIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  btnIcon: {
    fontSize: 28,
  },
  btnTextContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  primarySubtext: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  btnArrow: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // Features Section
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "bold",
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  featureArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  featureArrowText: {
    fontSize: 24,
    color: "#16A34A",
    fontWeight: "bold",
  },

  // Info Section
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});