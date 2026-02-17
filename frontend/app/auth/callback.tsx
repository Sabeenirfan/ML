import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MealVista } from "../../constants/theme";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (token) {
      // Store token (you can use AsyncStorage or context)
      // For now, navigate to dietary preference
      setTimeout(() => {
        router.replace("/dietaryPreference");
      }, 500);
    } else {
      // No token, redirect back to sign in
      router.replace("/signIn");
    }
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={MealVista.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MealVista.surface,
  },
});

