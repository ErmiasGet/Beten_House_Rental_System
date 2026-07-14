export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  PENDING = 'PENDING',
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHECK = 'CHECK',
}

export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  CLEANING = 'CLEANING',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

export enum NotificationType {
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  CONTRACT_EXPIRING = 'CONTRACT_EXPIRING',
  CONTRACT_EXPIRED = 'CONTRACT_EXPIRED',
  ROOM_VACANT = 'ROOM_VACANT',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHouse {
  id: string;
  name: string;
  address: string;
  description?: string;
  numberOfFloors: number;
  totalRooms: number;
  images: string[];
  registrationDate: Date;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  id: string;
  roomNumber: string;
  floorNumber: number;
  length: number;
  width: number;
  bedrooms: number;
  bathrooms: number;
  hasKitchen: boolean;
  monthlyRent: number;
  depositAmount: number;
  status: RoomStatus;
  houseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenant {
  id: string;
  fullName: string;
  profileImage?: string;
  phone: string;
  email?: string;
  nationalId: string;
  occupation?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyAddress?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRentalContract {
  id: string;
  tenantId: string;
  houseId: string;
  roomId: string;
  startDate: Date;
  monthlyRent: number;
  deposit: number;
  paymentDay: number;
  contractImage?: string;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  tenantId: string;
  roomId: string;
  contractId: string;
  amount: number;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  month: number;
  year: number;
  status: PaymentStatus;
  receiptNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenantBalance {
  tenantId: string;
  tenantName: string;
  totalOwed: number;
  totalPaid: number;
  outstandingBalance: number;
  records: {
    id: string;
    month: number;
    year: number;
    amount: number;
    amountPaid: number;
    remaining: number;
    status: PaymentStatus;
  }[];
}

export interface IPayOverdueRequest {
  tenantId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
}

export interface IExpense {
  id: string;
  houseId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: Date;
  receiptImage?: string;
  recordedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  createdAt: Date;
}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
  refreshToken: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IDashboardStats {
  totalHouses: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  monthlyIncome: number;
  pendingPayments: number;
  overduePayments: number;
  recentActivities: IRecentActivity[];
}

export interface IRecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  type: 'payment' | 'tenant' | 'contract' | 'expense';
}

export interface IReportFilter {
  startDate: Date;
  endDate: Date;
  houseId?: string;
  type?: string;
}

export interface IIncomeReport {
  totalIncome: number;
  payments: IPayment[];
  monthlyBreakdown: { month: number; year: number; amount: number }[];
}

export interface IExpenseReport {
  totalExpenses: number;
  expenses: IExpense[];
  categoryBreakdown: { category: ExpenseCategory; amount: number; count: number }[];
}

export interface IOccupancyReport {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  houseBreakdown: { houseId: string; houseName: string; occupied: number; total: number }[];
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  token: string;
  password: string;
}
