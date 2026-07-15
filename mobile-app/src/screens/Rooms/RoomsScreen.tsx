import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { roomsAPI, housesAPI } from '../../services/api';
import { formatCurrency } from '@beten-homes-rent/shared';

export function RoomsScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formHouseId, setFormHouseId] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formFloor, setFormFloor] = useState('1');
  const [formLength, setFormLength] = useState('');
  const [formWidth, setFormWidth] = useState('');
  const [formBedrooms, setFormBedrooms] = useState('1');
  const [formBathrooms, setFormBathrooms] = useState('1');
  const [formHasKitchen, setFormHasKitchen] = useState(false);
  const [formRent, setFormRent] = useState('');
  const [formDeposit, setFormDeposit] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setError(null);
      const [roomsRes, housesRes] = await Promise.all([
        roomsAPI.getAll({ page: 1, limit: 50 }),
        housesAPI.getAll({ page: 1, limit: 100 }),
      ]);
      setRooms(roomsRes.data.data);
      setFilteredRooms(roomsRes.data.data);
      setHouses(housesRes.data.data);
    } catch (error) {
      console.error('Rooms loadRooms error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredRooms(rooms);
      return;
    }
    const lower = text.toLowerCase();
    setFilteredRooms(
      rooms.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(lower) || r.house?.name?.toLowerCase().includes(lower)
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: '#d1fae5', text: '#059669' };
      case 'OCCUPIED':
        return { bg: '#dbeafe', text: '#2563eb' };
      default:
        return { bg: '#fef3c7', text: '#d97706' };
    }
  };

  const openCreate = () => {
    setEditingRoom(null);
    setFormHouseId(houses.length > 0 ? houses[0].id : '');
    setFormRoomNumber('');
    setFormFloor('1');
    setFormLength('');
    setFormWidth('');
    setFormBedrooms('1');
    setFormBathrooms('1');
    setFormHasKitchen(false);
    setFormRent('');
    setFormDeposit('');
    setModalVisible(true);
  };

  const openEdit = (room: any) => {
    setEditingRoom(room);
    setFormHouseId(room.houseId);
    setFormRoomNumber(room.roomNumber);
    setFormFloor(String(room.floorNumber));
    setFormLength(String(room.length || ''));
    setFormWidth(String(room.width || ''));
    setFormBedrooms(String(room.bedrooms));
    setFormBathrooms(String(room.bathrooms));
    setFormHasKitchen(room.hasKitchen);
    setFormRent(String(room.monthlyRent));
    setFormDeposit(String(room.depositAmount || ''));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formHouseId || !formRoomNumber.trim() || !formRent.trim()) {
      Alert.alert('Validation', 'House, room number, and rent are required.');
      return;
    }
    const len = parseFloat(formLength) || 0;
    const wid = parseFloat(formWidth) || 0;
    if (len <= 0 || wid <= 0) {
      Alert.alert('Validation', 'Length and width must be greater than 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        houseId: formHouseId,
        roomNumber: formRoomNumber.trim(),
        floorNumber: parseInt(formFloor) || 1,
        length: len,
        width: wid,
        bedrooms: parseInt(formBedrooms) || 1,
        bathrooms: parseInt(formBathrooms) || 1,
        hasKitchen: formHasKitchen,
        monthlyRent: parseFloat(formRent) || 0,
        depositAmount: parseFloat(formDeposit) || 0,
      };

      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, payload);
      } else {
        await roomsAPI.create(payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save room.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const renderRoom = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity style={styles.roomCard} onLongPress={() => openEdit(item)}>
        <View style={styles.roomHeader}>
          <View>
            <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
            <Text style={styles.houseName}>{item.house?.name || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.roomDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.bedrooms} bed</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.bathrooms} bath</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="resize-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>
              {item.length}m x {item.width}m
            </Text>
          </View>
        </View>
        <View style={styles.roomFooter}>
          <Text style={styles.rent}>{formatCurrency(item.monthlyRent)}/month</Text>
          <View style={styles.roomActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
              <Ionicons name="create-outline" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rooms..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error && rooms.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bed-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {search ? 'No rooms match your search' : 'No rooms found'}
              </Text>
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
              <Text style={styles.modalTitle}>{editingRoom ? 'Edit Room' : 'New Room'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>House *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.houseSelector}
              >
                {houses.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.houseChip, formHouseId === h.id && styles.houseChipActive]}
                    onPress={() => setFormHouseId(h.id)}
                  >
                    <Text
                      style={[
                        styles.houseChipText,
                        formHouseId === h.id && styles.houseChipTextActive,
                      ]}
                    >
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Room Number *</Text>
              <TextInput
                style={styles.input}
                value={formRoomNumber}
                onChangeText={setFormRoomNumber}
                placeholder="e.g. 101"
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Floor</Text>
                  <TextInput
                    style={styles.input}
                    value={formFloor}
                    onChangeText={setFormFloor}
                    keyboardType="numeric"
                    placeholder="e.g. 1"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Bedrooms</Text>
                  <TextInput
                    style={styles.input}
                    value={formBedrooms}
                    onChangeText={setFormBedrooms}
                    keyboardType="numeric"
                    placeholder="e.g. 2"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Length (m) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formLength}
                    onChangeText={setFormLength}
                    keyboardType="numeric"
                    placeholder="e.g. 4.5"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Width (m) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formWidth}
                    onChangeText={setFormWidth}
                    keyboardType="numeric"
                    placeholder="e.g. 3.5"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Bathrooms</Text>
                  <TextInput
                    style={styles.input}
                    value={formBathrooms}
                    onChangeText={setFormBathrooms}
                    keyboardType="numeric"
                    placeholder="e.g. 1"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Kitchen</Text>
                  <TouchableOpacity
                    style={[styles.kitchenToggle, formHasKitchen && styles.kitchenToggleActive]}
                    onPress={() => setFormHasKitchen(!formHasKitchen)}
                  >
                    <Ionicons
                      name={formHasKitchen ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={formHasKitchen ? '#10b981' : '#94a3b8'}
                    />
                    <Text style={styles.kitchenText}>{formHasKitchen ? 'Yes' : 'No'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.label}>Monthly Rent *</Text>
              <TextInput
                style={styles.input}
                value={formRent}
                onChangeText={setFormRent}
                keyboardType="numeric"
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.label}>Deposit Amount</Text>
              <TextInput
                style={styles.input}
                value={formDeposit}
                onChangeText={setFormDeposit}
                keyboardType="numeric"
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingRoom ? 'Update' : 'Create'}</Text>
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
  roomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomNumber: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  houseName: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  roomDetails: { flexDirection: 'row', marginTop: 12, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#64748b' },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  rent: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  roomActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
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
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(16,185,129,0.3)',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
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
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  houseSelector: { marginBottom: 4 },
  houseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#f8fafc',
  },
  houseChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  houseChipText: { fontSize: 13, color: '#64748b' },
  houseChipTextActive: { color: '#ffffff', fontWeight: '600' },
  kitchenToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  kitchenToggleActive: {},
  kitchenText: { fontSize: 14, color: '#475569' },
  saveBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
