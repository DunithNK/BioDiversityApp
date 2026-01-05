import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function LeoTrackScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleTakeImage = () => {
    setImage(
      "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=800&q=80"
    );
  };

  const handleUploadImage = () => {
    setImage(
      "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80"
    );
  };

  const handleContinue = () => {
    if (!image) {
      Alert.alert("No Image", "Please take or upload an image first");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/leoTrack/health");
    }, 800);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🐆</Text>

      <Text style={styles.title}>Leopard Health Tracker</Text>
      <Text style={styles.subtitle}>
        Capture or upload an image of the observed leopard
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleTakeImage}
      >
        <Text style={styles.primaryText}>Take Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleUploadImage}
      >
        <Text style={styles.secondaryText}>Upload Image</Text>
      </TouchableOpacity>

      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueButton, loading && { opacity: 0.6 }]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.continueText}>
          {loading ? "Analyzing..." : "Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center",
  },
  icon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryText: {
    textAlign: "center",
    color: "#022c22",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  secondaryText: {
    textAlign: "center",
    color: "#e5e7eb",
    fontWeight: "600",
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholder: {
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 12,
  },
  continueButton: {
    backgroundColor: "#f59e0b",
    padding: 14,
    borderRadius: 10,
  },
  continueText: {
    textAlign: "center",
    color: "#451a03",
    fontWeight: "700",
  },
});
