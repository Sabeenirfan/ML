import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import { MealVista } from "../constants/theme";

const { width, height } = Dimensions.get("window");

// Pixel 7 dimensions: 1080 x 2400 (20:9 aspect ratio)
// Calculate responsive sizes based on screen dimensions
const getResponsiveSize = (size: number) => {
  const scale = width / 1080; // Base scale on Pixel 7 width
  return size * scale;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_700Bold,
  });

  useEffect(() => {
    // Just wait for fonts to load, don't auto-navigate
    if (fontsLoaded) {
      setCheckingAuth(false);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || checkingAuth) {
    // Show a polished loader while fonts are loading
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MealVista.primaryLight} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Full screen image with gradient overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/images/burger.png")}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Enhanced gradient overlay */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.3)",
            "rgba(0,0,0,0.7)",
            "rgba(0,0,0,0.95)",
            "rgba(0,0,0,1)",
          ]}
          locations={[0, 0.4, 0.7, 0.9, 1]}
          style={styles.gradient}
        />
      </View>

      {/* Content Container */}
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        {/* Text section with better spacing */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>MealVista</Text>
          <Text style={styles.subtitle}>From Pantry to Plate</Text>
          <Text style={styles.description}>
            Discover delicious recipes tailored to your preferences
          </Text>
        </View>

        {/* Button with enhanced styling */}
        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/signup")}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveSize(40),
    marginTop: height * 0.15,
  },
  title: {
    color: "#FFFFFF",
    fontSize: getResponsiveSize(90),
    fontFamily: "Rubik_700Bold",
    textAlign: "center",
    marginBottom: getResponsiveSize(12),
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#E0E0E0",
    fontSize: getResponsiveSize(36),
    fontFamily: "Rubik_400Regular",
    textAlign: "center",
    marginBottom: getResponsiveSize(16),
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  description: {
    color: "#B0B0B0",
    fontSize: getResponsiveSize(26),
    fontFamily: "Rubik_400Regular",
    textAlign: "center",
    marginTop: getResponsiveSize(8),
    lineHeight: getResponsiveSize(36),
    paddingHorizontal: getResponsiveSize(20),
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: getResponsiveSize(32),
    alignItems: "center",
  },
  button: {
    backgroundColor: MealVista.primaryLight,
    paddingVertical: getResponsiveSize(28),
    paddingHorizontal: getResponsiveSize(100),
    borderRadius: getResponsiveSize(40),
    width: "100%",
    maxWidth: getResponsiveSize(500),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: MealVista.primaryLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: MealVista.primaryLight,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonText: {
    color: MealVista.white,
    fontSize: getResponsiveSize(28),
    fontWeight: "600",
    fontFamily: "Rubik_700Bold",
    letterSpacing: 0.5,
  },
});
