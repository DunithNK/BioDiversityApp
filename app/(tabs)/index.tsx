import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const features = [
    {
      id: 1,
      title: "Leopard Health Tracker",
      description: "Upload images and assess leopard health conditions",
      route: "/leoTrack",
      icon: "🐆",
      gradient: ["#059669", "#047857"],
    },
    {
      id: 2,
      title: "Footprint Identification",
      description: "Identify animals using footprints and ground signs",
      route: "/footPrint",
      icon: "🐾",
      gradient: ["#0891b2", "#0e7490"],
    },
    {
      id: 3,
      title: "Sound Track Analysis",
      description: "Wildlife detection using acoustic signals",
      route: "/SoundTrack",
      icon: "🎵",
      gradient: ["#7c3aed", "#6d28d9"],
    },
    {
      id: 4,
      title: "Thermal View",
      description: "Thermal-based wildlife condition monitoring",
      route: "/ThermalView",
      icon: "🌡️",
      gradient: ["#dc2626", "#b91c1c"],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🦁</Text>
          </View>
          <Text style={styles.title}>WildSense</Text>
          <Text style={styles.subtitle}>
            Advanced Wildlife Health & Monitoring Platform
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Select a Feature</Text>
          
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.card}
              onPress={() => router.push(feature.route)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{feature.icon}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDesc}>{feature.description}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by AI-driven wildlife conservation technology
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1a2333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2a3547",
  },
  logoIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#8b9bb4",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7a94",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#151d2e",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1a2333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 14,
    color: "#7f8ea3",
    lineHeight: 20,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1a2333",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  arrow: {
    fontSize: 18,
    color: "#6b7a94",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  footerText: {
    fontSize: 12,
    color: "#5a6b84",
    textAlign: "center",
  },
});