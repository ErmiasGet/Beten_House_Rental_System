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
import { housesAPI } from '../../services/api';

export function HousesScreen() {
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filteredHouses, setFilteredHouses] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHouse, setEditingHouse] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formFloors, setFormFloors] = useState('1');
  const [formTotalRooms, setFormTotalRooms] = useState('0');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHouses();
    }, [])
  );

  const loadHouses = async () => {
    try {
      setError(null);
      const response = await housesAPI.getAll({ page: 1, limit: 50 });
      setHouses(response.data.data);
      setFilteredHouses(response.data.data);
    } catch (error) {
      console.error('Houses loadHouses error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredHouses(houses);
      return;
    }
    const lower = text.toLowerCase();
    setFilteredHouses(
      houses.filter(
        (h) => h.name.toLowerCase().includes(lower) || h.address.toLowerCase().includes(lower)
      )
    );
  };

  const openCreate = () => {
    setEditingHouse(null);
    setFormName('');
    setFormAddress('');
    setFormFloors('1');
    setFormTotalRooms('0');
    setModalVisible(true);
  };

  const openEdit = (house: any) => {
    setEditingHouse(house);
    setFormName(house.name);
    setFormAddress(house.address);
    setFormFloors(String(house.numberOfFloors));
    setFormTotalRooms(String(house.totalRooms));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      Alert.alert('Validation', 'Name and address are required.');
      return;
    }
    const floors = parseInt(formFloors) || 1;
    const rooms = parseInt(formTotalRooms) || 0;
    if (floors < 1) {
      Alert.alert('Validation', 'Must have at least 1 floor.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        address: formAddress.trim(),
        numberOfFloors: floors,
        totalRooms: rooms,
      };

      if (editingHouse) {
        await housesAPI.update(editingHouse.id, payload);
      } else {
        await housesAPI.create(payload);
      }
      setModalVisible(false);
      loadHouses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save house.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (house: any) => {
    Alert.alert('Delete House', `Are you sure you want to delete "${house.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await housesAPI.delete(house.id);
            loadHouses();
          } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to delete house.';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const renderHouse = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.houseCard} onLongPress={() => openEdit(item)}>
      <View style={styles.houseHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="home-outline" size={22} color="#0ea5e9" />
        </View>
        <View style={styles.houseInfo}>
          <Text style={styles.houseName}>{item.name}</Text>
          <Text style={styles.houseAddress}>{item.address}</Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => openEdit(item)}>
          <Ionicons name="create-outline" size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.numberOfFloors}</Text>
          <Text style={styles.statLabel}>Floors</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.totalRooms}</Text>
          <Text style={styles.statLabel}>Rooms</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item._count?.rentalContracts || 0}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search houses..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error && houses.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHouses}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredHouses}
          keyExtractor={(item) => item.id}
          renderItem={renderHouse}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHouses();
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {search ? 'No houses match your search' : 'No houses found'}
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
              <Text style={styles.modalTitle}>{editingHouse ? 'Edit House' : 'New House'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Sunset Apartments"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="e.g. 123 Main St"
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Floors *</Text>
                  <TextInput
                    style={styles.input}
                    value={formFloors}
                    onChangeText={setFormFloors}
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Total Rooms</Text>
                  <TextInput
                    style={styles.input}
                    value={formTotalRooms}
                    onChangeText={setFormTotalRooms}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingHouse ? 'Update' : 'Create'}</Text>
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
  houseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  houseHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  houseInfo: { flex: 1 },
  houseName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  houseAddress: { fontSize: 13, color: '#64748b', marginTop: 2 },
  menuBtn: { padding: 8 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
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
    maxHeight: '80%',
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
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
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
