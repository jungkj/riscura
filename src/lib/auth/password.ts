import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  feedback: string[];
}

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minScore: 3, // Minimum acceptable strength score
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = env.BCRYPT_ROUNDS || 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // console.error('Password verification error:', error)
    return false;
  }
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Password should not contain repeated characters')
    score -= 1;
  }

  if (/123|abc|qwe|password/i.test(password)) {
    feedback.push('Password should not contain common patterns');
    score -= 1;
  }

  // Dictionary words (simplified check)
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ]

  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    feedback.push('Password should not contain common words');
    score -= 1;
  }

  const isValid = feedback.length === 0 && score >= 4;

  return {
    isValid,
    score: Math.max(0, Math.min(6, score)),
    feedback,
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  // Ensure at least one character from each required type
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  password += getRandomChar(lowercase);
  password += getRandomChar(uppercase);
  password += getRandomChar(numbers);
  password += getRandomChar(special);

  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += getRandomChar(charset);
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Get a random character from a string
 */
const getRandomChar = (chars: string): string {
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

/**
 * Check if password has been compromised (placeholder for HIBP integration)
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  // TODO: Integrate with Have I Been Pwned API
  // For now, just check against a basic list
  const compromisedPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'passw0rd',
    'master',
    '123123',
    'football',
  ]

  return compromisedPasswords.includes(password.toLowerCase());
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${timestamp}:${random}`).toString('base64url');
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string, maxAge: number = 3600000): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [timestamp] = decoded.split(':');
    const tokenAge = Date.now() - parseInt(timestamp);

    return tokenAge <= maxAge;
  } catch (error) {
    return false;
  }
}

/**
 * Get password strength description
 */
export function getPasswordStrengthDescription(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    case 5:
      return 'Very Strong';
    case 6:
      return 'Excellent';
    default:
      return 'Unknown';
  }
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'red';
    case 2:
      return 'orange';
    case 3:
      return 'yellow';
    case 4:
      return 'green';
    case 5:
      return 'blue';
    case 6:
      return 'purple';
    default:
      return 'gray';
  }
}
