import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, getMonthName } from '@beten-homes-rent/shared';

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK'] as const;
const GROUP_FILTERS = ['UNPAID', 'OVERDUE', 'PARTIAL'];

export function PaymentsScreen() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [markingTenant, setMarkingTenant] = useState<string | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pendingActionRef = useRef<
    { type: 'single'; payment: any } | { type: 'group'; group: any } | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [filter])
  );

  const loadPayments = async () => {
    try {
      setError(null);
      const params: any = { page: 1, limit: 50 };
      if (filter) params.status = filter;
      const response = await paymentsAPI.getAll(params);
      setPayments(response.data.data);
    } catch (error) {
      console.error('Payments loadPayments error:', error);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupByTenant = (items: any[]) => {
    const groups: Record<
      string,
      {
        tenant: any;
        room: any;
        payments: any[];
        totalAmount: number;
        totalPaid: number;
        totalRemaining: number;
      }
    > = {};
    for (const p of items) {
      const key = p.tenant?.id || p.tenantId;
      if (!key) continue;
      if (!groups[key]) {
        groups[key] = {
          tenant: p.tenant,
          room: p.room,
          payments: [],
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
        };
      }
      groups[key].payments.push(p);
      groups[key].totalAmount += p.amount;
      const paid = p.amountPaid ?? (p.status === 'PAID' ? p.amount : 0);
      groups[key].totalPaid += paid;
      groups[key].totalRemaining += p.amount - paid;
    }
    return Object.values(groups).sort((a, b) => b.totalRemaining - a.totalRemaining);
  };

  const shouldGroup = filter === '' || GROUP_FILTERS.includes(filter);
  const groupedData = shouldGroup ? groupByTenant(payments) : [];
  const flatData = shouldGroup ? groupedData : payments;

  const handleMarkAsPaid = async (paymentMethod: string, payment: any) => {
    if (!payment) return;
    try {
      setMarkingTenant(payment.tenant?.id || payment.tenantId);
      setShowMethodPicker(false);
      await paymentsAPI.update(payment.id, { status: 'PAID', paymentMethod });
      loadPayments();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark payment as paid');
    } finally {
      setMarkingTenant(null);
    }
  };

  const handlePartialPayment = async (paymentMethod: string, payment: any) => {
    if (!payment || !customAmount) return;
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }
    const remaining = payment.amount - (payment.amountPaid ?? 0);
    if (amount > remaining) {
      Alert.alert('Amount Too Large', `Maximum payable amount is ${formatCurrency(remaining)}`);
      return;
    }
    try {
      setMarkingTenant(payment.tenant?.id || payment.tenantId);
      setShowAmountModal(false);
      setCustomAmount('');
      const newAmountPaid = (payment.amountPaid ?? 0) + amount;
      const newStatus = newAmountPaid >= payment.amount ? 'PAID' : 'PARTIAL';
      await paymentsAPI.update(payment.id, {
        amountPaid: newAmountPaid,
        status: newStatus,
        paymentMethod,
        paymentDate: new Date().toISOString(),
      });
      loadPayments();
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setMarkingTenant(null);
    }
  };

  const handleMarkAllAsPaid = async (paymentMethod: string, group: any) => {
    if (!group?.payments?.length) return;
    try {
      setMarkingTenant(group.tenant?.id);
      setShowMethodPicker(false);
      const unpaidPayments = group.payments.filter((p: any) => p.status !== 'PAID');
      await Promise.all(
        unpaidPayments.map((p: any) => {
          const paid = p.amountPaid ?? 0;
          return paymentsAPI.update(p.id, {
            amountPaid: p.amount,
            status: 'PAID',
            paymentMethod,
            paymentDate: new Date().toISOString(),
          });
        })
      );
      setExpandedTenant(null);
      loadPayments();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark payments as paid');
    } finally {
      setMarkingTenant(null);
    }
  };

  const handlePayPartialGroup = async (paymentMethod: string, group: any) => {
    if (!group?.payments?.length || !customAmount) return;
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }
    if (amount > group.totalRemaining) {
      Alert.alert(
        'Amount Too Large',
        `Maximum payable amount is ${formatCurrency(group.totalRemaining)}`
      );
      return;
    }
    try {
      setMarkingTenant(group.tenant?.id);
      setShowAmountModal(false);
      setCustomAmount('');
      let remaining = amount;
      const unpaidPayments = group.payments
        .filter((p: any) => p.status !== 'PAID')
        .sort((a: any, b: any) => a.year - b.year || a.month - b.month);

      for (const p of unpaidPayments) {
        if (remaining <= 0) break;
        const balance = p.amount - (p.amountPaid ?? 0);
        const applied = Math.min(remaining, balance);
        const newAmountPaid = (p.amountPaid ?? 0) + applied;
        const newStatus = newAmountPaid >= p.amount ? 'PAID' : 'PARTIAL';
        await paymentsAPI.update(p.id, {
          amountPaid: newAmountPaid,
          status: newStatus,
          paymentMethod,
          paymentDate: new Date().toISOString(),
        });
        remaining -= applied;
      }
      setExpandedTenant(null);
      loadPayments();
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setMarkingTenant(null);
    }
  };

  const showPayMethodPicker = (payment: any) => {
    pendingActionRef.current = { type: 'single', payment };
    setShowMethodPicker(true);
  };

  const showPayAllPicker = (group: any) => {
    pendingActionRef.current = { type: 'group', group };
    setShowMethodPicker(true);
  };

  const showPartialAmountPicker = (
    target: { type: 'single'; payment: any } | { type: 'group'; group: any }
  ) => {
    pendingActionRef.current = target;
    setCustomAmount('');
    setShowAmountModal(true);
  };

  const getGroupBadge = (payments: any[]) => {
    const allPaid = payments.every((p) => p.status === 'PAID');
    if (allPaid) return { label: 'PAID', bg: '#d1fae5', fg: '#059669' };
    const hasPartial = payments.some((p) => p.status === 'PARTIAL');
    if (hasPartial) return { label: 'PARTIAL', bg: '#fef3c7', fg: '#d97706' };
    const hasOverdue = payments.some((p) => p.status === 'OVERDUE');
    if (hasOverdue) return { label: 'OVERDUE', bg: '#fee2e2', fg: '#dc2626' };
    return { label: 'UNPAID', bg: '#fef3c7', fg: '#d97706' };
  };

  const getProgressWidth = (payment: any) => {
    const paid = payment.amountPaid ?? (payment.status === 'PAID' ? payment.amount : 0);
    if (!payment.amount || payment.amount === 0) return '0%';
    return `${Math.min(100, (paid / payment.amount) * 100)}%`;
  };

  const getProgressColor = (payment: any) => {
    const paid = payment.amountPaid ?? (payment.status === 'PAID' ? payment.amount : 0);
    if (paid >= payment.amount) return '#059669';
    if (paid > 0) return '#d97706';
    return '#e2e8f0';
  };

  const renderGroupedItem = ({ item }: { item: (typeof groupedData)[0] }) => {
    const isExpanded = expandedTenant === item.tenant?.id;
    const badge = getGroupBadge(item.payments);
    const marking = markingTenant === item.tenant?.id;
    const hasUnpaid = item.payments.some(
      (p) => p.status === 'UNPAID' || p.status === 'OVERDUE' || p.status === 'PARTIAL'
    );

    return (
      <View style={styles.paymentCard}>
        <TouchableOpacity onPress={() => setExpandedTenant(isExpanded ? null : item.tenant?.id)}>
          <View style={styles.paymentHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tenantName}>{item.tenant?.fullName}</Text>
              <Text style={styles.roomLabel}>Room {item.room?.roomNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusText, { color: badge.fg }]}>{badge.label}</Text>
            </View>
          </View>

          <View style={styles.groupSummary}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.monthsOverdue, badge.label === 'PAID' && { color: '#059669' }]}>
                {item.payments.length} month{item.payments.length > 1 ? 's' : ''}
                {badge.label === 'PAID' ? ' paid' : ' unpaid'}
              </Text>
              {item.totalPaid > 0 && item.totalRemaining > 0 && (
                <Text style={styles.partialInfo}>
                  Paid: {formatCurrency(item.totalPaid)} / Remaining:{' '}
                  {formatCurrency(item.totalRemaining)}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalAmount}>
                {item.totalRemaining > 0
                  ? formatCurrency(item.totalRemaining)
                  : formatCurrency(item.totalAmount)}
              </Text>
              {item.totalPaid > 0 && item.totalRemaining > 0 && (
                <View style={styles.groupProgressBar}>
                  <View
                    style={[
                      styles.groupProgressFill,
                      {
                        width: `${Math.min(100, (item.totalPaid / item.totalAmount) * 100)}%`,
                        backgroundColor: '#d97706',
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailSection}>
            {item.payments.map((p) => {
              const paid = p.amountPaid ?? (p.status === 'PAID' ? p.amount : 0);
              const remaining = p.amount - paid;
              const pct = p.amount > 0 ? (paid / p.amount) * 100 : 0;
              return (
                <View key={p.id} style={styles.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailMonth}>
                      {getMonthName(p.month)} {p.year}
                    </Text>
                    {paid > 0 && paid < p.amount && (
                      <Text style={styles.detailPartial}>
                        Paid {formatCurrency(paid)} of {formatCurrency(p.amount)}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={styles.detailAmount}>
                      {remaining > 0 ? formatCurrency(remaining) : formatCurrency(p.amount)}
                    </Text>
                    {pct > 0 && pct < 100 && (
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${pct}%`, backgroundColor: getProgressColor(p) },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.detailStatus,
                      {
                        backgroundColor:
                          p.status === 'PAID'
                            ? '#d1fae5'
                            : p.status === 'PARTIAL'
                              ? '#fef3c7'
                              : p.status === 'OVERDUE'
                                ? '#fee2e2'
                                : '#fef3c7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailStatusText,
                        {
                          color:
                            p.status === 'PAID'
                              ? '#059669'
                              : p.status === 'PARTIAL'
                                ? '#d97706'
                                : p.status === 'OVERDUE'
                                  ? '#dc2626'
                                  : '#d97706',
                        },
                      ]}
                    >
                      {p.status}
                    </Text>
                  </View>
                </View>
              );
            })}
            {hasUnpaid && (
              <View style={styles.payActions}>
                <TouchableOpacity
                  style={[styles.payPartialBtn, marking && styles.payBtnDisabled]}
                  onPress={() => showPartialAmountPicker({ type: 'group', group: item })}
                  disabled={marking}
                >
                  <Text style={styles.payPartialBtnText}>Pay Custom Amount</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.payAllBtn, marking && styles.payBtnDisabled]}
                  onPress={() => showPayAllPicker(item)}
                  disabled={marking}
                >
                  <Text style={styles.payAllBtnText}>
                    {marking ? 'Processing...' : `Pay All ${formatCurrency(item.totalRemaining)}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpandedTenant(isExpanded ? null : item.tenant?.id)}
        >
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#0ea5e9" />
          <Text style={styles.expandBtnText}>{isExpanded ? 'Hide Details' : 'View Details'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFlatItem = ({ item }: { item: any }) => {
    const isUnpaid =
      item.status === 'UNPAID' || item.status === 'OVERDUE' || item.status === 'PARTIAL';
    const paid = item.amountPaid ?? (item.status === 'PAID' ? item.amount : 0);
    const remaining = item.amount - paid;
    const pct = item.amount > 0 ? (paid / item.amount) * 100 : 0;

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <Text style={styles.tenantName}>{item.tenant?.fullName}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'PAID'
                    ? '#d1fae5'
                    : item.status === 'PARTIAL'
                      ? '#fef3c7'
                      : item.status === 'OVERDUE'
                        ? '#fee2e2'
                        : '#fef3c7',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === 'PAID'
                      ? '#059669'
                      : item.status === 'PARTIAL'
                        ? '#d97706'
                        : item.status === 'OVERDUE'
                          ? '#dc2626'
                          : '#d97706',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.paymentDetails}>
          <View style={{ flex: 1 }}>
            <Text style={styles.roomLabel}>Room {item.room?.roomNumber}</Text>
            <Text style={styles.dateLabel}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
            {paid > 0 && paid < item.amount && (
              <Text style={styles.partialInfo}>
                Paid: {formatCurrency(paid)} / Remaining: {formatCurrency(remaining)}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amount}>
              {formatCurrency(remaining > 0 ? remaining : item.amount)}
            </Text>
            {pct > 0 && pct < 100 && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pct}%`, backgroundColor: getProgressColor(item) },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
        <View style={styles.paymentFooter}>
          <Text style={styles.methodLabel}>{item.paymentMethod}</Text>
          {isUnpaid && (
            <View style={styles.payBtnRow}>
              <TouchableOpacity
                style={styles.payPartialBtn}
                onPress={() => showPartialAmountPicker({ type: 'single', payment: item })}
                disabled={markingTenant === item.id}
              >
                <Text style={styles.payPartialBtnText}>Partial</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => showPayMethodPicker(item)}
                disabled={markingTenant === item.id}
              >
                <Text style={styles.payBtnText}>
                  {markingTenant === item.id ? 'Processing...' : 'Full'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (shouldGroup && item.payments) {
      return renderGroupedItem({ item });
    }
    return renderFlatItem({ item });
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {['', 'PAID', 'UNPAID', 'OVERDUE', 'PARTIAL'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error && payments.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#cbd5e1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPayments}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item: any) => (item.payments ? item.tenant?.id : item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadPayments();
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No payments found</Text>
            </View>
          }
        />
      )}

      {/* Payment Method Picker Modal */}
      <Modal visible={showMethodPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.methodOption}
                onPress={() => {
                  const action = pendingActionRef.current;
                  if (!action) return;
                  if (action.type === 'group') {
                    handleMarkAllAsPaid(method, action.group);
                  } else {
                    handleMarkAsPaid(method, action.payment);
                  }
                  pendingActionRef.current = null;
                }}
              >
                <Text style={styles.methodOptionText}>{method.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowMethodPicker(false);
                pendingActionRef.current = null;
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Amount Modal */}
      <Modal visible={showAmountModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Payment Amount</Text>

            {pendingActionRef.current?.type === 'group' && (
              <Text style={styles.balanceLabel}>
                Outstanding: {formatCurrency(pendingActionRef.current.group.totalRemaining)}
              </Text>
            )}
            {pendingActionRef.current?.type === 'single' && (
              <Text style={styles.balanceLabel}>
                Remaining:{' '}
                {formatCurrency(
                  pendingActionRef.current.payment.amount -
                    (pendingActionRef.current.payment.amountPaid ?? 0)
                )}
              </Text>
            )}

            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus
            />

            <View style={styles.quickAmounts}>
              {[500, 1000, 2000, 5000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickAmountBtn}
                  onPress={() => setCustomAmount(String(amt))}
                >
                  <Text style={styles.quickAmountText}>{formatCurrency(amt)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.amountPickerRow}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodOption,
                    !customAmount || parseFloat(customAmount) <= 0 ? styles.payBtnDisabled : null,
                  ]}
                  onPress={() => {
                    const action = pendingActionRef.current;
                    if (!action || !customAmount) return;
                    if (action.type === 'group') {
                      handlePayPartialGroup(method, action.group);
                    } else {
                      handlePartialPayment(method, action.payment);
                    }
                    pendingActionRef.current = null;
                  }}
                  disabled={!customAmount || parseFloat(customAmount) <= 0}
                >
                  <Text style={styles.methodOptionText}>{method.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowAmountModal(false);
                setCustomAmount('');
                pendingActionRef.current = null;
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filterRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#ffffff' },
  list: { padding: 16, paddingTop: 8 },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenantName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  roomLabel: { fontSize: 14, color: '#64748b', marginTop: 2 },
  dateLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  methodLabel: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  groupSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  monthsOverdue: { fontSize: 14, fontWeight: '600', color: '#dc2626', marginBottom: 4 },
  partialInfo: { fontSize: 12, color: '#d97706', marginTop: 2 },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#dc2626' },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  expandBtnText: { fontSize: 13, color: '#0ea5e9', fontWeight: '500' },
  detailSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginTop: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailMonth: { fontSize: 14, color: '#475569', flex: 1 },
  detailPartial: { fontSize: 11, color: '#d97706', marginTop: 2 },
  detailAmount: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  detailStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  detailStatusText: { fontSize: 11, fontWeight: '600' },
  payActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  payAllBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payAllBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  payPartialBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payPartialBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  payBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payBtnRow: { flexDirection: 'row', gap: 8 },
  payBtnDisabled: { backgroundColor: '#94a3b8' },
  payBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  groupProgressBar: {
    width: 80,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  groupProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  quickAmountBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  quickAmountText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  amountPickerRow: { gap: 8 },
  methodOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  methodOptionText: { fontSize: 16, color: '#1e293b', fontWeight: '500', textAlign: 'center' },
  cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
});
