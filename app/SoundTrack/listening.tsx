import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getDeviceIdentifier } from "@/services/deviceInfo";
import { createLiveSession } from "@/services/liveSessions";
import { createRecording } from "@/services/recordings";

export default function ListeningScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<"live" | "recorded" | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setAudioUri(file.uri);
      setAudioName(file.name);
      setAudioMimeType(file.mimeType ?? "audio/wav");
    } catch (error) {
      Alert.alert("Error", "Failed to pick audio file");
    }
  };

  const handleProcess = async () => {
    if (!mode) {
      Alert.alert("Mode required", "Please select a mode first");
      return;
    }

    if (mode === "recorded" && !audioUri) {
      Alert.alert("Audio required", "Please select an audio file first");
      return;
    }

    try {
      setSubmitting(true);

      const deviceId = await getDeviceIdentifier();

      if (mode === "live") {
        const session = await createLiveSession(deviceId);

        router.push({
          pathname: "/SoundTrack/processing",
          params: {
            mode: "live",
            liveSessionId: String(session.id),
            deviceId,
          },
        });

        return;
      }

      if (mode === "recorded" && audioUri) {
        const recording = await createRecording(
          audioUri,
          audioName ?? "recording.wav",
          audioMimeType ?? "audio/wav",
          deviceId,
        );

        router.push({
          pathname: "/SoundTrack/processing",
          params: {
            mode: "recorded",
            recordingId: String(recording.id),
            audioName: audioName ?? "",
            deviceId,
          },
        });
      }
    } catch (error) {
      console.error("Failed to start processing:", error);
      Alert.alert("Error", "Failed to start processing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.headerIcon}>🎧</Text>
        </View>
        <Text style={styles.title}>Sound Listening</Text>
        <Text style={styles.subtitle}>
          Choose how you want to capture leopard sounds
        </Text>
      </View>

      {/* Mode Selection Cards */}
      <View style={styles.cardsContainer}>
        {/* LIVE MODE */}
        <TouchableOpacity
          style={[styles.card, mode === "live" && styles.activeCard]}
          onPress={() => {
            setMode("live");
            setAudioUri(null);
            setAudioName(null);
            setAudioMimeType(null);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View
              style={[styles.iconBox, mode === "live" && styles.activeIconBox]}
            >
              <Text style={styles.cardIcon}>🎙️</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Live Listening</Text>
              <Text style={styles.cardDesc}>
                Capture real-time forest sounds from your environment
              </Text>
            </View>
          </View>
          {mode === "live" && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* RECORDED MODE */}
        <TouchableOpacity
          style={[styles.card, mode === "recorded" && styles.activeCard]}
          onPress={() => setMode("recorded")}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View
              style={[
                styles.iconBox,
                mode === "recorded" && styles.activeIconBox,
              ]}
            >
              <Text style={styles.cardIcon}>📁</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Recorded Audio</Text>
              <Text style={styles.cardDesc}>
                Upload a previously recorded audio file
              </Text>
            </View>
          </View>
          {mode === "recorded" && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* AUDIO PICKER */}
      {mode === "recorded" && (
        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickAudioFile}>
            <View style={styles.uploadContent}>
              <Text style={styles.uploadIcon}>{audioUri ? "🎵" : "📤"}</Text>
              <View style={styles.uploadTextContainer}>
                <Text style={styles.uploadTitle}>
                  {audioUri ? "Audio Selected" : "Select Audio File"}
                </Text>
                {audioName && (
                  <Text style={styles.uploadFileName} numberOfLines={1}>
                    {audioName}
                  </Text>
                )}
                {!audioUri && (
                  <Text style={styles.uploadHint}>Tap to browse files</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* PROCESS BUTTON */}
      <TouchableOpacity
        disabled={submitting || !mode || (mode === "recorded" && !audioUri)}
        style={[
          styles.processBtn,
          (submitting || !mode || (mode === "recorded" && !audioUri)) &&
            styles.disabledBtn,
        ]}
        onPress={handleProcess}
        activeOpacity={0.9}
      >
        <Text style={styles.processText}>
          {submitting
            ? "Please wait..."
            : mode === "live"
              ? "Start Listening"
              : "Process Audio"}
        </Text>
        <Text style={styles.processIcon}>→</Text>
      </TouchableOpacity>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Your audio data is processed securely
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header Styles
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#16A34A",
  },
  headerIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    color: "#111827",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Cards Container
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },

  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCard: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activeIconBox: {
    backgroundColor: "#16A34A",
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 30,
  },
  cardTitle: {
    fontSize: 19,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  checkmark: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Upload Section
  uploadSection: {
    marginTop: 8,
  },
  uploadBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: "#16A34A",
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 4,
  },
  uploadFileName: {
    fontSize: 13,
    color: "#16A34A",
    marginTop: 2,
  },
  uploadHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Process Button
  processBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
    marginTop: 20,
  },
  disabledBtn: {
    backgroundColor: "#D1FAE5",
    opacity: 0.6,
    shadowOpacity: 0,
  },
  processText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 8,
  },
  processIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
});