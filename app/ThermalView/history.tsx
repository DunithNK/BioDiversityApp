import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";

const DATA = [
  { id: "1", date: "2025-01-02", species: "Leopard", tsi: 0.28 },
  { id: "2", date: "2025-01-03", species: "Sloth Bear", tsi: 0.48 },
  { id: "3", date: "2025-01-04", species: "Leopard", tsi: 0.61 },
];

export default function HistoryScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Logic to determine color based on species-specific thresholds
  const getStatusColor = (species: string, tsi: number) => {
    if (species === "Leopard") {
      if (tsi <= 0.30) return "#2ECC71";
      if (tsi <= 0.55) return "#F1C40F";
      return "#E74C3C";
    } else {
      // Sloth Bear
      if (tsi <= 0.35) return "#2ECC71";
      if (tsi <= 0.65) return "#F1C40F";
      return "#E74C3C";
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Thermal History</Text>
          <Text style={styles.subtitle}>GalOya Wildlife Stress Logs</Text>
        </View>

        <FlatList
          data={DATA}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.species, item.tsi);

            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "ThermalView/historyDetail",
                    params: {
                      species: item.species,
                      tsi: item.tsi.toString(),
                      date: item.date,
                    },
                  })
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.speciesContainer}>
                    <Text style={styles.speciesIcon}>
                      {item.species === "Leopard" ? "🐆" : "🐻"}
                    </Text>
                    <View>
                      <Text style={styles.speciesName}>{item.species}</Text>
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.tsiBadge,
                      {
                        backgroundColor: statusColor + "20",
                        borderColor: statusColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tsiValue,
                        { color: statusColor },
                      ]}
                    >
                      TSI: {item.tsi}
                    </Text>
                  </View>
                </View>

                {/* Subtle Progress Bar logic */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${item.tsi * 100}%`,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>

                {/* WildSense Accent Bar */}
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: statusColor },
                  ]}
                />
              </Pressable>
            );
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F17",
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8BC4A9",
    marginTop: 4,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#0F2F23",
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1A3D2E",
    overflow: "hidden",
    position: "relative",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  speciesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  speciesIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  speciesName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dateText: {
    color: "#4A6B5A",
    fontSize: 12,
    fontWeight: "600",
  },
  tsiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tsiValue: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#1A3D2E",
    borderRadius: 2,
    marginTop: 10,
    width: "100%",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.5,
  },
});
