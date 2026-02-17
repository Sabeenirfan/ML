import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or react-native-vector-icons
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { login, loginWithGoogle, getProfile } from "../../lib/authService";
import {
  buildGoogleAuthRequestConfig,
  getGoogleClientIdIssue,
  getGoogleClientIds,
} from "../../lib/googleAuth";
import { getOnboardingStatus, getNextOnboardingRoute } from "../../lib/onboardingStorage";

WebBrowser.maybeCompleteAuthSession();

export default function MealVistaSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const googleClientIds = useMemo(() => getGoogleClientIds(), []);
  const googleConfig = useMemo(
    () => buildGoogleAuthRequestConfig(Platform.OS, googleClientIds),
    [googleClientIds],
  );
  const googleClientIdIssue = useMemo(
    () => getGoogleClientIdIssue(Platform.OS, googleClientIds),
    [googleClientIds],
  );

  // Move the Google hook + response handling into a child component so the hook
  // is only called when client IDs are present. This prevents the expo-auth-session
  // invariant from throwing on web when no web client id is configured.
  function GoogleAuthButton() {
    const [request, response, promptAsync] = Google.useAuthRequest(
      googleConfig as any,
    );

    useEffect(() => {
      const handleGoogleResponse = async () => {
        if (!response) {
          if (__DEV__)
            console.log("[Google Sign-In] useEffect: No response yet");
          return;
        }

        console.log(
          "[Google Sign-In] useEffect triggered with response:",
          response,
        );

        // Extract idToken from response - different structures for web vs mobile
        const idToken =
          (response as any)?.authentication?.idToken ||
          (response as any)?.idToken ||
          (response as any)?.params?.id_token;

        console.log(
          "[Google Sign-In] 📊 IdToken found:",
          !!idToken,
          "type of response:",
          typeof response,
        );

        if (response.type === "success" && idToken) {
          try {
            console.log(
              "[Google Sign-In] ✅ Google authentication successful, idToken present",
            );
            setGoogleLoading(true);

            // Add a timeout to the loginWithGoogle call
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => {
                console.error(
                  "[Google Sign-In] ❌ Backend request timed out after 15 seconds",
                );
                reject(
                  new Error(
                    "Google sign-in request timed out after 15 seconds",
                  ),
                );
              }, 15000),
            );

            console.log(
              "[Google Sign-In] 🔄 Calling backend loginWithGoogle...",
            );
            const authResponse = (await Promise.race([
              loginWithGoogle({ idToken }),
              timeoutPromise,
            ])) as any;

            console.log("[Google Sign-In] ✅ Backend responded successfully");
            console.log(
              "[Google Sign-In] User role:",
              authResponse.user?.role,
              "isAdmin:",
              authResponse.user?.isAdmin,
            );
            setErrorMessage(null);

            // Route based on user role - check isAdmin or role === 'admin'
            if (
              authResponse.user?.isAdmin === true ||
              authResponse.user?.role === "admin"
            ) {
              console.log("[Google Sign-In] 🔄 Redirecting to admin dashboard");
              router.replace("/admin/dashboard");
            } else {
              const completed = await getOnboardingStatus();
              if (completed) {
                router.replace("/home");
              } else {
                try {
                  const profile = await getProfile();
                  const nextStep = getNextOnboardingRoute(profile);
                  if (nextStep) {
                    router.replace({ pathname: nextStep as any, params: { onboarding: "true" } });
                  } else {
                    router.replace("/home");
                  }
                } catch {
                  router.replace({ pathname: "/onboarding/dietaryPreference", params: { onboarding: "true" } } as any);
                }
              }
            }
          } catch (error: unknown) {
            console.error("[Google Sign-In] ❌ Error in auth flow:", error);
            const message =
              typeof error === "object" && error !== null && "response" in error
                ? ((error as any).response?.data?.message ??
                  "Google sign-in failed")
                : typeof error === "object" &&
                    error !== null &&
                    "message" in error
                  ? (error as any).message
                  : "Google sign-in failed";
            setErrorMessage(message);
            setGoogleLoading(false);
          }
        } else if (response.type === "success" && !idToken) {
          console.error(
            "[Google Sign-In] ⚠️  Missing ID token. Response:",
            JSON.stringify(response),
          );
          setErrorMessage("Google sign-in failed. No ID token was returned.");
          setGoogleLoading(false);
        } else if (response.type === "error") {
          console.error(
            "[Google Sign-In] 🔴 OAuth error:",
            (response as any)?.error,
          );
          const errorMsg =
            (response as any)?.error?.message ||
            "Google sign-in failed. Please try again.";
          setErrorMessage(errorMsg);
          setGoogleLoading(false);
        } else if (response.type === "cancel") {
          console.log("[Google Sign-In] User cancelled Google sign-in");
          setErrorMessage("Google sign-in was cancelled.");
          setGoogleLoading(false);
        } else {
          console.log("[Google Sign-In] Other response type:", response.type);
        }
      };

      handleGoogleResponse();
    }, [response]);

    return (
      <TouchableOpacity
        style={
          googleLoading || googleClientIdIssue
            ? [styles.googleButton, styles.googleButtonDisabled]
            : styles.googleButton
        }
        onPress={async () => {
          if (googleClientIdIssue) {
            setErrorMessage(googleClientIdIssue);
            return;
          }

          if (!request) {
            setErrorMessage(
              "Google Sign-In is not available right now. Please try again.",
            );
            return;
          }

          try {
            setErrorMessage(null);
            setGoogleLoading(true);
            console.log(
              "[Google Sign-In] Button pressed, starting promptAsync...",
            );

            const result = await promptAsync();
            console.log("[Google Sign-In] promptAsync returned:", result?.type);
            console.log(
              "[Google Sign-In] Result keys:",
              Object.keys(result || {}),
            );
            console.log(
              "[Google Sign-In] Full result object:",
              JSON.stringify(result, null, 2),
            );
            console.log(
              "[Google Sign-In] result.authentication:",
              (result as any)?.authentication,
            );
            console.log(
              "[Google Sign-In] result.params:",
              (result as any)?.params,
            );
            console.log(
              "[Google Sign-In] result.idToken:",
              (result as any)?.idToken,
            );

            // Handle the result directly from promptAsync (don't rely on response state hook)
            if (!result || result.type !== "success") {
              console.log(
                "[Google Sign-In] promptAsync did not return success",
              );
              setGoogleLoading(false);
              if (result?.type === "cancel") {
                setErrorMessage("Google sign-in was cancelled.");
              } else if (result?.type === "error") {
                setErrorMessage(
                  (result as any)?.error?.message || "Google sign-in failed",
                );
              }
            } else {
              console.log(
                "[Google Sign-In] ✅ promptAsync returned success, extracting token...",
              );

              // Google returns accessToken on web, not idToken
              // Send the accessToken to backend which will use it to get user info
              const accessToken = (result as any)?.authentication?.accessToken;
              console.log(
                "[Google Sign-In] 📊 AccessToken extracted:",
                !!accessToken,
                "length:",
                accessToken?.length,
              );

              if (!accessToken) {
                console.error(
                  "[Google Sign-In] ⚠️  Missing access token. Result:",
                  JSON.stringify(result),
                );
                setErrorMessage(
                  "Google sign-in failed. No access token was returned.",
                );
                setGoogleLoading(false);
                return;
              }

              try {
                console.log(
                  "[Google Sign-In] ✅ Calling backend loginWithGoogle with accessToken...",
                );
                const authResponse = await loginWithGoogle({ accessToken });
                console.log(
                  "[Google Sign-In] ✅ Backend responded successfully",
                );
                setErrorMessage(null);

                // Route based on user role
                if (
                  authResponse.user?.isAdmin === true ||
                  authResponse.user?.role === "admin"
                ) {
                  console.log(
                    "[Google Sign-In] 🔄 Redirecting to admin dashboard",
                  );
                  router.replace("/admin/dashboard");
                } else {
                  const completed = await getOnboardingStatus();
                  if (completed) {
                    router.replace("/home");
                  } else {
                    try {
                      const profile = await getProfile();
                      const nextStep = getNextOnboardingRoute(profile);
                      if (nextStep) {
                        router.replace({ pathname: nextStep as any, params: { onboarding: "true" } });
                      } else {
                        router.replace("/home");
                      }
                    } catch {
                      router.replace({ pathname: "/onboarding/dietaryPreference", params: { onboarding: "true" } } as any);
                    }
                  }
                }
              } catch (backendError: unknown) {
                console.error(
                  "[Google Sign-In] ❌ Backend error:",
                  backendError,
                );
                const message =
                  typeof backendError === "object" &&
                  backendError !== null &&
                  "response" in backendError
                    ? ((backendError as any).response?.data?.message ??
                      "Google sign-in failed")
                    : typeof backendError === "object" &&
                        backendError !== null &&
                        "message" in backendError
                      ? (backendError as any).message
                      : "Google sign-in failed";
                setErrorMessage(message);
                setGoogleLoading(false);
              }
            }
          } catch (error) {
            console.error("[Google Sign-In] Error during promptAsync:", error);
            setErrorMessage("Google sign-in failed. Please try again.");
            setGoogleLoading(false);
          }
        }}
        disabled={googleLoading || Boolean(googleClientIdIssue)}
      >
        {googleLoading ? (
          <View style={styles.googleLoadingContent}>
            <ActivityIndicator size="small" color="#DB4437" />
            <Text style={styles.googleButtonText}>Connecting...</Text>
          </View>
        ) : (
          <View style={styles.googleContent}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const handleSignIn = async () => {
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await login({ email: trimmedEmail, password });
      // Route based on user role - check isAdmin or role === 'admin'
      if (response.user?.isAdmin === true || response.user?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        // Send to onboarding if not yet complete; resume at the step where they left off (from profile)
        const completed = await getOnboardingStatus();
        if (completed) {
          router.replace("/home");
        } else {
          try {
            const profile = await getProfile();
            const nextStep = getNextOnboardingRoute(profile);
            if (nextStep) {
              router.replace({ pathname: nextStep as any, params: { onboarding: "true" } });
            } else {
              router.replace("/home");
            }
          } catch {
            router.replace({ pathname: "/onboarding/dietaryPreference", params: { onboarding: "true" } } as any);
          }
        }
      }
    } catch (error: unknown) {
      // Check if email verification is required
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.data?.requiresVerification
      ) {
        const message =
          (error as any).response?.data?.message ||
          "Please verify your email first";
        setErrorMessage(message);
        // Navigate to email verification
        router.push({
          pathname: "/verifyEmailOTP" as any,
          params: {
            email: trimmedEmail,
            fromLogin: "true",
          },
        });
        return;
      }

      const message =
        typeof error === "object" && error !== null && "response" in error
          ? ((error as any).response?.data?.message ?? "Unable to login")
          : "Unable to login";

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.status === 401
      ) {
        setErrorMessage(message || "Invalid email or password");
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in is handled inside the nested `GoogleAuthButton` component

  const handleForgotPassword = () => {
    router.push("/forgotPassword");
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleEmailChange = (value: string) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    setPassword(value);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Back Arrow */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Purple Header Section */}
        <View style={styles.purpleHeader}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your MealVista account</Text>
        </View>

        {/* White Card */}
        <View style={styles.card}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9CA3AF"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9CA3AF"
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              {(errorMessage === "Invalid email or password" ||
                errorMessage.startsWith("Invalid email or password")) && (
                <Text style={styles.errorHint}>
                  If you signed up with Google, use "Continue with Google" below to sign in.
                </Text>
              )}
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => {
              handleSignIn();
            }}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.signInButtonText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          {googleClientIdIssue ? (
            <>
              <TouchableOpacity
                style={[styles.googleButton, styles.googleButtonDisabled]}
                disabled
              >
                <View style={styles.googleContent}>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.helperText}>{googleClientIdIssue}</Text>
            </>
          ) : (
            <GoogleAuthButton />
          )}

          {/* Terms and Policy */}
          <Text style={styles.termsText}>
            By signing in, you agree to our{" "}
            <Text style={styles.link}>Terms of Service</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { flexGrow: 1 },
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
    height: 156,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#FFFFFF", opacity: 0.9 },
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
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  passwordInput: { paddingRight: 40 },
  eyeIcon: { position: "absolute", right: 14, padding: 4 },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#3C2253",
    fontWeight: "500",
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  errorHint: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: "#3C2253",
    borderRadius: 25,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 1,
  },
  signInButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: "#6B7280" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    height: 48,
    marginBottom: 20,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  termsText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  link: { color: "#3C2253", textDecorationLine: "underline" },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  signUpText: { fontSize: 13, color: "#6B7280" },
  signUpLink: { fontSize: 13, color: "#3C2253", fontWeight: "600" },
});
