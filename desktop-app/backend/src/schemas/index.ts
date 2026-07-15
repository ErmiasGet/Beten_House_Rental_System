import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
    role: z.enum(['OWNER', 'MANAGER', 'ACCOUNTANT']).optional(),
  }),
});

export const houseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'House name is required'),
    address: z.string().min(1, 'Address is required'),
    numberOfFloors: z.number().int().min(1),
    totalRooms: z.number().int().min(0),
  }),
});

export const roomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, 'Room number is required'),
    floorNumber: z.number().int().min(1),
    length: z.number().min(0.1, 'Length must be greater than 0'),
    width: z.number().min(0.1, 'Width must be greater than 0'),
    bedrooms: z.number().int().min(1),
    bathrooms: z.number().int().min(1),
    hasKitchen: z.boolean().optional(),
    monthlyRent: z.number().min(0),
    depositAmount: z.number().min(0).optional(),
    houseId: z.string().uuid('Invalid house ID'),
  }),
});

export const tenantSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
      email: z.string().email().optional().or(z.literal('')),
      gender: z.string().optional(),
      nationalId: z
        .string()
        .regex(/^\d+$/, 'National ID must contain only numbers')
        .length(16, 'National ID must be exactly 16 digits'),
      occupation: z.string().optional(),
      emergencyName: z.string().optional(),
      emergencyPhone: z.string().optional(),
      emergencyAddress: z.string().optional(),
      address: z.string().optional(),
      roomId: z.string().uuid('Invalid room ID').optional(),
      startDate: z.string().optional(),
      paymentDay: z.coerce.number().int().min(1).max(31).optional(),
      deposit: z.coerce.number().min(0).optional(),
    })
    .refine(
      (data) => {
        if (data.emergencyName && data.emergencyName === data.fullName) return false;
        if (data.emergencyPhone && data.emergencyPhone === data.phone) return false;
        return true;
      },
      { message: 'Emergency contact name and phone must be different from tenant information' }
    ),
});

export const contractSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid(),
    houseId: z.string().uuid(),
    roomId: z.string().uuid(),
    startDate: z.string().min(1, 'Start date is required'),
    monthlyRent: z.number().min(0),
    deposit: z.number().min(0).optional(),
    paymentDay: z.number().int().min(1).max(31),
  }),
});

export const paymentSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid(),
    roomId: z.string().uuid(),
    contractId: z.string().uuid(),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    amountPaid: z.number().min(0).optional(),
    paymentDate: z.string().min(1),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK']),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020),
    notes: z.string().optional(),
  }),
});

export const paymentUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['PAID', 'UNPAID', 'OVERDUE', 'PARTIAL']).optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK']).optional(),
    amount: z.number().min(1, 'Amount must be greater than 0').optional(),
    amountPaid: z.number().min(0).optional(),
    paymentDate: z.string().min(1).optional(),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2020).optional(),
    notes: z.string().optional(),
  }),
});

export const payOverdueSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid(),
    amount: z.number().min(1, 'Payment amount must be greater than 0'),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK']),
    paymentDate: z.string().min(1, 'Payment date is required'),
    notes: z.string().optional(),
  }),
});

export const expenseSchema = z.object({
  body: z.object({
    houseId: z.string().uuid(),
    category: z.enum([
      'MAINTENANCE',
      'REPAIR',
      'ELECTRICITY',
      'WATER',
      'CLEANING',
      'SECURITY',
      'OTHER',
    ]),
    amount: z.number().min(1),
    description: z.string().min(1),
    expenseDate: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone must be exactly 10 digits')
      .optional(),
  }),
});

export const changeEmailSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newEmail: z.string().email('Invalid email address'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});
