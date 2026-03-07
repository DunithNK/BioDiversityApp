import React, { useEffect, useState } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { API_CONFIG } from "@/constants/api";

export default function ThermalCapture() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [isUploading, setIsUploading] = useState(false);

  // Backend URL from config
  const BACKEND_URL = API_CONFIG.BACKEND_URL;

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

  // 🔥 OPEN FLIR ONE APP
  const openFlirApp = async () => {
    const flirScheme = "flirone://";
    const appStoreUrl = "https://apps.apple.com/lk/app/flir-one/id875842742";

    try {
      const supported = await Linking.canOpenURL(flirScheme);
      if (supported) {
        await Linking.openURL(flirScheme);
      } else {
        await Linking.openURL(appStoreUrl);
      }
    } catch {
      Alert.alert(
        "FLIR ONE",
        "Unable to open FLIR ONE app. Please open it manually."
      );
    }
  };

  // 🧠 FINAL STABLE API CALL (EXPO + FASTAPI COMPATIBLE)
  const analyzeThermalImage = async (imageUri: string) => {
    try {
      console.log("📡 Uploading image to backend:", imageUri);

      const formData = new FormData();

      // 🔥 CRITICAL FIX FOR iOS + Expo FormData
      const filename = imageUri.split("/").pop() || "thermal.jpg";
      const fileExtension = filename.split(".").pop();
      const mimeType = fileExtension
        ? `image/${fileExtension}`
        : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await fetch(
        `${BACKEND_URL}/api/analyze`, // ✅ Leopard detection enabled
        {
          method: "POST",
          body: formData,
          // ❗ DO NOT set Content-Type manually in React Native
        }
      );

      console.log("📡 Response status:", response.status);

      // Read raw response first (prevents silent crash)
      const rawText = await response.text();
      console.log("📦 Raw backend response:", rawText);

      // Safely parse JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.log("❌ JSON Parse Error:", parseError);
        throw new Error("Invalid JSON from backend");
      }

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === 'No leopard detected in image') {
          // detected_animals is already a formatted string from backend
          const animals = data.detected_animals || 'other animals';
          Alert.alert(
            "❌ No Leopard Detected",
            `This image contains ${animals}.\n\nPlease upload a thermal image containing a leopard for health analysis.`,
            [{ text: "OK" }]
          );
          throw new Error(data.error);
        }
        throw new Error(`Backend error: ${rawText}`);
      }

      console.log("✅ Parsed backend data:", data);
      return data;
    } catch (error: any) {
      console.error("❌ FULL FETCH ERROR:", error);

      // If it's a leopard detection error, the alert was already shown
      if (error.message && error.message.includes('No leopard detected')) {
        throw error; // Don't show connection error, just propagate
      }

      // Show connection error only for network issues
      Alert.alert(
        "Connection Error",
        "Could not connect to thermal analysis backend.\n\nCheck:\n1. Backend running (python3 app.py)\n2. API URL correct\n3. For device: use Mac IP instead of localhost"
      );

      throw error;
    }
  };

  // 📁 SELECT IMAGE & SEND TO BACKEND
  const selectThermalImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access to upload thermal images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ FIXED (no deprecated API)
      quality: 1,
    });

    if (result.canceled) return;

    const imageUri = result.assets[0].uri;

    setIsUploading(true); // Show loading indicator

    try {
      // 🚀 CALL BACKEND
      const analysisResult = await analyzeThermalImage(imageUri);

      console.log("🔥 FINAL ANALYSIS RESULT:", analysisResult);

      // 🎯 NAVIGATE WITH FULL ANALYSIS DATA
      const analysis = analysisResult.analysis || analysisResult;
      
      router.replace({
        pathname: "/ThermalView/analysis",
        params: {
          // Pass full analysis as JSON string
          analysisData: JSON.stringify(analysis),
          analysisId: analysisResult.analysis_id || "",
          annotatedImage: analysisResult.annotated_image || "",
        },
      });
    } catch (error: any) {
      console.log("⚠️ Navigation stopped due to error:", error.message);
      // Error alert already shown in analyzeThermalImage function
    } finally {
      setIsUploading(false); // Hide loading indicator
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🐆</Text>
          </View>

          <Text style={styles.title}>Thermal Leopard Capture</Text>
          <Text style={styles.subtitle}>
            Capture leopard thermal images using a FLIR ONE device or upload
            previously captured thermal images for Analysis
          </Text>
        </Animated.View>

        <View style={styles.instructionCard}>
          <Text style={styles.step}>1</Text>
          <Text style={styles.instructionText}>
            Capture thermal image using FLIR ONE camera
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.step}>2</Text>
          <Text style={styles.instructionText}>
            Upload the thermal image for Analysis
          </Text>
        </View>

        <TouchableOpacity
          onPress={openFlirApp}
          style={styles.flirButton}
          disabled={isUploading}
        >
          <Text style={styles.flirButtonText}>Open FLIR ONE App</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          onPress={selectThermalImage}
          style={[styles.uploadButton, isUploading && styles.disabledButton]}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.uploadButtonText, { marginLeft: 10 }]}>
                Analyzing Image...
              </Text>
            </View>
          ) : (
            <Text style={styles.uploadButtonText}>Upload Thermal Image</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          🔒 Images used only for research Analysis
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { padding: 20, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 30 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCCCC",
  },
  icon: { fontSize: 32 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0A1F17",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: { fontSize: 14, color: "#4A6741", textAlign: "center" },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  step: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E74C3C",
    marginRight: 10,
  },
  instructionText: { fontSize: 14, color: "#2C3E50" },
  flirButton: {
    backgroundColor: "#E74C3C",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#E74C3C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  flirButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  uploadButton: {
    backgroundColor: "#27AE60",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  orText: { color: "#7F8C8D", textAlign: "center", marginVertical: 12, fontWeight: "600" },
  footerText: {
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 30,
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});