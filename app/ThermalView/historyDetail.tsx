import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function HistoryDetail() {
  const { species, tsi, date } = useLocalSearchParams();
  const tsiValue = Number(tsi);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

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

  const getStatusData = () => {
    let status = "Normal";
    let color = "#2ECC71";

    if (species === "Leopard") {
      if (tsiValue > 0.55) {
        status = "High Stress";
        color = "#E74C3C";
      } else if (tsiValue > 0.3) {
        status = "Moderate Stress";
        color = "#F1C40F";
      }
    } else {
      if (tsiValue > 0.65) {
        status = "High Stress";
        color = "#E74C3C";
      } else if (tsiValue > 0.35) {
        status = "Moderate Stress";
        color = "#F1C40F";
      }
    }
    return { status, color };
  };

  const { status, color } = getStatusData();

  // ✅ RELEASE STATUS LOGIC
  const getReleaseStatus = () => {
    if (status === "Normal") return "Released";
    if (status === "Moderate Stress") return "Awaiting Release";
    return "Not Released";
  };

  const releaseStatus = getReleaseStatus();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.mainIcon}>
                {species === "Leopard" ? "🐆" : "🐻"}
              </Text>
            </View>
            <Text style={styles.title}>Thermal Record</Text>
          </View>

          {/* Main Detail Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>DATA ARCHIVE</Text>
              <View style={[styles.miniStatus, { backgroundColor: color }]}>
                <Text style={styles.miniStatusText}>{status}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <Info label="SPECIES" value={String(species)} />
              <Info label="CAPTURE DATE" value={String(date)} />
              <Info
                label="STRESS INDEX"
                value={String(tsi)}
                valueColor={color}
              />

              {/* ✅ NEW FIELD */}
              <Info
                label="RELEASE STATUS"
                value={releaseStatus}
                valueColor={
                  releaseStatus === "Released"
                    ? "#2ECC71"
                    : releaseStatus === "Awaiting Release"
                    ? "#F1C40F"
                    : "#E74C3C"
                }
              />

              <Info label="LOCATION" value="Gal Oya National Park" />
            </View>

            {/* WildSense Accent Bar */}
            <View style={[styles.accentBar, { backgroundColor: color }]} />
          </View>

          {/* Environmental Note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Field Observations</Text>
            <Text style={styles.note}>
              This record represents historical thermal conditions captured
              during field monitoring. Data used for longitudinal health
              assessment and conservation planning.
            </Text>
          </View>

          {/* Security Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 Authenticated WildSense Cryptographic Log
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Info({
  label,
  value,
  valueColor = "#FFFFFF",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A3D2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1A3D2E",
    marginBottom: 15,
  },
  mainIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 20,
    padding: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#1A3D2E",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3D2E",
    paddingBottom: 15,
  },
  cardHeaderText: {
    color: "#4A6B5A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  miniStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniStatusText: {
    color: "#0A1F17",
    fontSize: 10,
    fontWeight: "800",
  },
  infoGrid: {
    gap: 18,
  },
  infoItem: {
    borderLeftWidth: 2,
    borderLeftColor: "#1A3D2E",
    paddingLeft: 12,
  },
  label: {
    color: "#8BC4A9",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    fontWeight: "600",
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  noteBox: {
    backgroundColor: "#1A3D2E",
    padding: 20,
    borderRadius: 16,
  },
  noteTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  note: {
    color: "#8BC4A9",
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    color: "#4A6B5A",
    fontSize: 11,
    fontWeight: "600",
  },
});
