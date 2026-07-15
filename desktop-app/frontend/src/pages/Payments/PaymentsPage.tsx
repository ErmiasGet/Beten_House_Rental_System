import { useState, useEffect } from 'react';
import { paymentsAPI, tenantsAPI, contractsAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/toaster';
import { Plus, Pencil, Wallet } from 'lucide-react';
import { formatCurrency, getMonthName } from '@beten-homes-rent/shared';

export function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showPayOverdueModal, setShowPayOverdueModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenantId: '',
    roomId: '',
    contractId: '',
    amount: 0,
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
  });
  const [payOverdueData, setPayOverdueData] = useState({
    tenantId: '',
    amount: 0,
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [tenantBalance, setTenantBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [page]);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      tenantId: '',
      roomId: '',
      contractId: '',
      amount: 0,
      amountPaid: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      notes: '',
    });
    setShowModal(true);
    loadTenants();
    loadContracts();
  };

  const openEditModal = (payment: any) => {
    setEditId(payment.id);
    setFormData({
      tenantId: payment.tenantId || '',
      roomId: payment.roomId || '',
      contractId: payment.contractId || '',
      amount: payment.amount,
      amountPaid: payment.amountPaid ?? payment.amount,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod,
      month: payment.month,
      year: payment.year,
      notes: payment.notes || '',
    });
    setShowModal(true);
    loadTenants();
    loadContracts();
  };

  const openPayOverdueModal = async () => {
    setPayOverdueData({
      tenantId: '',
      amount: 0,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setTenantBalance(null);
    setShowPayOverdueModal(true);
    loadTenants();
  };

  const loadTenants = async () => {
    try {
      const r = await tenantsAPI.getAll({ page: 1, limit: 200 });
      setTenants(r.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadContracts = async () => {
    try {
      const r = await contractsAPI.getAll({ page: 1, limit: 200 });
      setContracts(r.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await paymentsAPI.getAll({ page, limit: 10 });
      setPayments(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await paymentsAPI.create(formData);
      toast({ title: 'Success', description: 'Payment recorded' });
      setShowModal(false);
      loadPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await paymentsAPI.update(editId!, {
        amount: formData.amount,
        amountPaid: formData.amountPaid,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      });
      toast({ title: 'Success', description: 'Payment updated' });
      setShowModal(false);
      loadPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOverdueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOverdueData.tenantId || payOverdueData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please select a tenant and enter an amount',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await paymentsAPI.payOverdue(payOverdueData);
      toast({
        title: 'Success',
        description: `Applied ${formatCurrency(result.data.data.totalPaid)} across ${result.data.data.payments.length} month(s). Remaining: ${formatCurrency(result.data.data.remainingBalance)}`,
      });
      setShowPayOverdueModal(false);
      loadPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOverdueTenantChange = async (tenantId: string) => {
    setPayOverdueData({ ...payOverdueData, tenantId });
    if (!tenantId) {
      setTenantBalance(null);
      return;
    }
    setLoadingBalance(true);
    try {
      const result = await paymentsAPI.getBalance(tenantId);
      setTenantBalance(result.data.data);
    } catch (e) {
      setTenantBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    setFormData({
      ...formData,
      contractId,
      roomId: contract?.roomId || '',
      tenantId: contract?.tenantId || '',
      amount: contract?.monthlyRent || formData.amount,
      amountPaid: contract?.monthlyRent || formData.amountPaid,
    });
  };

  const getProgressWidth = (payment: any) => {
    if (!payment.amount || payment.amount === 0) return '0%';
    const paid = payment.amountPaid ?? (payment.status === 'PAID' ? payment.amount : 0);
    return `${Math.min(100, (paid / payment.amount) * 100)}%`;
  };

  const columns = [
    { key: 'receiptNumber', header: 'Receipt #' },
    { key: 'tenant', header: 'Tenant', render: (item: any) => item.tenant?.fullName },
    { key: 'room', header: 'Room', render: (item: any) => item.room?.roomNumber },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: any) => {
        const paid = item.amountPaid ?? (item.status === 'PAID' ? item.amount : 0);
        const isPartial = paid > 0 && paid < item.amount;
        return (
          <div>
            <div>{formatCurrency(item.amount)}</div>
            {isPartial && (
              <div className="text-xs text-amber-600 mt-0.5">
                Paid: {formatCurrency(paid)} ({Math.round((paid / item.amount) * 100)}%)
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (item: any) => {
        const paid = item.amountPaid ?? (item.status === 'PAID' ? item.amount : 0);
        const pct = item.amount > 0 ? Math.min(100, (paid / item.amount) * 100) : 0;
        const color = pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-amber-500' : 'bg-gray-200';
        return (
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
        );
      },
    },
    {
      key: 'paymentDate',
      header: 'Date',
      render: (item: any) => new Date(item.paymentDate).toLocaleDateString(),
    },
    { key: 'paymentMethod', header: 'Method' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge
          variant={
            item.status === 'PAID'
              ? 'success'
              : item.status === 'OVERDUE'
                ? 'destructive'
                : 'warning'
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await paymentsAPI.delete(id);
      toast({ title: 'Deleted' });
      loadPayments();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Track rent payments and receipts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openPayOverdueModal}>
            <Wallet className="h-4 w-4 mr-2" /> Pay Overdue
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" /> Record Payment
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create/Edit Payment Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Edit Payment' : 'Record Payment'}
      >
        <form onSubmit={editId ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
          {!editId && (
            <div>
              <label className="block text-sm font-medium mb-1">Contract</label>
              <Select
                value={formData.contractId}
                onChange={(e) => handleContractChange(e.target.value)}
                required
              >
                <option value="">Select contract</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tenant?.fullName} - Room {c.room?.roomNumber} (
                    {formatCurrency(c.monthlyRent)}/mo)
                  </option>
                ))}
              </Select>
            </div>
          )}
          {!editId && (
            <div>
              <label className="block text-sm font-medium mb-1">Tenant</label>
              <Select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                required
                disabled
              >
                <option value="">Select tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.phone})
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount Due</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 500"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount Paid</label>
              <Input
                type="number"
                min={0}
                max={formData.amount}
                placeholder="e.g. 500"
                value={formData.amountPaid}
                onChange={(e) =>
                  setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })
                }
                required
              />
              {formData.amountPaid > 0 && formData.amountPaid < formData.amount && (
                <p className="text-xs text-amber-600 mt-1">
                  Remaining: {formatCurrency(formData.amount - formData.amountPaid)}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CHECK">Check</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Date</label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <Select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <Input
                type="number"
                placeholder="e.g. 2026"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional payment notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving...' : editId ? 'Update Payment' : 'Record Payment'}
          </Button>
        </form>
      </Modal>

      {/* Pay Overdue Modal */}
      <Modal
        open={showPayOverdueModal}
        onClose={() => setShowPayOverdueModal(false)}
        title="Pay Overdue Balance"
      >
        <form onSubmit={handlePayOverdueSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Tenant</label>
            <Select
              value={payOverdueData.tenantId}
              onChange={(e) => handlePayOverdueTenantChange(e.target.value)}
              required
            >
              <option value="">Select tenant with overdue balance</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.phone})
                </option>
              ))}
            </Select>
          </div>

          {loadingBalance && (
            <div className="text-center py-4 text-sm text-gray-500">Loading balance...</div>
          )}

          {tenantBalance && !loadingBalance && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Total Owed</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(tenantBalance.totalOwed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Already Paid</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(tenantBalance.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-bold text-gray-800">Outstanding Balance</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(tenantBalance.outstandingBalance)}
                </span>
              </div>

              {tenantBalance.records.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Overdue Months</p>
                  {tenantBalance.records.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {getMonthName(r.month)} {r.year}
                        {r.roomNumber && (
                          <span className="text-gray-400"> (Room {r.roomNumber})</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {r.amountPaid > 0 ? `${formatCurrency(r.amountPaid)}/` : ''}
                          {formatCurrency(r.amount)}
                        </span>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.amountPaid > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                            style={{
                              width: `${r.amount > 0 ? (r.amountPaid / r.amount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tenantBalance && !loadingBalance && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Amount</label>
                <Input
                  type="number"
                  min={1}
                  max={tenantBalance.outstandingBalance}
                  placeholder="e.g. 1000"
                  value={payOverdueData.amount}
                  onChange={(e) =>
                    setPayOverdueData({
                      ...payOverdueData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
                {payOverdueData.amount > 0 &&
                  payOverdueData.amount < tenantBalance.outstandingBalance && (
                    <p className="text-xs text-amber-600 mt-1">
                      Remaining after payment:{' '}
                      {formatCurrency(tenantBalance.outstandingBalance - payOverdueData.amount)}
                    </p>
                  )}
                <div className="flex gap-2 mt-2">
                  {[1000, 2000, 5000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPayOverdueData({
                          ...payOverdueData,
                          amount: Math.min(amt, tenantBalance.outstandingBalance),
                        })
                      }
                    >
                      {formatCurrency(amt)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPayOverdueData({
                        ...payOverdueData,
                        amount: tenantBalance.outstandingBalance,
                      })
                    }
                  >
                    Pay All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <Select
                    value={payOverdueData.paymentMethod}
                    onChange={(e) =>
                      setPayOverdueData({ ...payOverdueData, paymentMethod: e.target.value })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CHECK">Check</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date</label>
                  <Input
                    type="date"
                    value={payOverdueData.paymentDate}
                    onChange={(e) =>
                      setPayOverdueData({ ...payOverdueData, paymentDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={payOverdueData.notes}
                  onChange={(e) => setPayOverdueData({ ...payOverdueData, notes: e.target.value })}
                  placeholder="Optional payment notes..."
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !tenantBalance || payOverdueData.amount <= 0}
          >
            {submitting ? 'Processing...' : 'Apply Payment'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
