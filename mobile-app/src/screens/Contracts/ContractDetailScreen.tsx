import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { contractsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '@beten-homes-rent/shared';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

interface ContractDetailProps {
  route: any;
  navigation: any;
}

export function ContractDetailScreen({ route, navigation }: ContractDetailProps) {
  const { contractId } = route.params;
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoVisible, setPhotoVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadContract();
    }, [contractId])
  );

  const loadContract = async () => {
    try {
      setError(null);
      const response = await contractsAPI.getById(contractId);
      setContract(response.data.data);
    } catch (error) {
      console.error('ContractDetail loadContract error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE}/${path}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#d1fae5', text: '#059669' };
      case 'EXPIRED':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'TERMINATED':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#fef3c7', text: '#d97706' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (error && !contract) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadContract}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(contract?.status);
  const imageUrl = contract?.contractImage ? getImageUrl(contract.contractImage) : null;

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>{contract?.status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#0ea5e9" />
            <Text style={styles.cardTitle}>Tenant</Text>
          </View>
          <Text style={styles.primaryValue}>{contract?.tenant?.fullName}</Text>
          <Text style={styles.secondaryValue}>{contract?.tenant?.phone}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business" size={20} color="#10b981" />
            <Text style={styles.cardTitle}>Property & Room</Text>
          </View>
          <Text style={styles.primaryValue}>{contract?.house?.name}</Text>
          <Text style={styles.secondaryValue}>Room {contract?.room?.roomNumber}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color="#f59e0b" />
            <Text style={styles.cardTitle}>Contract Details</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date</Text>
            <Text style={styles.detailValue}>{formatDate(contract?.startDate, 'long')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Day</Text>
            <Text style={styles.detailValue}>{contract?.paymentDay}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Deposit</Text>
            <Text style={styles.detailValue}>{formatCurrency(contract?.deposit || 0)}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.rentCard]}>
          <Text style={styles.rentLabel}>Monthly Rent</Text>
          <Text style={styles.rentValue}>{formatCurrency(contract?.monthlyRent || 0)}</Text>
        </View>

        {imageUrl && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="image" size={20} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Contract Photo</Text>
            </View>
            <Text style={styles.photoHint}>Tap to view full size</Text>
            <TouchableOpacity onPress={() => setPhotoVisible(true)}>
              <Image source={{ uri: imageUrl }} style={styles.photoImage} resizeMode="cover" />
            </TouchableOpacity>
          </View>
        )}

        {contract?.payments && contract.payments.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={20} color="#0ea5e9" />
              <Text style={styles.cardTitle}>Payment History</Text>
            </View>
            {contract.payments.map((payment: any) => {
              const pStatusColor =
                payment.status === 'PAID'
                  ? { bg: '#d1fae5', text: '#059669' }
                  : payment.status === 'OVERDUE'
                    ? { bg: '#fee2e2', text: '#dc2626' }
                    : { bg: '#fef3c7', text: '#d97706' };
              return (
                <View key={payment.id} style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentPeriod}>
                      {payment.month}/{payment.year}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.paymentDate, 'short')}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <View style={[styles.miniBadge, { backgroundColor: pStatusColor.bg }]}>
                      <Text style={[styles.miniBadgeText, { color: pStatusColor.text }]}>
                        {payment.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {imageUrl && (
        <Modal visible={photoVisible} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setPhotoVisible(false)}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPhotoVisible(false)}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" />
            <Text style={styles.modalHint}>Tap anywhere to close</Text>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  statusRow: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    margin: 16,
    marginBottom: 0,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  primaryValue: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  secondaryValue: { fontSize: 14, color: '#64748b', marginTop: 2 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: { fontSize: 14, color: '#64748b' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  rentCard: {
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: '#0ea5e9',
  },
  rentLabel: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },
  rentValue: { fontSize: 28, fontWeight: 'bold', color: '#1e40af', marginTop: 4 },
  photoHint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 8 },
  photoImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentPeriod: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  paymentDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  miniBadgeText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  modalImage: { width: SCREEN_WIDTH - 20, height: SCREEN_HEIGHT - 150 },
  modalHint: { color: '#ffffff80', fontSize: 14, position: 'absolute', bottom: 50 },
});
