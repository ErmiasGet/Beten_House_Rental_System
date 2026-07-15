import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { tenantsAPI, housesAPI, roomsAPI } from '../../services/api';

export function TenantsListScreen() {
  const navigation = useNavigation<any>();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [focusCount, setFocusCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formOccupation, setFormOccupation] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formEmergencyAddress, setFormEmergencyAddress] = useState('');
  const [assignRoom, setAssignRoom] = useState(false);
  const [formHouseId, setFormHouseId] = useState('');
  const [formRoomId, setFormRoomId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formPaymentDay, setFormPaymentDay] = useState('1');
  const [formDeposit, setFormDeposit] = useState('');
  const [houses, setHouses] = useState<any[]>([]);
  const [vacantRooms, setVacantRooms] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocusCount((c) => c + 1);
    }, [])
  );

  const loadTenants = async (searchTerm: string) => {
    setLoading(true);
    try {
      setError(null);
      const response = await tenantsAPI.getAll({ page: 1, limit: 50, search: searchTerm });
      setTenants(response.data.data);
    } catch (error) {
      console.error('Tenants loadTenants error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTenants(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, focusCount]);

  const openCreate = async () => {
    setFormFullName('');
    setFormPhone('');
    setFormEmail('');
    setFormNationalId('');
    setFormOccupation('');
    setFormAddress('');
    setFormGender('');
    setFormEmergencyName('');
    setFormEmergencyPhone('');
    setFormEmergencyAddress('');
    setAssignRoom(false);
    setFormHouseId('');
    setFormRoomId('');
    setFormStartDate('');
    setFormPaymentDay('1');
    setFormDeposit('');
    setVacantRooms([]);
    setModalVisible(true);
    try {
      const res = await housesAPI.getAll({ page: 1, limit: 100 });
      setHouses(res.data.data);
    } catch (error) {
      console.error('Tenants loadHouses error:', error);
    }
  };

  const loadVacantRooms = async (houseId: string) => {
    setFormRoomId('');
    setFormDeposit('');
    if (!houseId) {
      setVacantRooms([]);
      return;
    }
    try {
      const res = await roomsAPI.getVacant(houseId);
      setVacantRooms(res.data.data);
    } catch (error) {
      console.error('Tenants loadVacantRooms error:', error);
      setVacantRooms([]);
    }
  };

  const handleHouseSelect = (houseId: string) => {
    setFormHouseId(houseId);
    loadVacantRooms(houseId);
  };

  const handleRoomSelect = (roomId: string) => {
    setFormRoomId(roomId);
    const room = vacantRooms.find((r: any) => r.id === roomId);
    if (room) {
      setFormDeposit(String(room.depositAmount || ''));
    }
  };

  const handleSave = async () => {
    if (!formFullName.trim()) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }
    if (!formPhone.trim()) {
      Alert.alert('Validation', 'Phone number is required.');
      return;
    }
    if (!/^\d{10}$/.test(formPhone.trim())) {
      Alert.alert('Validation', 'Phone number must be exactly 10 digits.');
      return;
    }
    if (!formNationalId.trim()) {
      Alert.alert('Validation', 'National ID is required.');
      return;
    }
    if (!/^\d{16}$/.test(formNationalId.trim())) {
      Alert.alert('Validation', 'National ID must be exactly 16 digits.');
      return;
    }
    if (
      (formEmergencyName && formEmergencyName === formFullName) ||
      (formEmergencyPhone && formEmergencyPhone === formPhone)
    ) {
      Alert.alert(
        'Validation',
        'Emergency contact name and phone must be different from tenant information.'
      );
      return;
    }
    if (assignRoom) {
      if (!formRoomId) {
        Alert.alert('Validation', 'Please select a room to assign.');
        return;
      }
      if (!formStartDate.trim()) {
        Alert.alert('Validation', 'Contract start date is required.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName: formFullName.trim(),
        phone: formPhone.trim(),
        nationalId: formNationalId.trim(),
      };
      if (formEmail.trim()) payload.email = formEmail.trim();
      if (formGender) payload.gender = formGender;
      if (formOccupation.trim()) payload.occupation = formOccupation.trim();
      if (formAddress.trim()) payload.address = formAddress.trim();
      if (formEmergencyName.trim()) payload.emergencyName = formEmergencyName.trim();
      if (formEmergencyPhone.trim()) payload.emergencyPhone = formEmergencyPhone.trim();
      if (formEmergencyAddress.trim()) payload.emergencyAddress = formEmergencyAddress.trim();

      if (assignRoom && formRoomId) {
        payload.roomId = formRoomId;
        payload.startDate = formStartDate.trim();
        payload.paymentDay = parseInt(formPaymentDay) || 1;
        if (formDeposit.trim()) payload.deposit = parseFloat(formDeposit) || 0;
      }

      await tenantsAPI.create(payload);
      Alert.alert('Success', 'Tenant created successfully');
      setModalVisible(false);
      loadTenants(search);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create tenant.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const renderTenant = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.tenantCard}
      onPress={() => navigation.navigate('TenantDetail', { tenantId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.fullName?.charAt(0)?.toUpperCase()}</Text>
      </View>
      <View style={styles.tenantInfo}>
        <Text style={styles.tenantName}>{item.fullName}</Text>
        <Text style={styles.tenantPhone}>{item.phone}</Text>
        {item.room && <Text style={styles.tenantRoom}>Room {item.room.roomNumber}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error && tenants.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTenants(search)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id}
          renderItem={renderTenant}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTenants(search);
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No tenants(ተከራይ) found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Tenant(ተከራይ)</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formFullName}
                onChangeText={setFormFullName}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={formPhone}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 10);
                  setFormPhone(digits);
                }}
                placeholder="10-digit number"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={10}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formEmail}
                onChangeText={setFormEmail}
                placeholder="e.g. john@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, formGender === g && styles.genderChipActive]}
                    onPress={() => setFormGender(g)}
                  >
                    <Ionicons
                      name={formGender === g ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={formGender === g ? '#0ea5e9' : '#94a3b8'}
                    />
                    <Text style={[styles.genderText, formGender === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>National ID *</Text>
              <TextInput
                style={styles.input}
                value={formNationalId}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 16);
                  setFormNationalId(digits);
                }}
                placeholder="16-digit number"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={16}
              />

              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={formOccupation}
                onChangeText={setFormOccupation}
                placeholder="Optional"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="Optional address"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />

              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Emergency Contact</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formEmergencyName}
                onChangeText={setFormEmergencyName}
                placeholder="Emergency contact name"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formEmergencyPhone}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 10);
                  setFormEmergencyPhone(digits);
                }}
                placeholder="10-digit number"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={10}
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formEmergencyAddress}
                onChangeText={setFormEmergencyAddress}
                placeholder="Emergency contact address"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <Text style={styles.sectionTitle}>Assign Room & Contract</Text>
                <Switch
                  value={assignRoom}
                  onValueChange={setAssignRoom}
                  trackColor={{ false: '#e2e8f0', true: '#bae6fd' }}
                  thumbColor={assignRoom ? '#0ea5e9' : '#94a3b8'}
                />
              </View>

              {assignRoom && (
                <>
                  <Text style={styles.label}>House *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.houseSelector}
                  >
                    {houses.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        style={[styles.chip, formHouseId === h.id && styles.chipActive]}
                        onPress={() => handleHouseSelect(h.id)}
                      >
                        <Text
                          style={[styles.chipText, formHouseId === h.id && styles.chipTextActive]}
                        >
                          {h.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {houses.length === 0 && (
                      <Text style={styles.noDataText}>No houses available</Text>
                    )}
                  </ScrollView>

                  {formHouseId ? (
                    <>
                      <Text style={styles.label}>Room *</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.houseSelector}
                      >
                        {vacantRooms.map((r) => (
                          <TouchableOpacity
                            key={r.id}
                            style={[styles.chip, formRoomId === r.id && styles.chipActive]}
                            onPress={() => handleRoomSelect(r.id)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                formRoomId === r.id && styles.chipTextActive,
                              ]}
                            >
                              {r.roomNumber} - {r.bedrooms}bed
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {vacantRooms.length === 0 && (
                          <Text style={styles.noDataText}>No vacant rooms</Text>
                        )}
                      </ScrollView>
                    </>
                  ) : null}

                  <Text style={styles.label}>Contract Start Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={formStartDate}
                    onChangeText={setFormStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                  />

                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Payment Day</Text>
                      <TextInput
                        style={styles.input}
                        value={formPaymentDay}
                        onChangeText={setFormPaymentDay}
                        placeholder="1-31"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Deposit</Text>
                      <TextInput
                        style={styles.input}
                        value={formDeposit}
                        onChangeText={setFormDeposit}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Create Tenant(ተከራይ)</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  list: { padding: 16, paddingTop: 8 },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  tenantInfo: { flex: 1, marginLeft: 12 },
  tenantName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  tenantPhone: { fontSize: 14, color: '#64748b', marginTop: 2 },
  tenantRoom: { fontSize: 12, color: '#0ea5e9', marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#64748b', fontSize: 15, marginTop: 12, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(14,165,233,0.3)',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 20,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  houseSelector: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#f8fafc',
  },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { fontSize: 13, color: '#64748b' },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  noDataText: { fontSize: 13, color: '#94a3b8', paddingVertical: 8 },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  genderChipActive: { backgroundColor: '#e0f2fe', borderColor: '#0ea5e9' },
  genderText: { fontSize: 14, color: '#64748b' },
  genderTextActive: { color: '#0ea5e9', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
