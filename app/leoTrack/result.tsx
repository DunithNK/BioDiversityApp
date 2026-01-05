import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ResultScreen() {
  const router = useRouter();
  const { level, score } = useLocalSearchParams<{
    level?: string;
    score?: string;
  }>();

  const getColorByLevel = () => {
    switch (level) {
      case "Low":
        return "#22c55e";
      case "Moderate":
        return "#eab308";
      case "High":
        return "#f97316";
      case "Critical":
        return "#ef4444";
      default:
        return "#38bdf8";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>

      <Text style={styles.title}>Assessment Result</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Severity Level</Text>
        <Text style={[styles.value, { color: getColorByLevel() }]}>
          {level ?? "Unknown"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Risk Score</Text>
        <Text style={styles.score}>{score ?? "0"}%</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace("/leoTrack")}
      >
        <Text style={styles.primaryText}>New Assessment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.back()}
      >
        <Text style={styles.secondaryText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  label: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },
  score: {
    fontSize: 26,
    fontWeight: "800",
    color: "#38bdf8",
    textAlign: "center",
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 16,
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
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
  },
  secondaryText: {
    textAlign: "center",
    color: "#e5e7eb",
    fontWeight: "600",
  },
});
