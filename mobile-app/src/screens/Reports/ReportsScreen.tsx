import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { reportsAPI } from '../../services/api';
import { formatCurrency } from '@beten-homes-rent/shared';

export function ReportsScreen() {
  const [income, setIncome] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setError(null);
      setLoading(true);
      const year = new Date().getFullYear();
      const [incomeRes, occupancyRes] = await Promise.all([
        reportsAPI.getIncome({ startDate: `${year}-01-01`, endDate: `${year}-12-31` }),
        reportsAPI.getOccupancy(),
      ]);
      setIncome(incomeRes.data.data);
      setOccupancy(occupancyRes.data.data);
    } catch (error) {
      console.error('Reports loadReports error:', error);
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

  if (error && !income && !occupancy) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReports}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
      }
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up" size={20} color="#10b981" />
          <Text style={styles.cardTitle}>Yearly Income</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(income?.totalIncome || 0)}</Text>
        {income?.monthlyBreakdown?.slice(0, 6).map((m: any) => (
          <View key={`${m.month}-${m.year}`} style={styles.row}>
            <Text style={styles.rowLabel}>
              {new Date(m.year, m.month - 1).toLocaleString('en', { month: 'short' })}
            </Text>
            <Text style={styles.rowValue}>{formatCurrency(m.amount)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="home" size={20} color="#0ea5e9" />
          <Text style={styles.cardTitle}>Occupancy</Text>
        </View>
        {occupancy && (
          <>
            <View style={styles.occupancyGrid}>
              <View style={styles.occupancyItem}>
                <Text style={styles.occupancyValue}>{occupancy.totalRooms}</Text>
                <Text style={styles.occupancyLabel}>Total</Text>
              </View>
              <View style={styles.occupancyItem}>
                <Text style={[styles.occupancyValue, { color: '#10b981' }]}>
                  {occupancy.occupiedRooms}
                </Text>
                <Text style={styles.occupancyLabel}>Occupied</Text>
              </View>
              <View style={styles.occupancyItem}>
                <Text style={[styles.occupancyValue, { color: '#f59e0b' }]}>
                  {occupancy.vacantRooms}
                </Text>
                <Text style={styles.occupancyLabel}>Vacant</Text>
              </View>
              <View style={styles.occupancyItem}>
                <Text style={[styles.occupancyValue, { color: '#8b5cf6' }]}>
                  {occupancy.occupancyRate?.toFixed(1)}%
                </Text>
                <Text style={styles.occupancyLabel}>Rate</Text>
              </View>
            </View>
            {occupancy.houseBreakdown?.map((h: any) => (
              <View key={h.houseId} style={styles.row}>
                <Text style={styles.rowLabel}>{h.houseName}</Text>
                <Text style={styles.rowValue}>
                  {h.occupied}/{h.total}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#64748b', fontSize: 15, marginTop: 12 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#ffffff', fontWeight: '600' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: '#0ea5e9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  amount: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  occupancyGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  occupancyItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  occupancyValue: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  occupancyLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
});
