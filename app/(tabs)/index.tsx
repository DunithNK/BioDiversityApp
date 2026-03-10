import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [cardAnims] = useState(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.stagger(
        90,
        cardAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
          })
        )
      ).start();
    });
  }, []);

  const features = [
    {
      id: 1,
      title: "Leopard Health Tracker",
      description: "Upload images to analyze leopard health conditions.",
      route: "/leoTrack",
      icon: "✦",
      tag: "Vision AI",
      tagColor: "#16A34A",
      tagBg: "#DCFCE7",
      cardBg: "#D1FAE5",
      iconBg: "#16A34A",
      blobColor: "#A7F3D0",
    },
    {
      id: 2,
      title: "Footprint Identification",
      description: "Identify wildlife using ground tracks.",
      route: "/footPrint",
      icon: "⬡",
      tag: "Pattern Recognition",
      tagColor: "#0284C7",
      tagBg: "#E0F2FE",
      cardBg: "#E0F2FE",
      iconBg: "#0284C7",
      blobColor: "#BAE6FD",
    },
    {
      id: 3,
      title: "Sound Track Analysis",
      description: "Detect wildlife through acoustic signals.",
      route: "/SoundTrack",
      icon: "◎",
      tag: "Audio AI",
      tagColor: "#7C3AED",
      tagBg: "#EDE9FE",
      cardBg: "#EDE9FE",
      iconBg: "#7C3AED",
      blobColor: "#DDD6FE",
    },
    {
      id: 4,
      title: "Thermal View",
      description: "Monitor wildlife conditions using thermal imaging.",
      route: "/ThermalView",
      icon: "◈",
      tag: "Thermal Imaging",
      tagColor: "#EA580C",
      tagBg: "#FFEDD5",
      cardBg: "#FFEDD5",
      iconBg: "#EA580C",
      blobColor: "#FED7AA",
    },
  ];

  const infoCards = [
    {
      id: 1,
      icon: "🔬",
      title: "ML-Based Analysis",
      description: "Machine-learning models trained on wildlife field data.",
    },
    {
      id: 2,
      icon: "🌍",
      title: "Conservation Monitoring",
      description: "Real-time monitoring protecting Sri Lanka's leopards.",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <Animated.View
          style={[
            styles.topHeader,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </View>
            <View>
              <Text style={styles.appName}>WildSense</Text>
              <Text style={styles.appTagline}>AI Wildlife Monitoring Platform</Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </Animated.View>

        {/* ── Green Banner ── */}
        <Animated.View
          style={[
            styles.banner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.bannerIconBox}>
            <Text style={styles.bannerIcon}>⊕</Text>
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>4 AI Monitoring Tools Active</Text>
            <Text style={styles.bannerSub}>
              Real-time monitoring for Gal Oya National Park
            </Text>
          </View>
        </Animated.View>

        {/* ── 2-Column Feature Grid ── */}
        <View style={styles.grid}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.id}
              style={{
                opacity: cardAnims[index],
                transform: [
                  {
                    scale: cardAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
                width: CARD_WIDTH,
              }}
            >
              <TouchableOpacity
                style={[styles.card, { backgroundColor: feature.cardBg }]}
                onPress={() => router.push(feature.route as any)}
                activeOpacity={0.8}
              >
                {/* Decorative blob */}
                <View
                  style={[styles.blob, { backgroundColor: feature.blobColor }]}
                />

                {/* Icon */}
                <View
                  style={[styles.cardIconBox, { backgroundColor: feature.iconBg }]}
                >
                  <Text style={styles.cardIconText}>{feature.icon}</Text>
                </View>

                {/* Tag */}
                <View
                  style={[styles.cardTag, { backgroundColor: feature.tagBg }]}
                >
                  <Text style={[styles.cardTagText, { color: feature.tagColor }]}>
                    {feature.tag}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle}>{feature.title}</Text>

                {/* Description */}
                <Text style={styles.cardDesc}>{feature.description}</Text>

                {/* Arrow button */}
                <View style={styles.cardArrow}>
                  <Text style={styles.cardArrowText}>›</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* ── Info Cards Row ── */}
        <Animated.View style={[styles.infoRow, { opacity: fadeAnim }]}>
          {infoCards.map((card) => (
            <View key={card.id} style={styles.infoCard}>
              <Text style={styles.infoIcon}>{card.icon}</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{card.title}</Text>
                <Text style={styles.infoDesc}>{card.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            🔒 Powered by research-based conservation technology
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Top Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "#16A34A",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  // Banner
  banner: {
    marginHorizontal: 20,
    backgroundColor: "#16A34A",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    marginBottom: 20,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIcon: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  bannerSub: {
    fontSize: 12,
    color: "#BBF7D0",
    lineHeight: 16,
  },

  // 2-Column Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    position: "relative",
    minHeight: 185,
  },
  blob: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    top: -20,
    right: -20,
    opacity: 0.6,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardIconText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  cardArrow: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardArrowText: {
    fontSize: 18,
    color: "#0F172A",
    fontWeight: "700",
    lineHeight: 22,
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 28,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoIcon: {
    fontSize: 22,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
    lineHeight: 16,
  },
  infoDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});