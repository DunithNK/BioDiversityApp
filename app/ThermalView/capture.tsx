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

  // 🔥 OPEN FLIR ONE APP (DIRECT + FALLBACK)
  const openFlirApp = async () => {
    const flirScheme = "flirone://";
    const appStoreUrl =
      "https://apps.apple.com/lk/app/flir-one/id875842742";

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

  // 📁 SELECT THERMAL IMAGE FROM GALLERY
const selectThermalImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Permission Required",
      "Please allow access to select a thermal image."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled) {
    // ✅ OPEN ANALYSIS PAGE AFTER UPLOAD
    router.replace("ThermalView/analysis");
  }
};


  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
            previously captured thermal images for analysis
          </Text>
        </Animated.View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.step}>1</Text>
          <Text style={styles.instructionText}>
            Capture thermal image using FLIR ONE camera
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.step}>2</Text>
          <Text style={styles.instructionText}>
            Upload the thermal image for analysis
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={openFlirApp}
          style={styles.flirButton}
        >
          <Text style={styles.buttonText}>Open FLIR ONE App</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          onPress={selectThermalImage}
          style={styles.uploadButton}
        >
          <Text style={styles.buttonText}>Upload Thermal Image</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          🔒 Images used only for research analysis
        </Text>
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
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3D1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#8BC4A9",
    textAlign: "center",
  },
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
  instructionText: {
    fontSize: 14,
    color: "#CFFCF2",
  },
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
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#081417",
  },
  orText: {
    color: "#6B9F88",
    textAlign: "center",
    marginVertical: 12,
  },
  footerText: {
    color: "#6B9F88",
    textAlign: "center",
    marginTop: 30,
    fontSize: 12,
  },
});
