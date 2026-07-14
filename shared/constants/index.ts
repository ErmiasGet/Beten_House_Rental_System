export const APP_NAME = 'Smart ቤት ኪራይ';
export const APP_VERSION = '1.0.0';
export const API_PREFIX = '/api/v1';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const RENTAL = {
  MIN_DEPOSIT_MONTHS: 1,
  MAX_DEPOSIT_MONTHS: 3,
  DEFAULT_PAYMENT_DAY: 1,
  GRACE_PERIOD_DAYS: 5,
  OVERDUE_DAYS: 30,
};

export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTER_SUCCESS: 'Registration successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'You do not have permission to perform this action',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    USER_EXISTS: 'User with this email already exists',
    USER_NOT_FOUND: 'User not found',
    PASSWORD_RESET_SENT: 'Password reset link sent to your email',
    PASSWORD_RESET_SUCCESS: 'Password reset successful',
  },
  HOUSE: {
    CREATED: 'House created successfully',
    UPDATED: 'House updated successfully',
    DELETED: 'House deleted successfully',
    NOT_FOUND: 'House not found',
  },
  ROOM: {
    CREATED: 'Room created successfully',
    UPDATED: 'Room updated successfully',
    DELETED: 'Room deleted successfully',
    NOT_FOUND: 'Room not found',
  },
  TENANT: {
    CREATED: 'Tenant created successfully',
    UPDATED: 'Tenant updated successfully',
    DELETED: 'Tenant deleted successfully',
    NOT_FOUND: 'Tenant not found',
  },
  CONTRACT: {
    CREATED: 'Contract created successfully',
    UPDATED: 'Contract updated successfully',
    TERMINATED: 'Contract terminated successfully',
    NOT_FOUND: 'Contract not found',
  },
  PAYMENT: {
    RECORDED: 'Payment recorded successfully',
    UPDATED: 'Payment updated successfully',
    DELETED: 'Payment deleted successfully',
    NOT_FOUND: 'Payment not found',
    RECEIPT_GENERATED: 'Receipt generated successfully',
    PARTIAL_APPLIED: 'Partial payment applied successfully',
    NO_OVERDUE: 'No overdue payments found for this tenant',
    AMOUNT_EXCEEDS: 'Payment amount exceeds total outstanding balance',
  },
  EXPENSE: {
    CREATED: 'Expense recorded successfully',
    UPDATED: 'Expense updated successfully',
    DELETED: 'Expense deleted successfully',
    NOT_FOUND: 'Expense not found',
  },
  NOTIFICATION: {
    MARKED_READ: 'Notification marked as read',
    ALL_READ: 'All notifications marked as read',
  },
};

export const CURRENCY = {
  ETHIOPIAN_BIRR: {
    code: 'ETB',
    symbol: 'Br',
    name: 'Ethiopian Birr',
  },
  US_DOLLAR: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  },
};

export const DEFAULT_CURRENCY = CURRENCY.ETHIOPIAN_BIRR;

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CHECK: 'Check',
};

export const EXPENSE_CATEGORY_LABELS = {
  MAINTENANCE: 'Maintenance',
  REPAIR: 'Repair',
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  CLEANING: 'Cleaning',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export const ROOM_STATUS_LABELS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Under Maintenance',
};

export const CONTRACT_STATUS_LABELS = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
  PENDING: 'Pending',
};

export const NOTIFICATION_TYPES = {
  PAYMENT_DUE: {
    title: 'Payment Due Today',
    icon: 'bell',
    color: '#F59E0B',
  },
  PAYMENT_OVERDUE: {
    title: 'Payment Overdue',
    icon: 'alert-circle',
    color: '#EF4444',
  },
  CONTRACT_EXPIRING: {
    title: 'Contract Expiring Soon',
    icon: 'clock',
    color: '#3B82F6',
  },
  CONTRACT_EXPIRED: {
    title: 'Contract Expired',
    icon: 'x-circle',
    color: '#6B7280',
  },
  ROOM_VACANT: {
    title: 'Room Vacant',
    icon: 'home',
    color: '#10B981',
  },
  MAINTENANCE_DUE: {
    title: 'Maintenance Due',
    icon: 'tool',
    color: '#F59E0B',
  },
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    icon: 'check-circle',
    color: '#10B981',
  },
};

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Houses', path: '/houses', icon: 'Building2' },
  { label: 'Rooms', path: '/rooms', icon: 'DoorOpen' },
  { label: 'Tenants', path: '/tenants', icon: 'Users' },
  { label: 'Contracts', path: '/contracts', icon: 'FileText' },
  { label: 'Payments', path: '/payments', icon: 'CreditCard' },
  { label: 'Expenses', path: '/expenses', icon: 'Wallet' },
  { label: 'Reports', path: '/reports', icon: 'BarChart3' },
  { label: 'Notifications', path: '/notifications', icon: 'Bell' },
];

export const MOBILE_NAV_ITEMS = [
  { label: 'Home', icon: 'home', screen: 'Dashboard' },
  { label: 'Tenants', icon: 'people', screen: 'Tenants' },
  { label: 'Payments', icon: 'card', screen: 'Payments' },
  { label: 'Reports', icon: 'stats-chart', screen: 'Reports' },
  { label: 'Profile', icon: 'person', screen: 'Profile' },
];
