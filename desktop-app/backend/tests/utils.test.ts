import {
  formatCurrency,
  formatDate,
  getMonthName,
  getYearOptions,
  calculateAge,
  daysBetween,
  daysUntil,
  isOverdue,
  generateReceiptNumber,
  truncateText,
  capitalizeWords,
  slugify,
  calculateOccupancyRate,
  paginate,
  validateEmail,
  validatePhone,
  maskEmail,
  maskPhone,
} from '@beten-homes-rent/shared';

describe('formatCurrency', () => {
  it('formats with default ETB currency', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('ETB');
    expect(result).toContain('1,500');
  });

  it('formats with specified currency', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('99.99');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0.00');
  });
});

describe('formatDate', () => {
  it('formats Date object in short format', () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date, 'short');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats date string', () => {
    const result = formatDate(new Date(2024, 5, 1), 'long');
    expect(result).toContain('June');
    expect(result).toContain('1');
    expect(result).toContain('2024');
  });

  it('defaults to short format', () => {
    const date = new Date(2024, 5, 15);
    expect(formatDate(date)).toBe(formatDate(date, 'short'));
  });
});

describe('getMonthName', () => {
  it('returns correct month name', () => {
    expect(getMonthName(1)).toBe('January');
    expect(getMonthName(6)).toBe('June');
    expect(getMonthName(12)).toBe('December');
  });

  it('returns empty string for invalid month', () => {
    expect(getMonthName(0)).toBe('');
    expect(getMonthName(13)).toBe('');
  });
});

describe('getYearOptions', () => {
  it('returns years from startYear to current year inclusive', () => {
    const currentYear = new Date().getFullYear();
    const options = getYearOptions(2020);
    expect(options[0]).toBe(2020);
    expect(options[options.length - 1]).toBe(currentYear);
    expect(options).not.toContain(currentYear + 1);
  });

  it('defaults to 5 years back when no startYear given', () => {
    const currentYear = new Date().getFullYear();
    const options = getYearOptions();
    expect(options[0]).toBe(currentYear - 5);
    expect(options.length).toBe(6);
  });
});

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25);
    expect(calculateAge(birthDate)).toBe(25);
  });

  it('handles birthday not yet occurred this year', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25);
    birthDate.setMonth(birthDate.getMonth() + 1);
    if (birthDate > new Date()) {
      birthDate.setFullYear(birthDate.getFullYear() - 1);
    }
    const age = calculateAge(birthDate);
    expect(age).toBeGreaterThanOrEqual(23);
    expect(age).toBeLessThanOrEqual(25);
  });
});

describe('daysBetween', () => {
  it('returns absolute difference in days', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-10');
    expect(daysBetween(d1, d2)).toBe(9);
  });

  it('always returns positive number', () => {
    const d1 = new Date('2024-01-10');
    const d2 = new Date('2024-01-01');
    expect(daysBetween(d1, d2)).toBe(9);
  });

  it('returns 0 for same day', () => {
    const d = new Date('2024-06-15');
    expect(daysBetween(d, d)).toBe(0);
  });
});

describe('daysUntil', () => {
  it('returns positive for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntil(future)).toBeGreaterThanOrEqual(4);
    expect(daysUntil(future)).toBeLessThanOrEqual(5);
  });

  it('returns negative for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(daysUntil(past)).toBeLessThan(0);
  });

  it('returns ~0 for today', () => {
    const today = new Date();
    const result = daysUntil(today);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('isOverdue', () => {
  it('returns false for future due date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(isOverdue(future)).toBe(false);
  });

  it('returns false for today (not overdue until tomorrow)', () => {
    const today = new Date();
    expect(isOverdue(today)).toBe(false);
  });

  it('returns true for past due date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(isOverdue(past)).toBe(true);
  });
});

describe('generateReceiptNumber', () => {
  it('starts with RCT prefix', () => {
    expect(generateReceiptNumber()).toMatch(/^RCT-/);
  });

  it('generates unique values', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateReceiptNumber()));
    expect(set.size).toBe(100);
  });
});

describe('truncateText', () => {
  it('returns original text if within maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ... when exceeding maxLength', () => {
    const result = truncateText('Hello World Long Text', 10);
    expect(result).toBe('Hello Worl...');
    expect(result.length).toBe(13);
  });
});

describe('capitalizeWords', () => {
  it('capitalizes first letter of each word', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(capitalizeWords('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalizeWords('')).toBe('');
  });
});

describe('slugify', () => {
  it('converts text to URL-friendly slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });

  it('handles multiple spaces and dashes', () => {
    expect(slugify('  Hello   World  ')).toBe('hello-world');
  });
});

describe('calculateOccupancyRate', () => {
  it('calculates percentage correctly', () => {
    expect(calculateOccupancyRate(3, 10)).toBe(30);
  });

  it('returns 0 for empty total', () => {
    expect(calculateOccupancyRate(0, 0)).toBe(0);
  });

  it('returns 100 for full occupancy', () => {
    expect(calculateOccupancyRate(10, 10)).toBe(100);
  });
});

describe('paginate', () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns correct page', () => {
    const result = paginate(data, 1, 3);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.totalPages).toBe(4);
  });

  it('returns last page with remaining items', () => {
    const result = paginate(data, 4, 3);
    expect(result.data).toEqual([10]);
  });

  it('returns correct metadata', () => {
    const result = paginate(data, 2, 5);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.total).toBe(10);
  });
});

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('accepts valid phone number', () => {
    expect(validatePhone('+251911234567')).toBe(true);
  });

  it('rejects too short number', () => {
    expect(validatePhone('123')).toBe(false);
  });
});

describe('maskEmail', () => {
  it('masks middle characters of email name', () => {
    const result = maskEmail('john.doe@example.com');
    expect(result).toBe('j******e@example.com');
    expect(result).not.toContain('john.doe');
  });
});

describe('maskPhone', () => {
  it('masks middle digits of phone', () => {
    const result = maskPhone('+251911234567');
    expect(result).toContain('****');
    expect(result).toBe('+25****567');
  });

  it('returns original if too short', () => {
    expect(maskPhone('123')).toBe('123');
  });
});
