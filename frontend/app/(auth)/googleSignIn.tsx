import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { loginWithGoogle } from "../../lib/authService";
import { getOnboardingStatus } from "../../lib/onboardingStorage";
import {
  buildGoogleAuthRequestConfig,
  getGoogleClientIdIssue,
  getGoogleClientIds,
} from "../../lib/googleAuth";

// Complete the web browser session when done
WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const googleClientIds = useMemo(() => getGoogleClientIds(), []);
  const googleConfig = useMemo(
    () => buildGoogleAuthRequestConfig(Platform.OS, googleClientIds),
    [googleClientIds]
  );
  const googleClientIdIssue = useMemo(
    () => getGoogleClientIdIssue(Platform.OS, googleClientIds),
    [googleClientIds]
  );

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);

  useEffect(() => {
    const handleResponse = async () => {
      if (!response) {
        return;
      }

      if (response.type === "success" && response.authentication?.idToken) {
        try {
          setIsLoading(true);
          const authResponse = await loginWithGoogle({ idToken: response.authentication.idToken });
          setErrorMessage(null);
          // Route based on user role - check isAdmin or role === 'admin'
          if (authResponse.user?.isAdmin === true || authResponse.user?.role === 'admin') {
            router.replace("/admin/dashboard");
          } else {
            const onboardingComplete = await getOnboardingStatus();
            if (onboardingComplete) {
              router.replace("/home");
            } else {
              router.replace("/dietaryPreference");
            }
          }
        } catch (error: unknown) {
          console.error('[Google Sign-In] Backend error:', error);
          const message =
            typeof error === "object" && error !== null && "response" in error
              ? (error as any).response?.data?.message ?? "Google sign-in failed"
              : "Google sign-in failed";
          setErrorMessage(message);
          Alert.alert("Google Sign-In", message);
        } finally {
          setIsLoading(false);
        }
      } else if (response.type === "success") {
        const message = "Google sign-in failed. No ID token was returned.";
        console.error("[Google Sign-In] Missing ID token in response:", response);
        setErrorMessage(message);
        Alert.alert("Google Sign-In", message);
        setIsLoading(false);
      } else if (response.type === "error") {
        console.error('[Google Sign-In] OAuth error:', response.error);
        const errorMsg = response.error?.message || "Google sign-in failed. Please try again.";
        setErrorMessage(errorMsg);
        Alert.alert("Google Sign-In", errorMsg);
        setIsLoading(false);
      } else if (response.type === "cancel") {
        setErrorMessage("Google sign-in was cancelled.");
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [response, router]);

  const handleGoogleSignIn = async () => {
    if (googleClientIdIssue) {
      setErrorMessage(googleClientIdIssue);
      Alert.alert("Google Sign-In", googleClientIdIssue);
      return;
    }

    if (!request) {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is not configured. Please add your client IDs."
      );
      return;
    }

    try {
      setErrorMessage(null);
      setIsLoading(true);
      const result = await promptAsync();
      if (result.type !== "success") {
        setIsLoading(false);
        if (result.type === "cancel") {
          Alert.alert("Google Sign-In", "Google sign-in was cancelled.");
        }
      }
    } catch (error) {
      console.error("Google Sign-In error:", error);
      setIsLoading(false);
      Alert.alert("Google Sign-In", "Sign-in failed. Please try again.");
    }
  };

  const handleEmailSignIn = () => {
    // Navigate back to regular sign-in with email pre-filled
    router.push("/signIn");
  };

  const handleLinkAccount = () => {
    // Handle linking Google account with existing email account
    console.log("Link account with email:", email);
    alert("Account linking feature coming soon!");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />
      
      {/* Back arrow */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Purple Header Section */}
        <View style={styles.purpleHeader}>
          <Ionicons name="logo-google" size={48} color="#FFFFFF" style={styles.googleIcon} />
          <Text style={styles.title}>Sign In with Google</Text>
          <Text style={styles.subtitle}>Quick and secure access to your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Google Sign-In Button */}
          <TouchableOpacity 
            style={[
              styles.googleButton,
              (isLoading || googleClientIdIssue) && styles.buttonDisabled,
            ]} 
            onPress={handleGoogleSignIn}
            disabled={isLoading || Boolean(googleClientIdIssue)}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.googleButtonText}>Connecting...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {googleClientIdIssue ? (
            <Text style={styles.helperText}>{googleClientIdIssue}</Text>
          ) : null}

          {errorMessage && !googleClientIdIssue ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Sign-In Option */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailSignIn}
          >
            <Ionicons name="mail-outline" size={20} color="#3C2253" />
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </TouchableOpacity>

          {/* Link Account Section */}
          <View style={styles.linkAccountContainer}>
            <TouchableOpacity
              onPress={() => setShowEmailOption(!showEmailOption)}
              style={styles.linkAccountButton}
            >
              <Text style={styles.linkAccountText}>
                Link your Google account with an existing email?
              </Text>
              <Ionicons 
                name={showEmailOption ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#3C2253" 
              />
            </TouchableOpacity>

            {showEmailOption && (
              <View style={styles.emailInputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleLinkAccount}
                >
                  <Text style={styles.linkButtonText}>Link Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Benefits of signing in with Google:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Fast and secure authentication</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>No need to remember passwords</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.benefitText}>Sync your preferences across devices</Text>
            </View>
          </View>

          {/* Terms and Policy */}
          <Text style={styles.termsText}>
            By signing in, you agree to our{" "}
            <Text style={styles.link}>Terms of Service</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Don't have account */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            Don't have an account?{" "}
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.signupHighlight}>Sign Up</Text>
            </TouchableOpacity>
          </Text>
        </View>
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
    flexGrow: 1,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  purpleHeader: {
    backgroundColor: "#3C2253",
    alignItems: "center",
    justifyContent: "center",
    height: 180,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  googleIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: -30,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 25,
    height: 52,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  helperText: {
    color: "#E0E7FF",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#6B7280",
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#3C2253",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 24,
  },
  emailButtonText: {
    marginLeft: 8,
    color: "#3C2253",
    fontSize: 16,
    fontWeight: "600",
  },
  linkAccountContainer: {
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 20,
  },
  linkAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkAccountText: {
    fontSize: 13,
    color: "#3C2253",
    fontWeight: "500",
    flex: 1,
  },
  emailInputContainer: {
    marginTop: 16,
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
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    marginLeft: 10,
  },
  linkButton: {
    backgroundColor: "#3C2253",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  benefitsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
  },
  termsText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  link: {
    color: "#3C2253",
    textDecorationLine: "underline",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  signupText: {
    fontSize: 13,
    color: "#6B7280",
  },
  signupHighlight: {
    fontSize: 13,
    color: "#3C2253",
    fontWeight: "600",
  },
});

