import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  role?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

export interface ValidatedRequest<T = any> extends AuthenticatedRequest {
  validatedBody: T;
}