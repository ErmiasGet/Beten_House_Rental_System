import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { getFirebaseAuth } from '../config/firebase';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { IJwtPayload, IAuthResponse, UserRole } from '@beten-homes-rent/shared';

export class AuthService {
  async register(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
  }): Promise<IAuthResponse> {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role || UserRole.OWNER,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<IAuthResponse> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as IJwtPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
      });

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role as UserRole,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; phone?: string; profileImage?: string }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changeEmail(userId: string, currentPassword: string, newEmail: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('Email is already in use');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await getFirebaseAuth().generatePasswordResetLink(email, {
        url: 'https://betenhomesrent.com/reset-password',
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new NotFoundError('No account found with this email');
      }
      throw error;
    }
  }

  async sendEmailVerification(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    try {
      const firebaseUser = await getFirebaseAuth().getUserByEmail(user.email);
      if (firebaseUser && !firebaseUser.emailVerified) {
        const customToken = await getFirebaseAuth().createCustomToken(firebaseUser.uid);
        await getFirebaseAuth().generateEmailVerificationLink(user.email);
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return;
      }
      throw error;
    }
  }

  async syncFirebaseUser(firebaseUid: string, email: string): Promise<IAuthResponse> {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: email.split('@')[0],
          phone: '',
          password: await bcrypt.hash(Math.random().toString(36).slice(-12), 12),
          role: UserRole.OWNER,
        },
      });
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    try {
      const firebaseUser = await getFirebaseAuth().getUserByEmail(user.email);
      if (firebaseUser) {
        await getFirebaseAuth().deleteUser(firebaseUser.uid);
      }
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    await prisma.user.delete({ where: { id: userId } });
  }

  private generateTokens(payload: IJwtPayload): { token: string; refreshToken: string } {
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { token, refreshToken };
  }
}
