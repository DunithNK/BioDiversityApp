import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { saveDetection } from "./storage";

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: "live" | "recorded" }>();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
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

    const saveWithLocation = async () => {
      let latitude, longitude;

      if (mode === "live") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      }

      saveDetection({
        id: Date.now().toString(),
        mode,
        date: new Date().toLocaleString(),
        latitude,
        longitude,
        frequency: "280 – 520 Hz",
        distance: "180 – 230 m",
        confidence: 87,
      });
    };

    saveWithLocation();
  }, []);

  return (
    <View style={styles.container}>
      {/* Success Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.successBadge}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Detection Complete!</Text>
        <Text style={styles.subtitle}>
          Successfully identified leopard vocalization
        </Text>
      </Animated.View>

      {/* Species Card */}
      <Animated.View
        style={[
          styles.speciesCard,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.speciesHeader}>
          <Text style={styles.speciesIcon}>🐆</Text>
          <View style={styles.speciesInfo}>
            <Text style={styles.speciesLabel}>Species Detected</Text>
            <Text style={styles.speciesName}>Sri Lankan Leopard</Text>
            <Text style={styles.scientificName}>Panthera pardus kotiya</Text>
          </View>
        </View>
      </Animated.View>

      {/* Detection Details */}
      <Animated.View
        style={[
          styles.detailsContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Detection Details</Text>

        <View style={styles.detailsGrid}>
          {/* Mode */}
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>
              {mode === "live" ? "🎙️" : "📁"}
            </Text>
            <Text style={styles.detailLabel}>Mode</Text>
            <Text style={styles.detailValue}>
              {mode === "live" ? "Live Recording" : "Uploaded File"}
            </Text>
          </View>

          {/* Confidence */}
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>📊</Text>
            <Text style={styles.detailLabel}>Confidence</Text>
            <Text style={[styles.detailValue, styles.confidenceValue]}>
              87%
            </Text>
          </View>

          {/* Frequency */}
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>〰️</Text>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>280 – 520 Hz</Text>
          </View>

          {/* Distance */}
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>180 – 230 m</Text>
          </View>
        </View>
      </Animated.View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/SoundTrack/history")}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>View Detection History</Text>
          <Text style={styles.btnIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/SoundTrack")}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>New Detection</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💾 Detection saved to history
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
    padding: 24,
  },

  // Header Styles
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 28,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#2ECC71",
  },
  successIcon: {
    fontSize: 40,
    color: "#2ECC71",
    fontWeight: "bold",
  },
  title: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#8BC4A9",
    textAlign: "center",
  },

  // Species Card
  speciesCard: {
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  speciesHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  speciesIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesLabel: {
    fontSize: 13,
    color: "#8BC4A9",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  speciesName: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    color: "#2ECC71",
    fontStyle: "italic",
  },

  // Details Section
  detailsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailCard: {
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    borderWidth: 1,
    borderColor: "#1A3D2E",
    alignItems: "center",
  },
  detailIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8BC4A9",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  confidenceValue: {
    color: "#2ECC71",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Button Container
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#2ECC71",
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#0A1F17",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 8,
  },
  btnIcon: {
    color: "#0A1F17",
    fontSize: 20,
    fontWeight: "bold",
  },
  secondaryBtn: {
    backgroundColor: "#0F2F23",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  secondaryBtnText: {
    textAlign: "center",
    color: "#2ECC71",
    fontWeight: "600",
    fontSize: 16,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 13,
    color: "#6B9F88",
  },
});