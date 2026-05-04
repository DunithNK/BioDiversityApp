import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Location from "expo-location";

import {
  createLiveSession,
  getLiveSession,
  uploadLiveChunk,
  type LiveChunkUploadResponse,
  type LiveSessionSummary,
} from "@/services/liveSessions";

const LIVE_RECORD_SECONDS = 8;
const DEFAULT_REGION: Region = {
  latitude: 7.19,
  longitude: 81.46,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type TrackingPoint = {
  latitude: number;
  longitude: number;
};

type DetectionMarker = {
  id: string;
  coordinate: TrackingPoint;
  isLeopard: boolean;
  confidence?: number | null;
  detectedAt: string;
};

export default function TrackingScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId?: string }>();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const mapRef = useRef<MapView | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const [pathPoints, setPathPoints] = useState<TrackingPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<TrackingPoint | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<number | null>(null);
  const [sessionSummary, setSessionSummary] = useState<LiveSessionSummary | null>(null);
  const [detectionMarkers, setDetectionMarkers] = useState<DetectionMarker[]>([]);
  const [statusText, setStatusText] = useState("Ready to start route tracking");

  useEffect(() => {
    return () => {
      watcherRef.current?.remove();
    };
  }, []);

  const ensureLiveSession = async () => {
    if (liveSessionId) {
      return liveSessionId;
    }

    const session = await createLiveSession(deviceId);
    setLiveSessionId(session.id);
    return session.id;
  };

  const startTracking = async () => {
    try {
      setInitializing(true);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location required", "Please enable location to track your route.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const startPoint = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setCurrentLocation(startPoint);
      setPathPoints([startPoint]);
      setTrackingActive(true);
      setStatusText("Tracking live route on the map");

      mapRef.current?.animateToRegion(
        {
          ...startPoint,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );

      watcherRef.current?.remove();
      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (update) => {
          const nextPoint = {
            latitude: update.coords.latitude,
            longitude: update.coords.longitude,
          };

          setCurrentLocation(nextPoint);
          setPathPoints((prev) => {
            const lastPoint = prev[prev.length - 1];
            if (
              lastPoint &&
              lastPoint.latitude === nextPoint.latitude &&
              lastPoint.longitude === nextPoint.longitude
            ) {
              return prev;
            }
            return [...prev, nextPoint];
          });
        },
      );
    } catch (error) {
      console.error("Failed to start tracking:", error);
      Alert.alert("Error", "Failed to start live tracking");
    } finally {
      setInitializing(false);
    }
  };

  const stopTracking = () => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    setTrackingActive(false);
    setStatusText("Tracking paused. Your marked route remains visible.");
  };

  const analyzeLiveAudio = async () => {
    if (!trackingActive || !currentLocation) {
      Alert.alert("Tracking required", "Start tracking before live audio analysis.");
      return;
    }

    try {
      setAnalyzing(true);
      setStatusText("Recording live audio and sending it for analysis");

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone required", "Please enable microphone to analyze live sound.");
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: LIVE_RECORD_SECONDS });

      await new Promise((resolve) =>
        setTimeout(resolve, LIVE_RECORD_SECONDS * 1000 + 800),
      );

      if (recorder.isRecording) {
        await recorder.stop();
      }

      const audioUri = recorder.uri;
      if (!audioUri) {
        throw new Error("No recorded audio file was created");
      }

      const sessionId = await ensureLiveSession();

      const response: LiveChunkUploadResponse = await uploadLiveChunk({
        liveId: sessionId,
        fileUri: audioUri,
        fileName: `tracking-live-${Date.now()}.m4a`,
        mimeType: "audio/mp4",
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      const summary = await getLiveSession(sessionId);

      setSessionSummary(summary);
      setStatusText(
        response.chunk.is_leopard
          ? "Leopard-like sound detected on your tracked route"
          : "Live sound analyzed successfully on your tracked route",
      );

      setDetectionMarkers((prev) => [
        ...prev,
        {
          id: `${response.chunk.id}`,
          coordinate: currentLocation,
          isLeopard: response.chunk.is_leopard,
          confidence: response.chunk.confidence,
          detectedAt: response.chunk.created_at,
        },
      ]);
    } catch (error) {
      console.error("Failed to analyze live audio:", error);
      Alert.alert("Live analysis failed", "Unable to analyze live audio on the tracking map.");
    } finally {
      setAnalyzing(false);
    }
  };

  const region =
    currentLocation == null
      ? DEFAULT_REGION
      : {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>TRACK</Text>
        </View>
        <Text style={styles.title}>Live Route Tracking</Text>
        <Text style={styles.subtitle}>
          Mark your movement path on the map and run live sound checks as you go
        </Text>
      </View>

      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          followsUserLocation={trackingActive}
          mapType="terrain"
        >
          {pathPoints.length > 1 ? (
            <Polyline
              coordinates={pathPoints}
              strokeColor="#0F9D58"
              strokeWidth={5}
            />
          ) : null}

          {pathPoints[0] ? (
            <Marker coordinate={pathPoints[0]} pinColor="#2563EB" title="Route Start" />
          ) : null}

          {currentLocation ? (
            <Marker coordinate={currentLocation} pinColor="#16A34A" title="Current Position" />
          ) : null}

          {detectionMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              pinColor={marker.isLeopard ? "#DC2626" : "#D97706"}
              title={marker.isLeopard ? "Leopard Detection" : "Audio Checked"}
              description={`Confidence: ${
                marker.confidence == null
                  ? "N/A"
                  : `${Math.round(
                      marker.confidence <= 1
                        ? marker.confidence * 100
                        : marker.confidence,
                    )}%`
              }`}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.statusPanel}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Tracking</Text>
          <Text style={styles.statusValue}>
            {trackingActive ? "Active" : "Stopped"}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Route Points</Text>
          <Text style={styles.statusValue}>{pathPoints.length}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Live Session</Text>
          <Text style={styles.statusValue}>
            {liveSessionId == null ? "Not started" : `#${liveSessionId}`}
          </Text>
        </View>
        <Text style={styles.statusHint}>{statusText}</Text>
        {sessionSummary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Latest Live Result</Text>
            <Text style={styles.summaryText}>
              Detection: {sessionSummary.overall_is_leopard ? "Leopard" : "No leopard"}
            </Text>
            <Text style={styles.summaryText}>
              Confidence:{" "}
              {sessionSummary.best_confidence == null
                ? "N/A"
                : `${Math.round(
                    sessionSummary.best_confidence <= 1
                      ? sessionSummary.best_confidence * 100
                      : sessionSummary.best_confidence,
                  )}%`}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.primaryButton, trackingActive && styles.secondaryButton]}
          onPress={trackingActive ? stopTracking : startTracking}
          disabled={initializing}
          activeOpacity={0.85}
        >
          {initializing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.primaryButtonText,
                trackingActive && styles.secondaryButtonText,
              ]}
            >
              {trackingActive ? "Stop Tracking" : "Start Tracking"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.analyzeButton, (!trackingActive || analyzing) && styles.disabledButton]}
          onPress={analyzeLiveAudio}
          disabled={!trackingActive || analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analyze Live Audio</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FAF7",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 14,
  },
  headerBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    marginBottom: 10,
  },
  headerBadgeText: {
    color: "#166534",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
  },
  mapCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  map: {
    width: "100%",
    height: 360,
  },
  statusPanel: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  statusValue: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  statusHint: {
    color: "#166534",
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    marginTop: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  summaryTitle: {
    color: "#14532D",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  summaryText: {
    color: "#166534",
    fontSize: 14,
    marginBottom: 2,
  },
  buttonRow: {
    marginTop: 18,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  secondaryButtonText: {
    color: "#16A34A",
  },
  analyzeButton: {
    backgroundColor: "#111827",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
});
