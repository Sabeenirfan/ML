import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getProfile, updateProfile, logout } from "../../../lib/authService";
import { isValidGmail, isNonEmpty } from "../../../lib/validators";
import { AuthUser } from "../../../lib/authService";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load profile on mount and whenever screen is focused (e.g. after editing allergens/dietary/BMI/health goal)
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      setUser(response.user);
      setName(response.user.name);
      setEmail(response.user.email);
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        await logout();
        router.replace("/signIn");
      } else {
        setErrorMessage("Failed to load profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { name?: string; email?: string } = {};

    if (!isNonEmpty(name)) {
      errors.name = "Name is required";
    }

    if (!isNonEmpty(email)) {
      errors.email = "Email is required";
    } else if (!isValidGmail(email)) {
      errors.email = "Email must be a valid Gmail address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    // Check if anything changed
    if (user && name === user.name && email === user.email) {
      setSuccessMessage("No changes to save");
      return;
    }

    try {
      setSaving(true);
      const response = await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      setUser(response.user);
      setSuccessMessage("Profile updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (error as any).response?.data?.message ?? "Failed to update profile"
          : "Failed to update profile";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    console.log("=== LOGOUT BUTTON CLICKED ===");
    
    // Immediately try to logout without alert for testing
    (async () => {
      try {
        console.log("Clearing token...");
        await logout();
        console.log("Token cleared!");
        
        // Try using href instead of replace
        console.log("Navigating using router.push...");
        setTimeout(() => {
          router.push("/signIn");
        }, 100);
        
      } catch (err) {
        console.error("Logout error:", err);
      }
    })();
  };

  const handleNameChange = (value: string) => {
    if (validationErrors.name) {
      setValidationErrors({ ...validationErrors, name: undefined });
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
    setName(value);
  };

  const handleEmailChange = (value: string) => {
    if (validationErrors.email) {
      setValidationErrors({ ...validationErrors, email: undefined });
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
    setEmail(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C2253" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log("Back button pressed");
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/home');
            }
          }} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          onPress={() => {
            console.log("LOGOUT ICON TAPPED!");
            handleLogout();
          }} 
          style={styles.logoutButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#3C2253" />
            </View>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email || ""}</Text>
          </View>

          {/* Display static account info (editing moved to separate screen) */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name || name || '—'}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.email || email || '—'}</Text>
          </View>

          {user?.createdAt && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Member since</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {successMessage && (
            <Text style={styles.successText}>{successMessage}</Text>
          )}
        </View>

        {/* Health & Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Health & Preferences</Text>
          
          {user?.dietaryPreferences && user.dietaryPreferences.length > 0 && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Dietary Preferences</Text>
              <View style={styles.tagsContainer}>
                {user.dietaryPreferences.map((pref, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{pref}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {user?.allergens && user.allergens.length > 0 && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Allergen Restrictions</Text>
              <View style={styles.tagsContainer}>
                {user.allergens.map((allergen, index) => (
                  <View key={index} style={[styles.tag, styles.allergenTag]}>
                    <Text style={styles.tagText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {user?.bmi && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>BMI Information</Text>
              <Text style={styles.infoValue}>
                BMI: {user.bmi.toFixed(1)} ({user.bmiCategory})
              </Text>
              {user.height && user.weight && (
                <Text style={styles.infoSubtext}>
                  Height: {user.height} cm | Weight: {user.weight} kg
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/dietaryPreference')}>
            <View style={styles.optionLeft}>
              <Ionicons name="nutrition" size={20} color="#3C2253" />
              <Text style={styles.optionText}>Edit Dietary Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/allergenPreference')}>
            <View style={styles.optionLeft}>
              <Ionicons name="warning" size={20} color="#3C2253" />
              <Text style={styles.optionText}>Edit Allergens Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/bmiCalculator')}>
            <View style={styles.optionLeft}>
              <Ionicons name="speedometer" size={20} color="#3C2253" />
              <Text style={styles.optionText}>Update BMI</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/healthGoal')}>
            <View style={styles.optionLeft}>
              <Ionicons name="flag" size={20} color="#3C2253" />
              <Text style={styles.optionText}>Set Health Goal</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/favorites')}>
            <View style={styles.optionLeft}>
              <Ionicons name="heart" size={20} color="#3C2253" />
              <Text style={styles.optionText}>View Favorites</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/editProfile')}>
            <View style={styles.optionLeft}>
              <Ionicons name="create" size={20} color="#3C2253" />
              <Text style={styles.optionText}>Edit Profile Info</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
            <View style={styles.optionLeft}>
              <Ionicons name="log-out" size={20} color="#DC2626" />
              <Text style={[styles.optionText, { color: '#DC2626' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#3C2253",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    height: 116,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  logoutButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0EFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
  successText: {
    color: "#10B981",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  infoContainer: {
    marginTop: 8,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  infoBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1A3F",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#E8E0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#5A3D7A",
  },
  allergenTag: {
    backgroundColor: "#FEE2E2",
    borderColor: "#DC2626",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A3D7A",
  },
  infoSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#3C2253",
    borderRadius: 25,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  optionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  optionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});




