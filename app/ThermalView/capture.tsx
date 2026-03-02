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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export default function ThermalCapture() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // 🔥 CORRECT WIFI IP (NOT localhost, NOT 172.x hotspot)
  const BACKEND_URL = "http://192.168.1.14:8000";

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

      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await fetch(
        `${BACKEND_URL}/api/thermal/analyze-thermal`,
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

      if (!response.ok) {
        throw new Error(`Backend error: ${rawText}`);
      }

      // Safely parse JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.log("❌ JSON Parse Error:", parseError);
        throw new Error("Invalid JSON from backend");
      }

      console.log("✅ Parsed backend data:", data);
      return data;
    } catch (error: any) {
      console.error("❌ FULL FETCH ERROR:", error);

      Alert.alert(
        "Connection Error",
        "Frontend could not process backend response.\n\nCheck:\n1. Backend running\n2. Same WiFi (192.168.1.14)\n3. Correct API URL"
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

    try {
      // 🚀 CALL FASTAPI BACKEND
      const analysisResult = await analyzeThermalImage(imageUri);

      console.log("🔥 FINAL ANALYSIS RESULT:", analysisResult);

      // 🎯 NAVIGATE WITH REAL BACKEND VALUES
      router.replace({
        pathname: "/ThermalView/analysis",
        params: {
          mean: String(analysisResult.average_temperature ?? "0"),
          tsi: String(analysisResult.tsi ?? "0"),
          status: String(analysisResult.stress_level ?? "Unknown"),
          decision: String(
            analysisResult.release_decision ?? "Pending Assessment"
          ),
        },
      });
    } catch (error) {
      console.log("⚠️ Navigation stopped due to API error");
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
            <Text style={styles.icon}>📸</Text>
          </View>

          <Text style={styles.title}>Thermal Image Capture</Text>
          <Text style={styles.subtitle}>
            Capture wildlife thermal images using a FLIR ONE device or upload
            previously captured thermal images for AI analysis
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
            Upload the thermal image for AI analysis
          </Text>
        </View>

        <TouchableOpacity onPress={openFlirApp} style={styles.flirButton}>
          <Text style={styles.buttonText}>Open FLIR ONE App</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          onPress={selectThermalImage}
          style={styles.uploadButton}
        >
          <Text style={styles.buttonText}>Upload Thermal Image</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          🔒 Images used only for research AI analysis
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1F17" },
  scrollContent: { padding: 20, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 30 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3D1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 32 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: { fontSize: 14, color: "#8BC4A9", textAlign: "center" },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2F23",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  step: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E74C3C",
    marginRight: 10,
  },
  instructionText: { fontSize: 14, color: "#CFFCF2" },
  flirButton: {
    backgroundColor: "#E74C3C",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#2ECC71",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#081417" },
  orText: { color: "#6B9F88", textAlign: "center", marginVertical: 12 },
  footerText: {
    color: "#6B9F88",
    textAlign: "center",
    marginTop: 30,
    fontSize: 12,
  },
});
