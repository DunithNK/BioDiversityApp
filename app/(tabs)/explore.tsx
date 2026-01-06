import { Platform, StyleSheet, View } from "react-native";

import { Collapsible } from "@/components/ui/collapsible";
import { ExternalLink } from "@/components/external-link";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded }}
        >
          Explore
        </ThemedText>
      </ThemedView>

      <ThemedText style={styles.description}>
        This app includes example modules demonstrating file-based routing,
        cross-platform support, and modular UI components.
      </ThemedText>

      <Collapsible title="File-based routing">
        <ThemedText>
          This app uses Expo Router with file-based navigation.
        </ThemedText>
        <ThemedText>
          Screens are located inside{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)</ThemedText>.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Platform support">
        <ThemedText>
          The application runs on Android, iOS, and Web using Expo Go.
        </ThemedText>
        {Platform.OS === "ios" && (
          <ThemedText>
            iOS uses optimized layout handling via Expo Router.
          </ThemedText>
        )}
      </Collapsible>

      <Collapsible title="UI Components">
        <ThemedText>
          The app uses reusable UI components such as collapsible cards,
          themed text, and consistent styling.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Animations (Planned)">
        <ThemedText>
          Advanced animations using{" "}
          <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText>{" "}
          are planned for future releases.
        </ThemedText>
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  titleContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  description: {
    marginBottom: 20,
  },
});
