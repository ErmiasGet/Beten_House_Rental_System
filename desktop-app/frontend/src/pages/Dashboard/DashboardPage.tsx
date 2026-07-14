import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import {
  Building2,
  DoorOpen,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatCurrency } from '@beten-homes-rent/shared';

interface DashboardStats {
  totalHouses: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  monthlyIncome: number;
  pendingPayments: number;
  overduePayments: number;
  recentActivities: any[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalHouses: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    monthlyIncome: 0,
    pendingPayments: 0,
    overduePayments: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Houses',
      value: stats.totalHouses,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: DoorOpen,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Occupied Rooms',
      value: stats.occupiedRooms,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Vacant Rooms',
      value: stats.vacantRooms,
      icon: DoorOpen,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(stats.monthlyIncome),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Overdue Payments',
      value: stats.overduePayments,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your property portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.title} className="dashboard-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="dashboard-stat-label">{card.title}</p>
                <p className="dashboard-stat-value">
                  {loading ? (
                    <span className="animate-pulse bg-gray-200 rounded">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div className={`dashboard-stat-icon ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'
                      }`}
                    >
                      {activity.type === 'payment' ? (
                        <DollarSign
                          className={`h-4 w-4 ${activity.type === 'payment' ? 'text-green-600' : 'text-blue-600'}`}
                        />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add House', href: '/houses' },
                { label: 'Add Room', href: '/rooms' },
                { label: 'Add Tenant', href: '/tenants' },
                { label: 'Record Payment', href: '/payments' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-center"
                >
                  <p className="text-sm font-medium text-gray-700">{action.label}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
