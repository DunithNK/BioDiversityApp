import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PROCESSING_STEPS = [
  {
    id: 1,
    text: "Extracting frequency spectrum",
    duration: 1000,
    icon: "〰️",
  },
  {
    id: 2,
    text: "Detecting leopard vocal patterns",
    duration: 2000,
    icon: "🐆",
  },
  {
    id: 3,
    text: "Estimating distance and location",
    duration: 3000,
    icon: "📍",
  },
  {
    id: 4,
    text: "Calculating confidence score",
    duration: 3500,
    icon: "📊",
  },
];

export default function ProcessingScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  const waveAnims = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ])[0];

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse center icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

    // ✅ FIXED WAVEFORM ANIMATION (height → JS driver)
    waveAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400 + index * 100,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400 + index * 100,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    });

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 35);

    // Step progression
    const stepTimers = PROCESSING_STEPS.map((step, index) =>
      setTimeout(() => setCurrentStep(index + 1), step.duration),
    );

    // Navigate to results
    const navigationTimer = setTimeout(() => {
      router.replace({
        pathname: "/SoundTrack/analysis-result",
        params: { mode },
      } as any);
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      stepTimers.forEach(clearTimeout);
      clearTimeout(navigationTimer);
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analyzing Sound</Text>
          <Text style={styles.subtitle}>
            {mode === "live" ? "🎙️ Live Recording" : "📁 Uploaded File"}
          </Text>
        </View>

        {/* Animation */}
        <View style={styles.animationContainer}>
          <View style={styles.waveformContainer}>
            {waveAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 80],
                    }),
                    opacity: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[styles.centerIcon, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🎧</Text>
            </View>
          </Animated.View>

          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#2ECC71" />
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Processing Steps</Text>
          {PROCESSING_STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepIconContainer}>
                {index < currentStep ? (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                ) : index === currentStep - 1 ? (
                  <ActivityIndicator size="small" color="#2ECC71" />
                ) : (
                  <View style={styles.pendingDot} />
                )}
              </View>
              <Text
                style={[
                  styles.stepText,
                  index < currentStep && styles.stepTextCompleted,
                  index === currentStep - 1 && styles.stepTextActive,
                ]}
              >
                {step.icon} {step.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>AI Analysis in Progress</Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
    minHeight: "100%",
  },

  header: { alignItems: "center", marginTop: 0 },
  title: { fontSize: 32, color: "#FFF", fontWeight: "bold" },
  subtitle: { fontSize: 15, color: "#8BC4A9", marginTop: 10 },

  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
  },

  waveformContainer: {
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    height: 100,
  },
  waveBar: {
    width: 6,
    backgroundColor: "#2ECC71",
    borderRadius: 3,
  },

  centerIcon: { position: "absolute" },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#2ECC71",
  },
  iconText: { fontSize: 48 },

  spinnerContainer: {
    position: "absolute",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },

  progressSection: { marginVertical: 32 },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#1A3D2E",
    borderRadius: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2ECC71",
  },
  progressText: {
    color: "#2ECC71",
    textAlign: "right",
    fontWeight: "bold",
  },

  stepsContainer: {
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#1A3D2E",
  },
  stepsTitle: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "bold",
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#0A1F17",
    fontWeight: "bold",
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1A3D2E",
    borderWidth: 2,
    borderColor: "#2ECC71",
  },
  stepText: { color: "#6B9F88" },
  stepTextActive: { color: "#2ECC71", fontWeight: "600" },
  stepTextCompleted: { color: "#8BC4A9" },

  footer: { alignItems: "center", marginBottom: 20 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A3D2E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2ECC71",
    marginTop: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    marginRight: 10,
  },
  statusText: { color: "#2ECC71", fontWeight: "600" },

  scrollContent: {
    flexGrow: 1,
  },
});
