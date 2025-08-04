import { User, UserRole } from '@prisma/client';

export interface CreateUserOptions {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserFactory {
  private static counter = 1;

  static create(_options: CreateUserOptions = {}): User {
    const id = options.id || `user-${this.counter++}`;

    return {
      id,
      email: options.email || `user${this.counter}@example.com`,
      firstName: options.firstName || 'Test',
      lastName: options.lastName || 'User',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewarnFwk4TCjdHBK', // "password123"
      avatar: null,
      phoneNumber: null,
      role: options.role || UserRole.USER,
      permissions: [],
      organizationId: options.organizationId || 'org-1',
      isActive: options.isActive ?? true,
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLogin: options.lastLogin || new Date(),
      createdAt: options.createdAt || new Date(),
      updatedAt: options.updatedAt || new Date(),
    } as User;
  }

  static createAdmin(_options: CreateUserOptions = {}): User {
    return this.create({
      ...options,
      role: UserRole.ADMIN,
      email: options.email || `admin${this.counter}@example.com`,
    });
  }

  static createRiskManager(_options: CreateUserOptions = {}): User {
    return this.create({
      ...options,
      role: UserRole.RISK_MANAGER,
      email: options.email || `riskmanager${this.counter}@example.com`,
    });
  }

  static createAuditor(_options: CreateUserOptions = {}): User {
    return this.create({
      ...options,
      role: UserRole.AUDITOR,
      email: options.email || `auditor${this.counter}@example.com`,
    });
  }

  static createBatch(_count: number, options: CreateUserOptions = {}): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...options,
        email: options.email || `user${this.counter + index}@example.com`,
      })
    );
  }

  static createForOrganization(_organizationId: string, count: number = 1): User[] {
    return this.createBatch(count, { organizationId });
  }

  static reset(): void {
    this.counter = 1;
  }
}

// Export commonly used test users
export const testUsers = {
  admin: UserFactory.createAdmin({
    id: 'admin-1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
  }),

  user: UserFactory.create({
    id: 'user-1',
    email: 'user@test.com',
    firstName: 'Regular',
    lastName: 'User',
  }),

  riskManager: UserFactory.createRiskManager({
    id: 'risk-manager-1',
    email: 'riskmanager@test.com',
    firstName: 'Risk',
    lastName: 'Manager',
  }),

  auditor: UserFactory.createAuditor({
    id: 'auditor-1',
    email: 'auditor@test.com',
    firstName: 'Auditor',
    lastName: 'User',
  }),
}
