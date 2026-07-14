import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { housesAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Building2, MapPin, Layers, DoorOpen } from 'lucide-react';
import { formatCurrency } from '@beten-homes-rent/shared';

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [house, setHouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadHouse();
  }, [id]);

  const loadHouse = async () => {
    try {
      const response = await housesAPI.getById(id!);
      setHouse(response.data.data);
    } catch (error) {
      console.error('Failed to load house:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!house) return <div className="p-6">House not found</div>;

  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => navigate('/houses')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Houses
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {house.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                {house.address}
              </div>
              {house.description && <p className="text-gray-600">{house.description}</p>}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Layers className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-sm text-gray-500">Floors</p>
                  <p className="text-lg font-bold">{house.numberOfFloors}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <DoorOpen className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-sm text-gray-500">Total Rooms</p>
                  <p className="text-lg font-bold">{house.totalRooms}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <DoorOpen className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                  <p className="text-sm text-gray-500">Rooms</p>
                  <p className="text-lg font-bold">{house.rooms?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {house.rooms?.map((room: any) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">Room {room.roomNumber}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(room.monthlyRent)}/month
                    </p>
                  </div>
                  <Badge
                    variant={
                      room.status === 'AVAILABLE'
                        ? 'success'
                        : room.status === 'OCCUPIED'
                          ? 'info'
                          : 'warning'
                    }
                  >
                    {room.status}
                  </Badge>
                </div>
              ))}
              {(!house.rooms || house.rooms.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No rooms added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
