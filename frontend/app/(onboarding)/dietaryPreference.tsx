import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProfile, updateProfile } from "../../lib/authService";

interface DietaryOption {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

const dietaryOptions: DietaryOption[] = [
  { id: "keto", label: "Keto", color: "#8B5CF6", bgColor: "#A78BFA" },
  {
    id: "vegetarian",
    label: "Vegetarian",
    color: "#10B981",
    bgColor: "#34D399",
  },
  { id: "vegan", label: "Vegan", color: "#14B8A6", bgColor: "#5EEAD4" },
  {
    id: "gluten-free",
    label: "Gluten-Free",
    color: "#F59E0B",
    bgColor: "#FBBF24",
  },
  { id: "low-carb", label: "Low-Carb", color: "#3B82F6", bgColor: "#60A5FA" },
  {
    id: "high-protein",
    label: "High-Protein",
    color: "#EC4899",
    bgColor: "#F472B6",
  },
  {
    id: "dairy-free",
    label: "Dairy-Free",
    color: "#EAB308",
    bgColor: "#FCD34D",
  },
];

export default function DietaryPreferenceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isOnboarding = params.onboarding === "true"; // Check if coming from signup
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    "keto",
  ]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (isMounted) {
          setUserName(response.user?.name ?? null);

          // Load existing dietary preferences
          if (
            response.user?.dietaryPreferences &&
            response.user.dietaryPreferences.length > 0
          ) {
            // Convert labels back to IDs
            const preferenceIds = response.user.dietaryPreferences
              .map((label) => {
                const option = dietaryOptions.find(
                  (opt) => opt.label === label,
                );
                return option?.id;
              })
              .filter((id): id is string => id !== undefined);

            if (preferenceIds.length > 0) {
              setSelectedPreferences(preferenceIds);
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("Unable to load profile", error);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTogglePreference = (id: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (selectedPreferences.length === 0) {
      Alert.alert("Error", "Please select at least one dietary preference");
      return;
    }

    const selectedLabels = dietaryOptions
      .filter((opt) => selectedPreferences.includes(opt.id))
      .map((opt) => opt.label);

    try {
      // Save preferences to backend
      await updateProfile({ dietaryPreferences: selectedLabels });
      console.log("Preferences saved:", selectedLabels);

      // If onboarding, go to next step (BMI), otherwise go back to profile
      if (isOnboarding) {
        router.push({
          pathname: "/bmiCalculator",
          params: { onboarding: "true" },
        } as any);
      } else {
        // Show success message and go back to profile
        Alert.alert("Success", "Dietary preferences saved successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error saving dietary preferences:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to save dietary preferences. Please try again.",
      );
    }
  };

  const handleSkip = () => {
    if (isOnboarding) {
      router.push({
        pathname: "/bmiCalculator",
        params: { onboarding: "true" },
      } as any);
    } else {
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getOptionStyle = (option: DietaryOption, isSelected: boolean) => {
    if (isSelected && option.id === "keto") {
      return {
        backgroundColor: option.bgColor,
        borderWidth: 1.5,
        borderColor: "#3C2253",
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
      };
    } else if (isSelected) {
      return {
        backgroundColor: option.bgColor,
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
      };
    } else {
      return {
        backgroundColor: option.bgColor,
      };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dietary Preferences</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={styles.descriptionContainer}>
          {loadingProfile ? (
            <View style={styles.profileRow}>
              <ActivityIndicator size="small" color="#3C2253" />
              <Text style={[styles.description, styles.loadingText]}>
                Loading your profile...
              </Text>
            </View>
          ) : (
            <>
              {userName && (
                <Text style={[styles.description, styles.greetingText]}>
                  Hi {userName}, great to see you again!
                </Text>
              )}
              <Text style={styles.description}>
                Select your dietary style for personalized meal suggestions
              </Text>
            </>
          )}
        </View>

        {/* Dietary Options */}
        <View style={styles.optionsContainer}>
          {dietaryOptions.map((option) => {
            const isSelected = selectedPreferences.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  getOptionStyle(option, isSelected),
                ]}
                onPress={() => handleTogglePreference(option.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#FFFFFF"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        {isOnboarding && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedPreferences.length === 0 && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={selectedPreferences.length === 0}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    backgroundColor: "#3C2253",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    height: 116,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "400",
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  description: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 26,
  },
  greetingText: {
    fontWeight: "600",
    marginBottom: 8,
  },
  loadingText: {
    color: "#3C2253",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  optionButton: {
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 100,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#FFFFFF",
    marginRight: 8,
  },
  checkIcon: {
    marginLeft: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "#F5F5F7",
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
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#FFFFFF",
  },
});
