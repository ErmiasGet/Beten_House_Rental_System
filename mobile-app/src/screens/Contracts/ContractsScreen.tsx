import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { contractsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '@beten-homes-rent/shared';

export function ContractsScreen({ navigation }: any) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadContracts();
    }, [])
  );

  const loadContracts = async () => {
    try {
      setError(null);
      const response = await contractsAPI.getAll({ page: 1, limit: 50 });
      setContracts(response.data.data);
    } catch (error) {
      console.error('Contracts loadContracts error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#d1fae5', text: '#059669' };
      case 'EXPIRED':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#fef3c7', text: '#d97706' };
    }
  };

  const renderContract = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.contractCard}
        onPress={() => navigation.navigate('ContractDetail', { contractId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.contractHeader}>
          <View>
            <Text style={styles.tenantName}>{item.tenant?.fullName}</Text>
            <Text style={styles.roomInfo}>
              Room {item.room?.roomNumber} - {item.house?.name}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.contractDates}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateValue}>{formatDate(item.startDate, 'short')}</Text>
          </View>
        </View>
        <Text style={styles.rent}>{formatCurrency(item.monthlyRent)}/month</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error && contracts.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadContracts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id}
          renderItem={renderContract}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadContracts();
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No contracts found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16 },
  contractCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenantName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  roomInfo: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  contractDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  dateItem: { alignItems: 'center' },
  dateLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' },
  dateValue: { fontSize: 14, color: '#475569', fontWeight: '500', marginTop: 2 },
  rent: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 10, textAlign: 'center' },
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
});
