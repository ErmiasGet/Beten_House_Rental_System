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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { notificationsAPI } from '../../services/api';
import { useNotifications } from '../../notifications/NotificationProvider';

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUnreadCount } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setError(null);
      const response = await notificationsAPI.getAll({ page: 1, limit: 50 });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Notifications loadNotifications error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      refreshUnreadCount();
    } catch (error) {
      console.error('Notifications markAsRead error:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_DUE':
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_RECEIVED':
        return 'card';
      case 'CONTRACT_EXPIRING':
      case 'CONTRACT_EXPIRED':
        return 'document-text';
      case 'ROOM_VACANT':
        return 'bed';
      case 'MAINTENANCE_DUE':
        return 'hammer';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'PAYMENT_OVERDUE':
        return '#dc2626';
      case 'PAYMENT_DUE':
        return '#d97706';
      case 'PAYMENT_RECEIVED':
        return '#10b981';
      case 'CONTRACT_EXPIRING':
        return '#0ea5e9';
      default:
        return '#64748b';
    }
  };

  const handleNotificationPress = async (item: any) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
    if (item.relatedId) {
      navigation.navigate('Tenants', {
        screen: 'TenantDetail',
        params: { tenantId: item.relatedId },
      });
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
        <Ionicons name={getIcon(item.type) as any} size={20} color={getIconColor(item.type)} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error && notifications.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No notifications</Text>
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
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
  },
  unreadCard: { backgroundColor: '#f0f9ff', borderLeftWidth: 3, borderLeftColor: '#0ea5e9' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 },
  unreadTitle: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0ea5e9', marginLeft: 8 },
  message: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, color: '#94a3b8' },
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
