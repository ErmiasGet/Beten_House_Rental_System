import { useState, useEffect } from 'react';
import { expensesAPI, housesAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/toaster';
import { Plus, Pencil } from 'lucide-react';
import { formatCurrency } from '@beten-homes-rent/shared';

const categories = ['MAINTENANCE', 'REPAIR', 'ELECTRICITY', 'WATER', 'CLEANING', 'SECURITY', 'OTHER'];

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    houseId: '', category: 'MAINTENANCE', amount: 0, description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({ houseId: '', category: 'MAINTENANCE', amount: 0, description: '', expenseDate: new Date().toISOString().split('T')[0] });
    setShowModal(true);
    loadHouses();
  };

  const openEditModal = (expense: any) => {
    setEditId(expense.id);
    setFormData({
      houseId: expense.houseId || '',
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
    });
    setShowModal(true);
    loadHouses();
  };

  useEffect(() => { loadExpenses(); loadHouses(); }, [page]);

  const loadExpenses = async () => {
    try {
      const response = await expensesAPI.getAll({ page, limit: 10 });
      setExpenses(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const loadHouses = async () => {
    try { const response = await housesAPI.getAll({ page: 1, limit: 100 }); setHouses(response.data.data); }
    catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await expensesAPI.update(editId, formData);
        toast({ title: 'Success', description: 'Expense updated' });
      } else {
        await expensesAPI.create(formData);
        toast({ title: 'Success', description: 'Expense recorded' });
      }
      setShowModal(false);
      loadExpenses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const columns = [
    { key: 'description', header: 'Description' },
    { key: 'category', header: 'Category', render: (item: any) => <Badge variant="secondary">{item.category}</Badge> },
    { key: 'house', header: 'House', render: (item: any) => item.house?.name },
    { key: 'amount', header: 'Amount', render: (item: any) => formatCurrency(item.amount) },
    { key: 'expenseDate', header: 'Date', render: (item: any) => new Date(item.expenseDate).toLocaleDateString() },
    { key: 'recordedBy', header: 'Recorded By', render: (item: any) => item.recordedBy?.fullName },
    {
      key: 'actions', header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try { await expensesAPI.delete(id); toast({ title: 'Deleted' }); loadExpenses(); }
    catch (error) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track property expenses</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>

      <DataTable columns={columns} data={expenses} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Expense' : 'Record Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">House</label>
            <Select value={formData.houseId} onChange={(e) => setFormData({ ...formData, houseId: e.target.value })} required>
              <option value="">Select house</option>
              {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input type="number" min={0} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input type="date" value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : editId ? 'Update Expense' : 'Record Expense'}</Button>
        </form>
      </Modal>
    </div>
  );
}
