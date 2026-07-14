import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { housesAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/toaster';
import { Plus, Pencil } from 'lucide-react';

export function HousesPage() {
  const navigate = useNavigate();
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    numberOfFloors: 1,
    totalRooms: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHouses();
  }, [page]);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({ name: '', address: '', description: '', numberOfFloors: 1, totalRooms: 0 });
    setShowModal(true);
  };

  const openEditModal = (house: any) => {
    setEditId(house.id);
    setFormData({
      name: house.name,
      address: house.address,
      description: house.description || '',
      numberOfFloors: house.numberOfFloors,
      totalRooms: house.totalRooms,
    });
    setShowModal(true);
  };

  const loadHouses = async () => {
    try {
      const response = await housesAPI.getAll({ page, limit: 10 });
      setHouses(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await housesAPI.update(editId, formData);
        toast({ title: 'Success', description: 'House updated successfully' });
      } else {
        await housesAPI.create(formData);
        toast({ title: 'Success', description: 'House created successfully' });
      }
      setShowModal(false);
      setFormData({ name: '', address: '', description: '', numberOfFloors: 1, totalRooms: 0 });
      loadHouses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this house?')) return;
    try {
      await housesAPI.delete(id);
      toast({ title: 'Success', description: 'House deleted successfully' });
      loadHouses();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete house', variant: 'destructive' });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
    {
      key: 'numberOfFloors',
      header: 'Floors',
      render: (item: any) => <Badge variant="secondary">{item.numberOfFloors}</Badge>,
    },
    { key: 'totalRooms', header: 'Total Rooms' },
    {
      key: 'rooms',
      header: 'Occupied',
      render: (item: any) => (
        <span className={item._count?.rentalContracts > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
          {item._count?.rentalContracts || 0}/{item.totalRooms}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/houses/${item.id}`)}>
            View
          </Button>
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Houses</h1>
          <p className="page-subtitle">Manage your properties</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add House
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={houses}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit House' : 'Add New House'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">House Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter house name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Enter full address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number of Floors</label>
              <Input
                type="number"
                min={1}
                value={formData.numberOfFloors}
                onChange={(e) => setFormData({ ...formData, numberOfFloors: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Rooms</label>
              <Input
                type="number"
                min={0}
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving...' : editId ? 'Update House' : 'Create House'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
