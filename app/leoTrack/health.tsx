import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

const BACKEND_URL = "http://192.168.206.199:8000";

export default function HealthAssessment() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    limping: false,
    visible_injury: false,
    abnormal_behavior: false,
    near_human_area: false,
  });

  const activeCount = Object.values(form).filter(Boolean).length;
  const riskScore = activeCount * 25;

  const getRiskLevel = () => {
    if (riskScore === 0) return "None";
    if (riskScore <= 25) return "Low";
    if (riskScore <= 50) return "Moderate";
    if (riskScore <= 75) return "High";
    return "Critical";
  };

  const submitAssessment = async () => {
    if (!alertId) {
      Alert.alert("Error", "Missing alert reference");
      return;
    }

    setSubmitting(true);

    const severity = getRiskLevel();

    try {
      await fetch(`${BACKEND_URL}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertId,
          severity,
          score: riskScore,
          indicators: form,
        }),
      });
    } catch {
      Alert.alert("Warning", "Failed to save assessment to backend");
    } finally {
      setSubmitting(false);
      router.push(
        `/leoTrack/result?alertId=${alertId}` as any
      );
    }
  };

  const renderSwitch = (label: string, key: keyof typeof form) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={form[key]}
        onValueChange={(value) =>
          setForm({ ...form, [key]: value })
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Assessment</Text>

      {renderSwitch("Limping observed", "limping")}
      {renderSwitch("Visible injury", "visible_injury")}
      {renderSwitch("Abnormal behavior", "abnormal_behavior")}
      {renderSwitch("Near human settlement", "near_human_area")}

      <TouchableOpacity
        style={[
          styles.button,
          submitting && { opacity: 0.6 },
        ]}
        onPress={submitAssessment}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Saving..." : "Submit Assessment"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#022c22",
  },
});
