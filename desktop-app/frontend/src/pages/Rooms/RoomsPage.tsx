import { useState, useEffect } from 'react';
import { roomsAPI, housesAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/toaster';
import { Plus, Pencil } from 'lucide-react';
import { formatCurrency } from '@beten-homes-rent/shared';

export function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    floorNumber: 1,
    length: 0,
    width: 0,
    bedrooms: 1,
    bathrooms: 1,
    hasKitchen: false,
    monthlyRent: 0,
    depositAmount: 0,
    houseId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      roomNumber: '',
      floorNumber: 1,
      length: 0,
      width: 0,
      bedrooms: 1,
      bathrooms: 1,
      hasKitchen: false,
      monthlyRent: 0,
      depositAmount: 0,
      houseId: '',
    });
    setShowModal(true);
  };

  const openEditModal = (room: any) => {
    setEditId(room.id);
    setFormData({
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      length: room.length,
      width: room.width,
      bedrooms: room.bedrooms,
      bathrooms: room.bathrooms,
      hasKitchen: room.hasKitchen,
      monthlyRent: room.monthlyRent,
      depositAmount: room.depositAmount,
      houseId: room.houseId,
    });
    setShowModal(true);
  };

  useEffect(() => {
    loadRooms();
    loadHouses();
  }, [page]);

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getAll({ page, limit: 10 });
      setRooms(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHouses = async () => {
    try {
      const response = await housesAPI.getAll({ page: 1, limit: 100 });
      setHouses(response.data.data);
    } catch (error) {
      console.error('Failed to load houses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await roomsAPI.update(editId, formData);
        toast({ title: 'Success', description: 'Room updated successfully' });
      } else {
        await roomsAPI.create(formData);
        toast({ title: 'Success', description: 'Room created successfully' });
      }
      setShowModal(false);
      setFormData({
        roomNumber: '',
        floorNumber: 1,
        length: 0,
        width: 0,
        bedrooms: 1,
        bathrooms: 1,
        hasKitchen: false,
        monthlyRent: 0,
        depositAmount: 0,
        houseId: '',
      });
      loadRooms();
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

  const columns = [
    { key: 'roomNumber', header: 'Room #' },
    {
      key: 'house',
      header: 'House',
      render: (item: any) => item.house?.name || 'N/A',
    },
    { key: 'floorNumber', header: 'Floor' },
    { key: 'bedrooms', header: 'Beds' },
    {
      key: 'monthlyRent',
      header: 'Rent',
      render: (item: any) => formatCurrency(item.monthlyRent),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge
          variant={
            item.status === 'AVAILABLE'
              ? 'success'
              : item.status === 'OCCUPIED'
                ? 'info'
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
          <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
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
      await roomsAPI.delete(id);
      toast({ title: 'Success', description: 'Room deleted' });
      loadRooms();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">Manage all rooms across your properties</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add Room
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">House</label>
            <Select
              value={formData.houseId}
              onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
              required
            >
              <option value="">Select house</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <Input
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Floor</label>
              <Input
                type="number"
                min={1}
                value={formData.floorNumber}
                onChange={(e) =>
                  setFormData({ ...formData, floorNumber: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Length (m)</label>
              <Input
                type="number"
                min={0.1}
                step="0.1"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Width (m)</label>
              <Input
                type="number"
                min={0.1}
                step="0.1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <Input
                type="number"
                min={1}
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                value={formData.depositAmount}
                onChange={(e) =>
                  setFormData({ ...formData, depositAmount: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.hasKitchen}
              onChange={(e) => setFormData({ ...formData, hasKitchen: e.target.checked })}
            />
            <span className="text-sm">Has Kitchen</span>
          </label>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving...' : editId ? 'Update Room' : 'Create Room'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
