import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as Application from "expo-application";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Location from "expo-location";

import {
  endLiveSession,
  getLiveSession,
  getLiveSessionStatus,
  uploadLiveChunk,
} from "@/services/liveSessions";
import { getRecording, getRecordingStatus } from "@/services/recordings";

const LIVE_RECORD_SECONDS = 8;

const PROCESSING_STEPS = [
  { id: 1, text: "Extracting frequency spectrum", duration: 1000, icon: "〰️" },
  { id: 2, text: "Detecting leopard vocal patterns", duration: 2000, icon: "🐆" },
  { id: 3, text: "Estimating distance and location", duration: 3000, icon: "📍" },
  { id: 4, text: "Calculating confidence score", duration: 3500, icon: "📊" },
];

export default function ProcessingScreen() {
  const router = useRouter();

  const { mode, recordingId, liveSessionId, audioName } = useLocalSearchParams<{
    mode?: string;
    recordingId?: string;
    liveSessionId?: string;
    audioName?: string;
  }>();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState("Initializing");
  const [statusHint, setStatusHint] = useState("Preparing analysis pipeline");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [capturedLocation, setCapturedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    const loadDeviceLabel = async () => {
      try {
        let id = "";

        if (Platform.OS === "android") {
          id = Application.getAndroidId();
        } else if (Platform.OS === "ios") {
          id = (await Application.getIosIdForVendorAsync()) ?? "";
        }

        const appName = Application.applicationName ?? "BioDiversityApp";
        const appId = Application.applicationId ?? "unknown-app";

        setDeviceLabel(
          id ? `${appName} • ${appId} • ${id}` : `${appName} • ${appId}`,
        );
      } catch (error) {
        console.error("Failed to load device info:", error);
        setDeviceLabel(Application.applicationId ?? "Unknown device");
      }
    };

    loadDeviceLabel();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

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
  }, [fadeAnim, pulseAnim, waveAnims]);

  useEffect(() => {
    let isMounted = true;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const setSafeStep = (value: number) => { if (isMounted) setCurrentStep(value); };
    const setSafeProgress = (value: number) => { if (isMounted) setProgress(value); };
    const setSafeBackendStatus = (value: string) => { if (isMounted) setBackendStatus(value); };
    const setSafeStatusHint = (value: string) => { if (isMounted) setStatusHint(value); };

    const getPhoneLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          setSafeStatusHint("Location permission denied. Continuing without GPS coordinates.");
          return null;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        if (isMounted) setCapturedLocation(coords);
        return coords;
      } catch (error) {
        console.error("Failed to get location:", error);
        return null;
      }
    };

    const recordChunkFromMicrophone = async () => {
      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) throw new Error("Microphone permission denied");

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();

      setSafeBackendStatus("recording");
      setSafeStatusHint(`Recording ${LIVE_RECORD_SECONDS} seconds from microphone`);
      setSafeStep(1);
      setSafeProgress(12);

      recorder.record({ forDuration: LIVE_RECORD_SECONDS });
      await sleep(LIVE_RECORD_SECONDS * 1000 + 800);

      if (recorder.isRecording) await recorder.stop();

      const uri = recorder.uri;
      if (!uri) throw new Error("No audio file was created after recording");
      return uri;
    };

    const processRecorded = async () => {
      if (!recordingId) {
        Alert.alert("Error", "Recording ID not found");
        router.back();
        return;
      }

      setSafeStep(1);
      setSafeProgress(15);
      setSafeBackendStatus("uploaded");
      setSafeStatusHint("Audio file uploaded successfully");

      let attempts = 0;
      let isComplete = false;

      while (isMounted && attempts < 40) {
        attempts += 1;

        const statusResponse = await getRecordingStatus(Number(recordingId));
        const status = String(statusResponse.status ?? "").toLowerCase();

        if (!isMounted) return;

        setSafeBackendStatus(status || "unknown");

        if (status === "uploaded") {
          setSafeStep(1);
          setSafeProgress(Math.min(20 + attempts, 30));
          setSafeStatusHint("Waiting for server to start analysis");
        } else if (status === "processing") {
          if (attempts >= 2) setSafeStep(2);
          if (attempts >= 4) setSafeStep(3);
          if (attempts >= 6) setSafeStep(4);
          setSafeProgress(Math.min(35 + attempts * 2, 92));
          setSafeStatusHint("Server is analyzing the uploaded recording");
        } else if (status === "failed") {
          throw new Error("Recording processing failed");
        } else if (status === "completed") {
          isComplete = true;
          break;
        }

        await sleep(1500);
      }

      if (!isComplete) throw new Error("Recording processing timed out");

      const recording = await getRecording(Number(recordingId));
      if (!isMounted) return;

      setSafeStep(PROCESSING_STEPS.length);
      setSafeProgress(100);
      setSafeBackendStatus("completed");
      setSafeStatusHint("Preparing detection result");

      setTimeout(() => {
        if (!isMounted) return;
        router.replace({
          pathname: "/SoundTrack/analysis-result",
          params: { mode: "recorded", recording: JSON.stringify(recording), audioName: audioName ?? "" },
        } as any);
      }, 500);
    };

    const processLive = async () => {
      if (!liveSessionId) {
        Alert.alert("Error", "Live session ID not found");
        router.back();
        return;
      }

      setSafeStatusHint("Preparing microphone and GPS");
      const coords = await getPhoneLocation();
      const liveAudioUri = await recordChunkFromMicrophone();

      if (!isMounted) return;

      setSafeStep(2);
      setSafeProgress(35);
      setSafeBackendStatus("uploading");
      setSafeStatusHint("Uploading live audio chunk to server");

      await uploadLiveChunk({
        liveId: Number(liveSessionId),
        fileUri: liveAudioUri,
        fileName: `live-${Date.now()}.m4a`,
        mimeType: Platform.OS === "ios" ? "audio/x-m4a" : "audio/mp4",
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        chunkIndex: 0,
      });

      if (!isMounted) return;

      setSafeStep(3);
      setSafeProgress(52);
      setSafeBackendStatus("idle");
      setSafeStatusHint("Waiting for live session analysis");

      let attempts = 0;
      let isComplete = false;

      while (isMounted && attempts < 40) {
        attempts += 1;

        const statusResponse = await getLiveSessionStatus(Number(liveSessionId));
        const processingStatus = String(statusResponse.processing_status ?? "").toLowerCase();

        if (!isMounted) return;

        setSafeBackendStatus(processingStatus || "unknown");

        if (processingStatus === "idle") {
          setSafeProgress(Math.min(55 + attempts, 64));
          setSafeStatusHint("Session is queued on the server");
        } else if (processingStatus === "processing") {
          setSafeStep(4);
          setSafeProgress(Math.min(66 + attempts * 2, 92));
          setSafeStatusHint("Server is analyzing the live recording");
        } else if (processingStatus === "failed") {
          throw new Error("Live session processing failed");
        } else if (processingStatus === "completed") {
          isComplete = true;
          break;
        }

        await sleep(1500);
      }

      if (!isComplete) throw new Error("Live session processing timed out");

      const session = await getLiveSession(Number(liveSessionId));
      if (!isMounted) return;

      await endLiveSession(Number(liveSessionId));
      if (!isMounted) return;

      setSafeStep(PROCESSING_STEPS.length);
      setSafeProgress(100);
      setSafeBackendStatus("completed");
      setSafeStatusHint("Preparing live session result");

      setTimeout(() => {
        if (!isMounted) return;
        router.replace({
          pathname: "/SoundTrack/analysis-result",
          params: {
            mode: "live",
            liveSession: JSON.stringify({ ...session, location: coords ?? undefined }),
          },
        } as any);
      }, 500);
    };

    const runProcessing = async () => {
      try {
        if (mode === "recorded") { await processRecorded(); return; }
        if (mode === "live") { await processLive(); return; }
        Alert.alert("Error", "Invalid processing mode");
        router.back();
      } catch (error) {
        console.error("Processing failed:", error);
        Alert.alert("Error", "Failed to process audio");
        router.back();
      }
    };

    runProcessing();

    return () => { isMounted = false; };
  }, [mode, recordingId, liveSessionId, audioName, recorder, router]);

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

        {/* Waveform Animation */}
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
                      outputRange: [0.2, 0.8],
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
            <ActivityIndicator size="large" color="#16A34A" />
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Status Info Card */}
        <View style={styles.statusInfoCard}>
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusInfoLabel}>Backend Status</Text>
            <Text style={styles.statusInfoValue}>{backendStatus}</Text>
          </View>

          <Text style={styles.statusHint}>{statusHint}</Text>

          {deviceLabel ? (
            <Text style={styles.metaLabel} numberOfLines={1}>
              Device: {deviceLabel}
            </Text>
          ) : null}

          {capturedLocation ? (
            <Text style={styles.metaLabel} numberOfLines={1}>
              Location: {capturedLocation.latitude.toFixed(5)},{" "}
              {capturedLocation.longitude.toFixed(5)}
            </Text>
          ) : null}

          {audioName ? (
            <Text style={styles.metaLabel} numberOfLines={1}>
              File: {audioName}
            </Text>
          ) : null}
        </View>

        {/* Processing Steps */}
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
                  <ActivityIndicator size="small" color="#16A34A" />
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

        {/* Footer Badge */}
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
    backgroundColor: "#F9FAFB",
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
    minHeight: "100%",
  },

  // Header
  header: { alignItems: "center", marginTop: 0 },
  title: { fontSize: 32, color: "#111827", fontWeight: "bold" },
  subtitle: { fontSize: 15, color: "#6B7280", marginTop: 10 },

  // Animation
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
    backgroundColor: "#16A34A",
    borderRadius: 3,
  },
  centerIcon: { position: "absolute" },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#16A34A",
  },
  iconText: { fontSize: 48 },
  spinnerContainer: {
    position: "absolute",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },

  // Progress
  progressSection: { marginVertical: 32 },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#16A34A",
  },
  progressText: {
    color: "#16A34A",
    textAlign: "right",
    fontWeight: "bold",
    marginTop: 8,
  },

  // Status Info Card
  statusInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfoLabel: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  statusInfoValue: {
    color: "#16A34A",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusHint: {
    color: "#374151",
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  metaLabel: {
    color: "#9CA3AF",
    marginTop: 10,
    fontSize: 12,
  },

  // Steps
  stepsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepsTitle: {
    fontSize: 16,
    color: "#111827",
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
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  stepText: { color: "#9CA3AF" },
  stepTextActive: { color: "#16A34A", fontWeight: "600" },
  stepTextCompleted: { color: "#6B7280" },

  // Footer
  footer: { alignItems: "center", marginBottom: 20 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#16A34A",
    marginTop: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 10,
  },
  statusText: { color: "#16A34A", fontWeight: "600" },

  scrollContent: {
    flexGrow: 1,
  },
});