import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tenantsAPI, roomsAPI, housesAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { toast } from '../../components/ui/toaster';
import { Plus, Pencil } from 'lucide-react';

export function TenantsPage() {
  const location = useLocation();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    occupation: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyAddress: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [assignRoom, setAssignRoom] = useState(false);
  const [houses, setHouses] = useState<any[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [vacantRooms, setVacantRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoomRent, setSelectedRoomRent] = useState(0);
  const [contractImage, setContractImage] = useState<File | null>(null);
  const [contractFields, setContractFields] = useState({
    startDate: '',
    paymentDay: '1',
    deposit: '',
  });

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      nationalId: '',
      occupation: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyAddress: '',
      address: '',
    });
    setAssignRoom(false);
    setSelectedHouseId('');
    setSelectedRoomId('');
    setSelectedRoomRent(0);
    setContractImage(null);
    setContractFields({ startDate: '', paymentDay: '1', deposit: '' });
    setShowModal(true);
  };

  const openEditModal = (tenant: any) => {
    setEditId(tenant.id);
    setFormData({
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email || '',
      nationalId: tenant.nationalId,
      occupation: tenant.occupation || '',
      emergencyName: tenant.emergencyName || '',
      emergencyPhone: tenant.emergencyPhone || '',
      emergencyAddress: tenant.emergencyAddress || '',
      address: tenant.address || '',
    });
    setShowModal(true);
  };

  useEffect(() => {
    loadTenants();
  }, [page, search]);

  useEffect(() => {
    if (showModal && !editId) {
      loadHouses();
    }
  }, [showModal, editId]);

  useEffect(() => {
    if (selectedHouseId) {
      loadVacantRooms(selectedHouseId);
    } else {
      setVacantRooms([]);
    }
  }, [selectedHouseId]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const response = await tenantsAPI.getAll({ page, limit: 10, search });
      setTenants(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tenantId = (location.state as any)?.tenantId;
    if (tenantId && tenants.length > 0) {
      const tenant = tenants.find((t: any) => t.id === tenantId);
      if (tenant) {
        openEditModal(tenant);
      }
    }
  }, [tenants, location.state]);

  useEffect(() => {
    const tenantId = (location.state as any)?.tenantId;
    if (tenantId) {
      tenantsAPI
        .getById(tenantId)
        .then((res) => {
          const tenant = res.data.data;
          if (tenant) {
            setTenants((prev) => {
              if (!prev.find((t) => t.id === tenant.id)) {
                return [tenant, ...prev];
              }
              return prev;
            });
            openEditModal(tenant);
          }
        })
        .catch(() => {});
    }
  }, []);

  const loadHouses = async () => {
    try {
      const response = await housesAPI.getAll({ limit: 100 });
      setHouses(response.data.data || []);
    } catch (error) {
      console.error('Failed to load houses:', error);
    }
  };

  const loadVacantRooms = async (houseId: string) => {
    try {
      const response = await roomsAPI.getVacant(houseId);
      setVacantRooms(response.data.data || []);
    } catch (error) {
      console.error('Failed to load vacant rooms:', error);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = vacantRooms.find((r: any) => r.id === roomId);
    setSelectedRoomRent(room?.monthlyRent || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (formData.emergencyName && formData.emergencyName === formData.fullName) ||
      (formData.emergencyPhone && formData.emergencyPhone === formData.phone)
    ) {
      toast({
        title: 'Validation Error',
        description: 'Emergency contact name and phone must be different from tenant information',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await tenantsAPI.update(editId, formData);
        toast({ title: 'Success', description: 'Tenant updated successfully' });
      } else {
        let payload;
        if (assignRoom && selectedRoomId) {
          const fd = new FormData();
          Object.entries(formData).forEach(([key, value]) => {
            if (value) fd.append(key, value);
          });
          fd.append('roomId', selectedRoomId);
          fd.append('startDate', contractFields.startDate);

          fd.append('paymentDay', contractFields.paymentDay);
          if (contractFields.deposit) fd.append('deposit', contractFields.deposit);
          if (contractImage) fd.append('contractImage', contractImage);
          payload = fd;
        } else {
          payload = formData;
        }
        await tenantsAPI.create(payload);
        toast({ title: 'Success', description: 'Tenant created successfully' });
      }
      setShowModal(false);
      loadTenants();
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
    { key: 'fullName', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'nationalId', header: 'National ID' },
    {
      key: 'room',
      header: 'Room',
      render: (item: any) => item.room?.roomNumber || 'N/A',
    },
    { key: 'occupation', header: 'Occupation' },
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
      await tenantsAPI.delete(id);
      toast({ title: 'Success', description: 'Tenant deleted' });
      loadTenants();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">Manage tenant information</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add Tenant
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search tenants..."
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Edit Tenant' : 'Add New Tenant'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: formatted });
                }}
                maxLength={10}
                placeholder="10 digits only"
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">National ID *</label>
              <Input
                value={formData.nationalId}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setFormData({ ...formData, nationalId: formatted });
                }}
                placeholder="Digits only"
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Occupation</label>
            <Input
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-semibold mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={formData.emergencyPhone}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, emergencyPhone: formatted });
                  }}
                  maxLength={10}
                  placeholder="10 digits only"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input
                  value={formData.emergencyAddress}
                  onChange={(e) => setFormData({ ...formData, emergencyAddress: e.target.value })}
                />
              </div>
            </div>
          </div>

          {!editId && (
            <>
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={assignRoom}
                    onChange={(e) => setAssignRoom(e.target.checked)}
                  />
                  Assign a room and create contract
                </label>
              </div>

              {assignRoom && (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm">Room & Contract Details</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">House</label>
                    <Select
                      value={selectedHouseId}
                      onChange={(e) => {
                        setSelectedHouseId(e.target.value);
                        setSelectedRoomId('');
                        setSelectedRoomRent(0);
                      }}
                    >
                      <option value="">Select a house</option>
                      {houses.map((h: any) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vacant Room</label>
                    <Select
                      value={selectedRoomId}
                      onChange={(e) => handleRoomSelect(e.target.value)}
                      disabled={!selectedHouseId}
                    >
                      <option value="">Select a room</option>
                      {vacantRooms.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.roomNumber} - Br {r.monthlyRent}/mo ({r.length}m × {r.width}m)
                        </option>
                      ))}
                    </Select>
                  </div>
                  {selectedRoomRent > 0 && (
                    <div className="text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2 text-blue-700">
                      Monthly Rent: <strong>Br {selectedRoomRent.toLocaleString()}</strong>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Contract Start *</label>
                      <Input
                        type="date"
                        value={contractFields.startDate}
                        onChange={(e) =>
                          setContractFields({ ...contractFields, startDate: e.target.value })
                        }
                        required={assignRoom}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Day (1-31)</label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={contractFields.paymentDay}
                        onChange={(e) =>
                          setContractFields({ ...contractFields, paymentDay: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Deposit</label>
                      <Input
                        type="number"
                        min={0}
                        value={contractFields.deposit}
                        onChange={(e) =>
                          setContractFields({ ...contractFields, deposit: e.target.value })
                        }
                        placeholder="Same as room default"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contract Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setContractImage(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving...' : editId ? 'Update Tenant' : 'Create Tenant'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
