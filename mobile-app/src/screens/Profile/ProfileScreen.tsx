import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { authAPI } from '../../services/api';

export function ProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentEmailPassword, setCurrentEmailPassword] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    setSavingProfile(true);
    try {
      await authAPI.updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      updateUser({ fullName: fullName.trim(), phone: phone.trim() });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!currentEmailPassword || !newEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newEmail.trim() === user?.email) {
      Alert.alert('Error', 'New email must be different from current email');
      return;
    }
    setSavingEmail(true);
    try {
      const response = await authAPI.changeEmail({
        currentPassword: currentEmailPassword,
        newEmail: newEmail.trim(),
      });
      updateUser(response.data.data);
      setCurrentEmailPassword('');
      Alert.alert('Success', 'Email changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="person" size={20} color="#0ea5e9" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <Text style={styles.cardSubtitle}>Update your name and phone number</Text>
            </View>
          </View>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
          />
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.buttonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="mail" size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Change Email</Text>
              <Text style={styles.cardSubtitle}>Update your email address</Text>
            </View>
          </View>
          <Text style={styles.label}>Current Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.email || ''}
            editable={false}
          />
          <Text style={styles.label}>New Email</Text>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentEmailPassword}
            onChangeText={setCurrentEmailPassword}
            placeholder="Enter current password"
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleChangeEmail}
            disabled={savingEmail}
          >
            {savingEmail ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Ionicons name="mail" size={18} color="#3b82f6" />
                <Text style={styles.secondaryButtonText}>Update Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="lock-closed" size={20} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardSubtitle}>Keep your account secure</Text>
            </View>
          </View>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator size="small" color="#f59e0b" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#f59e0b" />
                <Text style={[styles.secondaryButtonText, { color: '#f59e0b' }]}>
                  Change Password
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 0,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  disabledInput: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeButton: { padding: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  primaryButton: { backgroundColor: '#0ea5e9' },
  secondaryButton: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  secondaryButtonText: { color: '#3b82f6', fontSize: 15, fontWeight: '600' },
});
