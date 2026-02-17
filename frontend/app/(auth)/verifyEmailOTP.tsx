import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../lib/api";
import { storeToken } from "../../lib/authStorage";

export default function VerifyEmailOTP() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(60); // 1 minute in seconds
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Get email and signup data from params
  const email = params.email as string;
  const name = params.name as string;
  const password = params.password as string;

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    // Prevent double submission
    if (loading) return;

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP");
      return;
    }

    if (!email) {
      setErrorMessage("Email is missing. Please try signing up again.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      console.log("Verifying OTP...", { email, otp: otpCode });

      // Use the verify-email endpoint from main auth route
      const response = await api.post("/api/auth/verify-email", {
        email,
        otp: otpCode,
      });

      console.log("OTP verification response:", response.data);

      if (response.data.token) {
        await storeToken(response.data.token);
        console.log("Token stored successfully");
      }

      // Navigate immediately on success
      console.log("Navigating to dietary preferences...");
      router.replace({
        pathname: "/dietaryPreference",
        params: { onboarding: "true" },
      } as any);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      console.error("Error response:", error.response?.data);
      const message =
        error.response?.data?.message ||
        "OTP verification failed. Please try again.";
      setErrorMessage(message);

      // If attempts remaining, show it
      if (error.response?.data?.attemptsRemaining !== undefined) {
        setErrorMessage(
          `${message}\n${error.response.data.attemptsRemaining} attempts remaining`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setResending(true);
      setErrorMessage(null);

      await api.post("/api/auth/resend-otp", {
        email,
      });

      Alert.alert("OTP Sent", "A new OTP has been sent to your email");
      setOtp(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);

      // Restart timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      const message =
        error.response?.data?.message ||
        "Failed to resend OTP. Please try again.";
      setErrorMessage(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color="#6B4CE6" />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit OTP to{"\n"}
          <Text style={styles.email}>{email}</Text>
        </Text>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
                errorMessage ? styles.otpInputError : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent: { key } }) =>
                handleKeyPress(key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Ionicons
            name="time-outline"
            size={20}
            color={timer <= 60 ? "#DC2626" : "#6B4CE6"}
          />
          <Text style={[styles.timerText, timer <= 60 && styles.timerExpiring]}>
            {timer > 0 ? `OTP expires in ${formatTime(timer)}` : "OTP expired"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={!canResend || resending}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendButtonText,
                (!canResend || resending) && styles.resendButtonDisabled,
              ]}
            >
              {resending ? "Sending..." : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipText}>• Check your spam/junk folder</Text>
          <Text style={styles.tipText}>
            • Make sure you entered the correct email
          </Text>
          <Text style={styles.tipText}>• OTP is valid for 1 minute</Text>
          <Text style={styles.tipText}>
            • Maximum 3 incorrect attempts allowed
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: "#6B4CE6",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    color: "#DC2626",
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#F9FAFB",
  },
  otpInputFilled: {
    borderColor: "#6B4CE6",
    backgroundColor: "#F3F0FF",
  },
  otpInputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: "#6B4CE6",
    marginLeft: 8,
    fontWeight: "500",
  },
  timerExpiring: {
    color: "#DC2626",
  },
  verifyButton: {
    backgroundColor: "#6B4CE6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  resendButton: {
    padding: 4,
  },
  resendButtonText: {
    fontSize: 14,
    color: "#6B4CE6",
    fontWeight: "600",
  },
  resendButtonDisabled: {
    color: "#9CA3AF",
  },
  tipsContainer: {
    backgroundColor: "#F3F0FF",
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B4CE6",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
});
