import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../components/ui/toaster';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { formatDate } from '@beten-homes-rent/shared';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      toast({ title: 'All marked as read' });
      loadNotifications();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      loadNotifications();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      try {
        await notificationsAPI.markAsRead(n.id);
      } catch {}
    }
    if (n.relatedId) {
      navigate('/tenants', { state: { tenantId: n.relatedId } });
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PAYMENT_DUE: 'bg-yellow-100 text-yellow-800',
      PAYMENT_OVERDUE: 'bg-red-100 text-red-800',
      PAYMENT_RECEIVED: 'bg-green-100 text-green-800',
      CONTRACT_EXPIRING: 'bg-blue-100 text-blue-800',
      CONTRACT_EXPIRED: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated with property alerts</p>
        </div>
        <Button variant="outline" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 cursor-pointer ${!n.isRead ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`p-2 rounded-full ${getTypeColor(n.type)}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt, 'full')}</p>
                  </div>
                  <div className="flex gap-1">
                    {!n.isRead && (
                      <Button variant="ghost" size="icon" onClick={() => markAsRead(n.id)}>
                        <CheckCheck className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
