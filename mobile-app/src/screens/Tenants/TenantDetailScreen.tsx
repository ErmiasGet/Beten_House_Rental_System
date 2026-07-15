import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { tenantsAPI, paymentsAPI } from '../../services/api';
import { formatCurrency, getMonthName } from '@beten-homes-rent/shared';

interface TenantDetailProps {
  route: any;
  navigation: any;
}

export function TenantDetailScreen({ route, navigation }: TenantDetailProps) {
  const { tenantId } = route.params;
  const [tenant, setTenant] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTenant();
    }, [tenantId])
  );

  const loadTenant = async () => {
    try {
      setError(null);
      const [tenantRes, balanceRes] = await Promise.all([
        tenantsAPI.getById(tenantId),
        paymentsAPI.getBalance(tenantId).catch(() => null),
      ]);
      setTenant(tenantRes.data.data);
      if (balanceRes?.data?.data) {
        setBalance(balanceRes.data.data);
      }
    } catch (error) {
      console.error('TenantDetail loadTenant error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (error && !tenant) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTenant}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!tenant) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Tenant(ተከራይ) not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tenant.fullName?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{tenant.fullName}</Text>
        <Text style={styles.role}>{tenant.occupation || 'No occupation'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#64748b" />
          <Text style={styles.infoText}>{tenant.phone}</Text>
        </View>
        {tenant.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>{tenant.email}</Text>
          </View>
        )}
        {tenant.gender && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>{tenant.gender}</Text>
          </View>
        )}
        {tenant.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>{tenant.address}</Text>
          </View>
        )}
      </View>

      {tenant.room && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="home-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>
              Room {tenant.room.roomNumber} - {tenant.room.house?.name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color="#64748b" />
            <Text style={styles.infoText}>
              Rent: {formatCurrency(tenant.room.monthlyRent)}/month
            </Text>
          </View>
        </View>
      )}

      {balance && balance.outstandingBalance > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outstanding Balance</Text>
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Total Owed</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance.totalOwed)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Already Paid</Text>
              <Text style={[styles.balanceValue, { color: '#059669' }]}>
                {formatCurrency(balance.totalPaid)}
              </Text>
            </View>
            <View style={[styles.balanceRow, styles.balanceRowTotal]}>
              <Text style={styles.balanceLabelTotal}>Outstanding</Text>
              <Text style={styles.balanceValueTotal}>
                {formatCurrency(balance.outstandingBalance)}
              </Text>
            </View>
          </View>

          {balance?.records && balance.records.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 8 }]}>
                Overdue Months
              </Text>
              {balance.records.map((record: any) => {
                const pct = record.amount > 0 ? (record.amountPaid / record.amount) * 100 : 0;
                return (
                  <View key={record.id} style={styles.balanceRecord}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordMonth}>
                        {getMonthName(record.month)} {record.year}
                      </Text>
                      {record.roomNumber && (
                        <Text style={styles.recordRoom}>Room {record.roomNumber}</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.recordAmount}>
                        {record.amountPaid > 0
                          ? `${formatCurrency(record.amountPaid)} / ${formatCurrency(record.amount)}`
                          : formatCurrency(record.amount)}
                      </Text>
                      {pct > 0 && pct < 100 && (
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${pct}%` }]} />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {tenant.payments && tenant.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {tenant.payments.slice(0, 10).map((payment: any) => {
            const paid = payment.amountPaid ?? (payment.status === 'PAID' ? payment.amount : 0);
            return (
              <View key={payment.id} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentMonth}>
                    {new Date(payment.year, payment.month - 1).toLocaleString('en', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  {paid > 0 && paid < payment.amount && (
                    <Text style={styles.paymentPartial}>Paid: {formatCurrency(paid)}</Text>
                  )}
                  <Text
                    style={[
                      styles.paymentStatus,
                      {
                        color:
                          payment.status === 'PAID'
                            ? '#10b981'
                            : payment.status === 'PARTIAL'
                              ? '#d97706'
                              : '#ef4444',
                      },
                    ]}
                  >
                    {payment.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(14,165,233,0.1)',
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: '#0ea5e9',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#e0f2fe',
  },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  role: { fontSize: 14, color: '#64748b', marginTop: 4 },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  infoText: { fontSize: 15, color: '#475569', flex: 1 },
  balanceCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 14,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  balanceLabel: { fontSize: 14, color: '#64748b' },
  balanceValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  balanceLabelTotal: { fontSize: 15, fontWeight: '700', color: '#991b1b' },
  balanceValueTotal: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  balanceRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recordMonth: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  recordRoom: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  recordAmount: { fontSize: 13, color: '#475569' },
  progressBar: {
    width: 60,
    height: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentMonth: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  paymentDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  paymentAmount: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  paymentPartial: { fontSize: 11, color: '#d97706', marginTop: 2 },
  paymentStatus: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  errorText: { color: '#64748b', fontSize: 15, marginTop: 12 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#ffffff', fontWeight: '600' },
});
