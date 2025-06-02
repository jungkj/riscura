import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isValid: boolean;
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
};

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required');
  }

  // Validate password strength before hashing
  const strength = checkPasswordStrength(password);
  if (!strength.isValid) {
    throw new Error(`Password does not meet requirements: ${strength.feedback.join(', ')}`);
  }

  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check password strength and requirements
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isValid: false,
    };
  }

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    feedback.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else if (password.length >= 12) {
    score += 1; // Bonus for longer passwords
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    feedback.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Character requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (PASSWORD_REQUIREMENTS.requireUppercase && !hasUppercase) {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !hasLowercase) {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !hasNumbers) {
    feedback.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !hasSpecialChars) {
    feedback.push('Password must contain at least one special character');
  }

  // Calculate strength score
  const characterTypes = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  score += characterTypes;

  // Additional strength checks
  if (password.length >= 8 && characterTypes >= 3) {
    score += 1;
  }

  // Penalty for common patterns
  if (hasCommonPatterns(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid common patterns or dictionary words');
  }

  // Penalty for repeated characters
  if (hasRepeatedCharacters(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters or sequences');
  }

  const isValid = feedback.length === 0 && score >= PASSWORD_REQUIREMENTS.minScore;

  return {
    score: Math.min(4, score),
    feedback,
    isValid,
  };
}

/**
 * Check for common patterns in password
 */
function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    'password',
    '123456',
    'qwerty',
    'admin',
    'login',
    'welcome',
    'letmein',
    'monkey',
    'dragon',
    'sunshine',
  ];

  const lowerPassword = password.toLowerCase();
  return commonPatterns.some(pattern => lowerPassword.includes(pattern));
}

/**
 * Check for repeated characters or sequences
 */
function hasRepeatedCharacters(password: string): boolean {
  // Check for 3 or more repeated characters
  if (/(.)\1{2,}/.test(password)) {
    return true;
  }

  // Check for sequential characters (e.g., "123", "abc")
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i);
    const char2 = password.charCodeAt(i + 1);
    const char3 = password.charCodeAt(i + 2);

    if (char2 === char1 + 1 && char3 === char2 + 1) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let password = '';
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one character from each required category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised (placeholder for future HIBP integration)
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  // This is a placeholder for Have I Been Pwned integration
  // In production, you would check against compromised password databases
  
  // For now, just check against a basic list of common passwords
  const commonPasswords = [
    'password',
    '123456',
    'password123',
    'admin',
    'qwerty',
    'letmein',
    'welcome',
    '123456789',
    'password1',
  ];

  return commonPasswords.includes(password.toLowerCase());
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
    default:
      return 'gray';
  }
} 