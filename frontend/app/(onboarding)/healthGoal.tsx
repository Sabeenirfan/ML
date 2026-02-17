import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { getProfile, updateProfile } from "../../lib/authService";
import { setOnboardingComplete } from "../../lib/onboardingStorage";

const healthGoals = [
  {
    id: "weight_loss",
    title: "Weight Loss",
    icon: "trending-down",
    description: "Reduce calorie intake to create a calorie deficit",
    color: "#10B981",
  },
  {
    id: "weight_gain",
    title: "Weight Gain",
    icon: "trending-up",
    description: "Increase calorie intake to build muscle and gain weight",
    color: "#3B82F6",
  },
  {
    id: "maintenance",
    title: "Maintain Weight",
    icon: "activity",
    description: "Maintain current weight with balanced nutrition",
    color: "#8B5CF6",
  },
];

export default function HealthGoalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isOnboarding = params.onboarding === "true";
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentGoal();
  }, []);

  const loadCurrentGoal = async () => {
    try {
      const response = await getProfile();
      if (response.user?.healthGoal) {
        setSelectedGoal(response.user.healthGoal);
      }
    } catch (error) {
      console.log("Could not load current health goal:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedGoal) {
      Alert.alert("Error", "Please select a health goal");
      return;
    }

    try {
      setLoading(true);
      await updateProfile({ healthGoal: selectedGoal as any });

      if (isOnboarding) {
        // Mark onboarding as complete
        await setOnboardingComplete();

        // Navigate to home screen
        router.replace("/home");

        // Show success message
        setTimeout(() => {
          Alert.alert(
            "Welcome to MealVista!",
            "Your preferences have been saved successfully. Your recipe recommendations are now personalized!",
          );
        }, 500);
      } else {
        Alert.alert(
          "Success",
          "Health goal saved successfully! Your recipe recommendations will now be personalized.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Error saving health goal:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to save health goal. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (isOnboarding) {
      // Mark onboarding as complete even if skipped
      await setOnboardingComplete();
      router.replace("/home");
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Goal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>What's Your Health Goal?</Text>
          <Text style={styles.introText}>
            Select your primary health goal to receive personalized recipe
            recommendations tailored to your needs.
          </Text>
        </View>

        <View style={styles.goalsContainer}>
          {healthGoals.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected,
                  isSelected && { borderColor: goal.color },
                ]}
                onPress={() => setSelectedGoal(goal.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${goal.color}15` },
                  ]}
                >
                  <Feather
                    name={goal.icon as any}
                    size={32}
                    color={goal.color}
                  />
                </View>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                </View>
                {isSelected && (
                  <View
                    style={[styles.checkmark, { backgroundColor: goal.color }]}
                  >
                    <Feather name="check" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={20} color="#3C2253" />
          <Text style={styles.infoText}>
            Your health goal will be used to personalize recipe recommendations,
            including calorie targets and nutritional balance.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isOnboarding && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.saveButton,
            !selectedGoal && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!selectedGoal || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading
              ? "Saving..."
              : selectedGoal
                ? "Save Health Goal"
                : "Select a Goal"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#3C2253",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introContainer: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  goalsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalCardSelected: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0EFFF",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#3C2253",
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#3C2253",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
