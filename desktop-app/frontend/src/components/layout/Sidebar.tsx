import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  CreditCard,
  Wallet,
  BarChart3,
  Bell,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Houses', href: '/houses', icon: Building2 },
  { name: 'Rooms', href: '/rooms', icon: DoorOpen },
  { name: 'Tenants(ተከራይ)', href: '/tenants', icon: Users },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-hover">
          <div className="flex items-center gap-2">
            <img src="./logo.svg" alt="Smart ቤት ኪራይ" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-white">Smart ቤት ኪራይ</h1>
              <p className="text-xs text-sidebar-muted">Smart Rental System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-hover p-4">
          <button
            onClick={() => {
              navigate('/profile');
              onClose();
            }}
            className="flex items-center gap-3 mb-3 w-full text-left hover:bg-sidebar-hover rounded-lg p-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-sidebar-muted truncate capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </button>
          <button onClick={handleLogout} className="sidebar-item sidebar-item-inactive w-full">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
