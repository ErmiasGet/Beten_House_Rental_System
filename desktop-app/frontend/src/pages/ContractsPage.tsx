import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractsAPI, tenantsAPI, housesAPI, roomsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toaster';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@beten-homes-rent/shared';

export function ContractsPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [housesList, setHousesList] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    tenantId: '',
    houseId: '',
    roomId: '',
    startDate: '',
    monthlyRent: 0,
    deposit: 0,
    paymentDay: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContracts();
    loadTenants();
    loadHouses();
  }, [page]);

  const openCreateModal = () => {
    setFormData({
      tenantId: '',
      houseId: '',
      roomId: '',
      startDate: '',
      monthlyRent: 0,
      deposit: 0,
      paymentDay: 1,
    });
    setShowModal(true);
  };

  const loadContracts = async () => {
    try {
      const response = await contractsAPI.getAll({ page, limit: 10 });
      setContracts(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await tenantsAPI.getAll({ page: 1, limit: 100 });
      setTenants(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadHouses = async () => {
    try {
      const response = await housesAPI.getAll({ page: 1, limit: 100 });
      setHousesList(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadRooms = async (houseId: string) => {
    try {
      const response = await roomsAPI.getVacant(houseId);
      setRooms(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contractsAPI.create(formData);
      toast({ title: 'Success', description: 'Contract created' });
      setShowModal(false);
      loadContracts();
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

  const handleTerminate = async (id: string) => {
    if (!confirm('Terminate this contract?')) return;
    try {
      await contractsAPI.terminate(id);
      toast({ title: 'Contract terminated' });
      loadContracts();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const columns = [
    { key: 'tenant', header: 'Tenant', render: (item: any) => item.tenant?.fullName },
    { key: 'house', header: 'House', render: (item: any) => item.house?.name },
    { key: 'room', header: 'Room', render: (item: any) => item.room?.roomNumber },
    { key: 'monthlyRent', header: 'Rent', render: (item: any) => formatCurrency(item.monthlyRent) },
    {
      key: 'startDate',
      header: 'Start',
      render: (item: any) => new Date(item.startDate).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge
          variant={
            item.status === 'ACTIVE'
              ? 'success'
              : item.status === 'EXPIRED'
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
          {item.status === 'ACTIVE' ? (
            <Button variant="destructive" size="sm" onClick={() => handleTerminate(item.id)}>
              Terminate
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rental Contracts</h1>
          <p className="page-subtitle">Manage tenant rental agreements</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> New Contract
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={contracts}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(item: any) => navigate(`/contracts/${item.id}`)}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Rental Contract"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tenant</label>
              <Select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                required
              >
                <option value="">Select tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">House</label>
              <Select
                value={formData.houseId}
                onChange={(e) => {
                  setFormData({ ...formData, houseId: e.target.value, roomId: '' });
                  loadRooms(e.target.value);
                }}
                required
              >
                <option value="">Select house</option>
                {housesList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room</label>
            <Select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              required
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} - {formatCurrency(r.monthlyRent)}/month
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent</label>
              <Input
                type="number"
                min={0}
                value={formData.monthlyRent}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deposit</label>
              <Input
                type="number"
                min={0}
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Day</label>
              <Input
                type="number"
                min={1}
                max={31}
                value={formData.paymentDay}
                onChange={(e) => setFormData({ ...formData, paymentDay: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Contract'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
