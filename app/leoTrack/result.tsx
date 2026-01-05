import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

const BACKEND_URL = "http://192.168.206.199:8000";

type Assessment = {
  alert_id: string;
  level: string;
  score: number;
};

export default function ResultScreen() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (!alertId) return;

    fetch(`${BACKEND_URL}/assessment/${alertId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) {
          setAssessment(null);
        } else {
          setAssessment(data);
        }
      })
      .catch(() => setAssessment(null))
      .finally(() => setLoading(false));
  }, [alertId]);

  const getColorByLevel = (level?: string) => {
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading assessment...</Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>No Assessment Found</Text>
        <Text style={styles.subtitle}>
          This sighting has not been assessed yet.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>
      <Text style={styles.title}>Assessment Result</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Severity Level</Text>
        <Text
          style={[
            styles.value,
            { color: getColorByLevel(assessment.level) },
          ]}
        >
          {assessment.level}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Risk Score</Text>
        <Text style={styles.score}>{assessment.score}%</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace("/leoTrack")}
      >
        <Text style={styles.primaryText}>New Assessment</Text>
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
    textAlign: "center",
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
  },
  primaryText: {
    textAlign: "center",
    color: "#022c22",
    fontWeight: "700",
  },
});
