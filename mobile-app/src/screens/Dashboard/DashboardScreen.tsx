import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardAPI } from '../../services/api';
import { formatCurrency } from '@beten-homes-rent/shared';

interface DashboardStats {
  totalHouses: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  monthlyIncome: number;
  pendingPayments: number;
  overduePayments: number;
}

export function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Dashboard loadStats error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statCards = [
    {
      label: 'Properties',
      value: stats?.totalHouses || 0,
      icon: 'business',
      color: '#0ea5e9',
      bg: '#e0f2fe',
    },
    {
      label: 'Total Rooms',
      value: stats?.totalRooms || 0,
      icon: 'grid',
      color: '#10b981',
      bg: '#d1fae5',
    },
    {
      label: 'Occupied',
      value: stats?.occupiedRooms || 0,
      icon: 'people',
      color: '#8b5cf6',
      bg: '#ede9fe',
    },
    {
      label: 'Vacant',
      value: stats?.vacantRooms || 0,
      icon: 'home',
      color: '#f59e0b',
      bg: '#fef3c7',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Overview</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="settings-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: card.bg }]}>
            <Ionicons name={card.icon as any} size={24} color={card.color} />
            <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.financialCard}>
        <Text style={styles.financialTitle}>Monthly Income</Text>
        <Text style={styles.financialAmount}>{formatCurrency(stats?.monthlyIncome || 0)}</Text>
        <View style={styles.financialRow}>
          <View style={styles.financialItem}>
            <Text style={styles.financialItemLabel}>Pending</Text>
            <Text style={[styles.financialItemValue, { color: '#f59e0b' }]}>
              {stats?.pendingPayments || 0}
            </Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialItemLabel}>Overdue</Text>
            <Text style={[styles.financialItemValue, { color: '#ef4444' }]}>
              {stats?.overduePayments || 0}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  header: { padding: 20, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsButton: { padding: 8 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  dateText: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',
    elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 2 },
  financialCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: '#0ea5e9',
  },
  financialTitle: { fontSize: 14, color: '#64748b' },
  financialAmount: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  financialRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  financialItem: { flex: 1 },
  financialItemLabel: { fontSize: 13, color: '#64748b' },
  financialItemValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
});
