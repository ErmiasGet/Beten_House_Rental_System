export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };
  return d.toLocaleDateString('en-US', formats[format]);
}

export function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month - 1] || '';
}

export function getMonthOptions(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));
}

export function getYearOptions(startYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const start = startYear || currentYear - 5;
  return Array.from({ length: currentYear - start + 1 }, (_, i) => start + i);
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: Date): boolean {
  const today = new Date();
  const due = new Date(dueDate);
  return (
    today.getFullYear() > due.getFullYear() ||
    (today.getFullYear() === due.getFullYear() && today.getMonth() > due.getMonth()) ||
    (today.getFullYear() === due.getFullYear() &&
      today.getMonth() === due.getMonth() &&
      today.getDate() > due.getDate())
  );
}

export function daysUntil(date: Date): number {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateReceiptNumber(): string {
  const prefix = 'RCT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: '#10B981',
    OCCUPIED: '#3B82F6',
    MAINTENANCE: '#F59E0B',
    ACTIVE: '#10B981',
    EXPIRED: '#EF4444',
    TERMINATED: '#6B7280',
    PENDING: '#F59E0B',
    PAID: '#10B981',
    UNPAID: '#EF4444',
    OVERDUE: '#DC2626',
    PARTIAL: '#F59E0B',
  };
  return colors[status] || '#6B7280';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: '#D1FAE5',
    OCCUPIED: '#DBEAFE',
    MAINTENANCE: '#FEF3C7',
    ACTIVE: '#D1FAE5',
    EXPIRED: '#FEE2E2',
    TERMINATED: '#F3F4F6',
    PENDING: '#FEF3C7',
    PAID: '#D1FAE5',
    UNPAID: '#FEE2E2',
    OVERDUE: '#FEE2E2',
    PARTIAL: '#FEF3C7',
  };
  return colors[status] || '#F3F4F6';
}

export function calculateOccupancyRate(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

export function paginate<T>(
  data: T[],
  page: number,
  limit: number
): { data: T[]; total: number; page: number; limit: number; totalPages: number } {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const result = data.slice(startIndex, endIndex);
  return {
    data: result,
    total: data.length,
    page,
    limit,
    totalPages: Math.ceil(data.length / limit),
  };
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  const re = /^\+?[\d\s-]{10,15}$/;
  return re.test(phone);
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}
