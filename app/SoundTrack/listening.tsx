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

export default function ListeningScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<"live" | "recorded" | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setAudioUri(file.uri);
      setAudioName(file.name);
    } catch (error) {
      Alert.alert("Error", "Failed to pick audio file");
    }
  };

  const handleProcess = () => {
    if (mode === "recorded" && !audioUri) {
      Alert.alert("Audio required", "Please select an audio file first");
      return;
    }

    router.push({
      pathname: "/SoundTrack/processing",
      params: {
        mode,
        audioUri,
      },
    } as any);
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
        disabled={!mode || (mode === "recorded" && !audioUri)}
        style={[
          styles.processBtn,
          (!mode || (mode === "recorded" && !audioUri)) && styles.disabledBtn,
        ]}
        onPress={handleProcess}
        activeOpacity={0.9}
      >
        <Text style={styles.processText}>
          {mode === "live" ? "Start Listening" : "Process Audio"}
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
    backgroundColor: "#0A1F17",
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
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#2ECC71",
  },
  headerIcon: {
    fontSize: 36,
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
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#1A3D2E",
    position: "relative",
  },
  activeCard: {
    borderColor: "#2ECC71",
    backgroundColor: "#123B2C",
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activeIconBox: {
    backgroundColor: "#2ECC71",
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
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: "#8BC4A9",
    lineHeight: 20,
  },
  checkmark: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#0A1F17",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Upload Section
  uploadSection: {
    marginTop: 8,
  },
  uploadBtn: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: "#2ECC71",
    borderStyle: "dashed",
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
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  uploadFileName: {
    fontSize: 13,
    color: "#2ECC71",
    marginTop: 2,
  },
  uploadHint: {
    fontSize: 13,
    color: "#6B9F88",
    marginTop: 2,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Process Button
  processBtn: {
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
    marginBottom: 16,
    marginTop: 20,
  },
  disabledBtn: {
    backgroundColor: "#1A3D2E",
    opacity: 0.5,
    shadowOpacity: 0,
  },
  processText: {
    color: "#0A1F17",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 8,
  },
  processIcon: {
    color: "#0A1F17",
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
    color: "#6B9F88",
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
});
