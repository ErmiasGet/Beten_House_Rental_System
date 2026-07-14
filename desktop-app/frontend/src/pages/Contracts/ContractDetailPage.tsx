import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  FileText,
  User,
  Building2,
  DoorOpen,
  Calendar,
  DollarSign,
  Image,
} from 'lucide-react';
import { formatCurrency } from '@beten-homes-rent/shared';

const API_BASE = '/api/v1';

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      const response = await contractsAPI.getById(id!);
      setContract(response.data.data);
    } catch (error) {
      console.error('Failed to load contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE.replace('/api/v1', '')}/${path}`;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!contract) return <div className="p-6">Contract not found</div>;

  const statusVariant =
    contract.status === 'ACTIVE'
      ? 'success'
      : contract.status === 'EXPIRED'
        ? 'destructive'
        : contract.status === 'TERMINATED'
          ? 'destructive'
          : 'warning';

  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => navigate('/contracts')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contracts
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Contract Details
                </span>
                <Badge variant={statusVariant}>{contract.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Tenant</p>
                    <p className="text-sm font-medium">{contract.tenant?.fullName}</p>
                    <p className="text-xs text-gray-400">{contract.tenant?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Property</p>
                    <p className="text-sm font-medium">{contract.house?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DoorOpen className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Room</p>
                    <p className="text-sm font-medium">Room {contract.room?.roomNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium">
                      {new Date(contract.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-500">Monthly Rent</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(contract.monthlyRent)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-gray-500">Deposit</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(contract.deposit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-gray-500">Payment Day</p>
                  <p className="text-lg font-bold text-purple-600">{contract.paymentDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {contract.payments && contract.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {payment.month}/{payment.year}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                        <Badge
                          variant={
                            payment.status === 'PAID'
                              ? 'success'
                              : payment.status === 'OVERDUE'
                                ? 'destructive'
                                : 'warning'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Contract Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.contractImage ? (
                <div className="space-y-3">
                  <img
                    src={getImageUrl(contract.contractImage) || undefined}
                    alt="Contract"
                    className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const url = getImageUrl(contract.contractImage);
                      if (url) window.open(url, '_blank');
                    }}
                  />
                  <p className="text-xs text-gray-400 text-center">Click to view full size</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Image className="h-12 w-12 mb-3" />
                  <p className="text-sm">No contract photo uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
