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

export default function HomeScreen() {
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

  const features = [
    {
      id: 1,
      title: "Leopard Health Tracker",
      description: "Upload images and assess leopard health conditions",
      route: "/leoTrack",
      icon: "🐆",
      color: "#2ECC71",
      bgColor: "#1A3D2E",
    },
    {
      id: 2,
      title: "Footprint Identification",
      description: "Identify animals using footprints and ground signs",
      route: "/footPrint",
      icon: "🐾",
      color: "#3498DB",
      bgColor: "#1A2E3D",
    },
    {
      id: 3,
      title: "Sound Track Analysis",
      description: "Wildlife detection using acoustic signals",
      route: "/SoundTrack",
      icon: "🎵",
      color: "#9B59B6",
      bgColor: "#2C1A3D",
    },
    {
      id: 4,
      title: "Thermal View",
      description: "Thermal-based wildlife condition monitoring",
      route: "/ThermalView",
      icon: "🌡️",
      color: "#E74C3C",
      bgColor: "#3D1A1A",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.logoIcon}>🦁</Text>
            </View>
            {/* Decorative rings */}
            <View style={[styles.ring, styles.ring1]} />
            <View style={[styles.ring, styles.ring2]} />
          </View>

          <Text style={styles.title}>WildSense GalOya</Text>
          <Text style={styles.subtitle}>
            Advanced Wildlife Health & Monitoring Platform
          </Text>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>All Systems Operational</Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Tools</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Model</Text>
            <Text style={styles.statLabel}>based Analysis</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Monitoring</Text>
          </View>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select a Feature</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a monitoring tool to get started
            </Text>
          </View>

          {features.map((feature, index) => (
            <Animated.View
              key={feature.id}
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
                style={styles.card}
                onPress={() => router.push(feature.route as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: feature.bgColor },
                    ]}
                  >
                    <Text style={styles.icon}>{feature.icon}</Text>
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{feature.title}</Text>
                    <Text style={styles.cardDesc}>{feature.description}</Text>
                  </View>

                  <View
                    style={[
                      styles.arrowContainer,
                      { backgroundColor: feature.bgColor },
                    ]}
                  >
                    <Text
                      style={[styles.arrow, { color: feature.color }]}
                    >
                      →
                    </Text>
                  </View>
                </View>

                {/* Accent bar */}
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: feature.color },
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
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
            <Text style={styles.infoIcon}>🔬</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Model-based Analysis</Text>
              <Text style={styles.infoText}>
                Machine-learning-based sound analysis for wildlife monitoring and health assessment
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🌍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Conservation Focus</Text>
              <Text style={styles.infoText}>
                Supporting Sri Lankan leopard conservation through advanced
                technology and real-time monitoring
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            🔒 Powered by research-based wildlife conservation technology
          </Text>
          <Text style={styles.footerSubtext}>
            Committed to protecting endangered species
          </Text>
        </View>
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
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Hero Section
  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2ECC71",
    zIndex: 2,
  },
  logoIcon: {
    fontSize: 40,
  },
  ring: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  ring1: {
    width: 100,
    height: 100,
    opacity: 0.3,
  },
  ring2: {
    width: 120,
    height: 120,
    opacity: 0.15,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: "#8BC4A9",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2ECC71",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#2ECC71",
    fontWeight: "600",
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1A3D2E",
  },
  statValue: {
    fontSize: 24,
    color: "#2ECC71",
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#8BC4A9",
    textAlign: "center",
  },

  // Features Section
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#8BC4A9",
  },
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#1A3D2E",
    overflow: "hidden",
    position: "relative",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 14,
    color: "#8BC4A9",
    lineHeight: 20,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 20,
    fontWeight: "bold",
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2ECC71",
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#8BC4A9",
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    alignItems: "center",
    paddingTop: 20,
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#1A3D2E",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#6B9F88",
    textAlign: "center",
    marginBottom: 6,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#4A6B5A",
    textAlign: "center",
  },
});   