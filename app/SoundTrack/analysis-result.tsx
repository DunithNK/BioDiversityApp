import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type RecordingResult = {
  id?: number;
  label?: string | null;
  overall_label?: string | null;
  overall_is_leopard?: boolean;
  confidence?: number | null;
  best_confidence?: number | null;
  distance_m?: number | null;
  distance_min_m?: number | null;
  distance_max_m?: number | null;
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type LiveSessionResult = {
  id?: number;
  device_id?: string | null;
  overall_is_leopard?: boolean;
  best_confidence?: number | null;
  last_detected_at?: string | null;
  started_at?: string;
  ended_at?: string | null;
  last_location?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  distance?: {
    estimated_m?: number | null;
    min_m?: number | null;
    max_m?: number | null;
    confidence?: number | null;
  } | null;
};

export default function AnalysisResultScreen() {
  const router = useRouter();

  const { mode, recording, liveSession, audioName } = useLocalSearchParams<{
    mode?: "live" | "recorded";
    recording?: string;
    liveSession?: string;
    audioName?: string;
  }>();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const parsedRecording: RecordingResult | null = useMemo(() => {
    if (!recording) return null;

    try {
      return JSON.parse(recording);
    } catch (error) {
      console.error("Failed to parse recording result:", error);
      return null;
    }
  }, [recording]);

  const parsedLiveSession: LiveSessionResult | null = useMemo(() => {
    if (!liveSession) return null;

    try {
      return JSON.parse(liveSession);
    } catch (error) {
      console.error("Failed to parse live session result:", error);
      return null;
    }
  }, [liveSession]);

  useEffect(() => {
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
  }, [fadeAnim, scaleAnim]);

  const isLive = mode === "live";

  const detectionLabel = useMemo(() => {
    if (isLive) {
      return parsedLiveSession?.overall_is_leopard
        ? "Sri Lankan Leopard"
        : "No Leopard Detected";
    }

    const rawLabel =
      parsedRecording?.overall_label ?? parsedRecording?.label ?? null;

    if (!rawLabel) {
      return parsedRecording?.overall_is_leopard
        ? "Sri Lankan Leopard"
        : "No Leopard Detected";
    }

    return rawLabel;
  }, [isLive, parsedLiveSession, parsedRecording]);

  const scientificName = useMemo(() => {
    if (!parsedLiveSession?.overall_is_leopard) {
      return "";
    }

    if (detectionLabel.toLowerCase().includes("leopard")) {
      return "Panthera pardus kotiya";
    }
    return "No matching leopard vocalization";
  }, [detectionLabel, parsedLiveSession]);

  const confidence = useMemo(() => {
    if (isLive) {
      return parsedLiveSession?.best_confidence ?? null;
    }

    return (
      parsedRecording?.best_confidence ?? parsedRecording?.confidence ?? null
    );
  }, [isLive, parsedLiveSession, parsedRecording]);

  const formattedConfidence = useMemo(() => {
    if (confidence == null) return "N/A";

    const normalized = confidence <= 1 ? confidence * 100 : confidence;
    return `${Math.round(normalized)}%`;
  }, [confidence]);

  const distanceText = useMemo(() => {
    if (isLive) {
      const min = parsedLiveSession?.distance?.min_m;
      const max = parsedLiveSession?.distance?.max_m;
      const exact = parsedLiveSession?.distance?.estimated_m;

      if (!parsedLiveSession?.overall_is_leopard) {
        return "N/A";
      }

      if (min != null && max != null) {
        return `${Math.round(min)} – ${Math.round(max)} m`;
      }

      if (exact != null) {
        return `${Math.round(exact)} m`;
      }

      return "N/A";
    }

    const min = parsedRecording?.distance_min_m;
    const max = parsedRecording?.distance_max_m;
    const exact = parsedRecording?.distance_m;

    if (min != null && max != null) {
      return `${Math.round(min)} – ${Math.round(max)} m`;
    }

    if (exact != null) {
      return `${Math.round(exact)} m`;
    }

    return "N/A";
  }, [isLive, parsedLiveSession, parsedRecording]);

  const locationText = useMemo(() => {
    if (isLive) {
      const lat = parsedLiveSession?.last_location?.latitude;
      const lng = parsedLiveSession?.last_location?.longitude;

      if (lat != null && lng != null) {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }

      return "Unavailable";
    }

    const lat = parsedRecording?.latitude;
    const lng = parsedRecording?.longitude;

    if (lat != null && lng != null) {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    return "Unavailable";
  }, [isLive, parsedLiveSession, parsedRecording]);

  const detectedAt = useMemo(() => {
    const rawDate = isLive
      ? (parsedLiveSession?.last_detected_at ?? parsedLiveSession?.started_at)
      : parsedRecording?.created_at;

    if (!rawDate) return "Unavailable";

    try {
      return new Date(rawDate).toLocaleString();
    } catch {
      return String(rawDate);
    }
  }, [isLive, parsedLiveSession, parsedRecording]);

  const isDetected = useMemo(() => {
    if (isLive) return !!parsedLiveSession?.overall_is_leopard;
    return !!parsedRecording?.overall_is_leopard;
  }, [isLive, parsedLiveSession, parsedRecording]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.successBadge, !isDetected && styles.neutralBadge]}>
          <Text style={[styles.successIcon, !isDetected && styles.neutralIcon]}>
            {isDetected ? "✓" : "!"}
          </Text>
        </View>

        <Text style={styles.title}>
          {isDetected ? "Detection Complete!" : "Analysis Complete"}
        </Text>

        <Text style={styles.subtitle}>
          {isDetected
            ? "Leopard vocalization analysis finished successfully"
            : "No leopard vocalization detected in this sample"}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.speciesCard,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.speciesHeader}>
          <Text style={styles.speciesIcon}>{isDetected ? "🐆" : "🎧"}</Text>
          <View style={styles.speciesInfo}>
            <Text style={styles.speciesLabel}>Analysis Result</Text>
            <Text style={styles.speciesName}>{detectionLabel}</Text>
            <Text style={styles.scientificName}>{scientificName}</Text>
          </View>
        </View>
      </Animated.View>

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
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>{isLive ? "🎙️" : "📁"}</Text>
            <Text style={styles.detailLabel}>Mode</Text>
            <Text style={styles.detailValue}>
              {isLive ? "Live Recording" : "Uploaded File"}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>📊</Text>
            <Text style={styles.detailLabel}>Confidence</Text>
            <Text style={[styles.detailValue, styles.confidenceValue]}>
              {formattedConfidence}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{locationText}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>📏</Text>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{distanceText}</Text>
          </View>

          <View style={styles.fullWidthCard}>
            <Text style={styles.detailIcon}>🕒</Text>
            <Text style={styles.detailLabel}>Detected At</Text>
            <Text style={styles.detailValue}>{detectedAt}</Text>
          </View>

          {!isLive && audioName ? (
            <View style={styles.fullWidthCard}>
              <Text style={styles.detailIcon}>🎵</Text>
              <Text style={styles.detailLabel}>Audio File</Text>
              <Text style={styles.detailValue}>{audioName}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

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

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ Detection data loaded from backend
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },

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
  neutralBadge: {
    borderColor: "#8BC4A9",
  },
  successIcon: {
    fontSize: 40,
    color: "#2ECC71",
    fontWeight: "bold",
  },
  neutralIcon: {
    color: "#8BC4A9",
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
  fullWidthCard: {
    backgroundColor: "#0F2F23",
    borderRadius: 16,
    padding: 16,
    width: "100%",
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

  footer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 13,
    color: "#6B9F88",
  },

  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
});
