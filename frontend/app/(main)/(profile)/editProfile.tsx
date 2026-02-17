import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile } from '../../../lib/authService';
import { isValidGmail, isNonEmpty } from '../../../lib/validators';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await getProfile();
        setName(resp.user.name || '');
        setEmail(resp.user.email || '');
      } catch (err) {
        console.error('Failed to load profile for editing', err);
        Alert.alert('Error', 'Failed to load profile. Please try again.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validate = () => {
    const errors: { name?: string; email?: string } = {};
    if (!isNonEmpty(name)) errors.name = 'Name is required';
    if (!isNonEmpty(email)) errors.email = 'Email is required';
    else if (!isValidGmail(email)) errors.email = 'Email must be a valid Gmail address';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
      // After successful update, navigate back to profile and refresh
      router.replace('/profile');
    } catch (err: any) {
      console.error('Update profile failed', err);
      const message = typeof err === 'object' && err !== null && 'response' in err
        ? (err as any).response?.data?.message ?? 'Failed to update profile'
        : 'Failed to update profile';
      Alert.alert('Update failed', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C2253" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2253" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputWrapper, validationErrors.name && styles.inputWrapperError]}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => setName(v)}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>
          {validationErrors.name && <Text style={styles.errorText}>{validationErrors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, validationErrors.email && styles.inputWrapperError]}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => setEmail(v)}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {validationErrors.email && <Text style={styles.errorText}>{validationErrors.email}</Text>}
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  header: { backgroundColor: '#3C2253', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 12 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  inputContainer: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, height: 48 },
  inputWrapperError: { borderWidth: 1, borderColor: '#DC2626' },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#111827' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6 },
  saveButton: { backgroundColor: '#3C2253', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
