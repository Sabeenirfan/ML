import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { storeToken } from '../../lib/authStorage';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get params from previous screen
  const email = params.email as string;
  const name = params.name as string;
  const password = params.password as string;
  const purpose = params.purpose as string || 'email_verification'; // 'email_verification' or 'password_reset'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(60); // 1 minute in seconds
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOTPChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otpCode?: string) => {
    try {
      const otpValue = otpCode || otp.join('');

      if (otpValue.length !== 6) {
        setErrorMessage('Please enter all 6 digits');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      if (purpose === 'email_verification') {
        // Signup OTP verification
        const response = await api.post('/api/otp-auth/signup/verify-otp', {
          name,
          email,
          password,
          otp: otpValue,
        });

        // Store token
        if (response.data.token) {
          await storeToken(response.data.token);
        }

        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => router.replace('/dietaryPreference') }
        ]);
      } else if (purpose === 'password_reset') {
        // Forgot password OTP verification
        const response = await api.post('/api/otp-auth/forgot-password/verify-otp', {
          email,
          otp: otpValue,
        });

        // Navigate to reset password screen with reset token
        router.push({
          pathname: '/resetPassword',
          params: {
            resetToken: response.data.resetToken,
            email,
          },
        });
      }

    } catch (error: any) {
      console.error('OTP verification error:', error);
      const message = error?.response?.data?.message || 'OTP verification failed';
      setErrorMessage(message);
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      setResending(true);
      setErrorMessage('');

      await api.post('/api/otp-auth/resend-otp', {
        email,
        purpose,
      });

      Alert.alert('Success', 'A new OTP has been sent to your email');
      setTimer(60); // Reset timer
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const message = error?.response?.data?.message || 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="mail-outline" size={80} color="#667eea" />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.email}>{email}</Text>
            </Text>
          </View>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  errorMessage && styles.otpInputError,
                ]}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Ionicons 
              name={timer > 60 ? "time-outline" : "warning-outline"} 
              size={18} 
              color={timer > 60 ? "#666" : "#e74c3c"} 
            />
            <Text style={[styles.timerText, timer <= 60 && styles.timerExpiring]}>
              Code expires in {formatTime(timer)}
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.some(d => !d)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend || resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <Text
                  style={[
                    styles.resendButton,
                    !canResend && styles.resendButtonDisabled,
                  ]}
                >
                  Resend OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Info */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              For your security, never share this code with anyone
            </Text>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  otpInputError: {
    borderColor: '#e74c3c',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  timerExpiring: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: "#3C2253",
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resendButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
  },
  resendButtonDisabled: {
    color: '#ccc',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#667eea',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
});
