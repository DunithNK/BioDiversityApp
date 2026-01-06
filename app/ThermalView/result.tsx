import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function ThermalResult() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#081417",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          color: "#00FFD1",
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        Sri Lankan Leopard Detected
      </Text>

      <Text
        style={{
          color: "#CFFCF2",
          fontSize: 16,
          marginBottom: 24,
        }}
      >
        Detection Confidence: 87%
      </Text>

      <Text
        style={{
          color: "#9FEADF",
          fontSize: 14,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        Thermal patterns indicate normal body temperature range
        with no visible signs of heat stress.
      </Text>

      <TouchableOpacity
        onPress={() =>
          router.replace("ThermalView/index")
        }
        style={{
          backgroundColor: "#00FFD1",
          paddingVertical: 12,
          paddingHorizontal: 28,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: "#081417",
            fontWeight: "600",
            fontSize: 15,
          }}
        >
          Analyze Another Image
        </Text>
      </TouchableOpacity>
    </View>
  );
}
