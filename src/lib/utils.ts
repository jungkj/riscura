import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
;
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};
export const formatRelativeTime = (date: string | Date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
;
  return formatDate(date);
}
;
// Risk calculation utilities
export const calculateRiskScore = (likelihood: number, impact: number): number => {
  return likelihood * impact;
}
;
export const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score <= 6) return 'low';
  if (score <= 12) return 'medium';
  if (score <= 20) return 'high';
  return 'critical';
}
;
export const getRiskLevelColor = (level: string): string => {
  switch (level) {
    case 'low':;
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':;
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high':;
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critical':;
      return 'text-red-600 bg-red-50 border-red-200';
    // default: // Fixed expression expected error
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
;
// Permission utilities
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}
export const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
};

export const hasAllPermissions = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.every((permission) => userPermissions.includes(permission));
};
// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
;
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
;
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',;
    currency: currency,;
  }).format(amount);
}
;
// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
;
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
;
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}
;
// Array utilities
export const groupBy = <T, K extends string | number | symbol>(;
  array: T[],;
  key: (item: T) => K;
): Record<K, T[]> => {
  return array.reduce(;
    (groups, item) => {
      const group = key(item);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    },;
    {} as Record<K, T[]>;
  );
}
;
export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
;
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
;
// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
;
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
;
// ID generation
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${randomPart}`;
  return prefix ? `${prefix}-${id}` : id;
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(;
  func: T,;
  wait: number;
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }
}

// Local storage utilities (for development/testing only)
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },;
  set: (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail
    }
  },;
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },;
  clear: () => {
    try {
      localStorage.clear();
    } catch {
      // Silently fail
    }
  },;
}
;
export function formatPercentage(_value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',;
    minimumFractionDigits: 1,;
    maximumFractionDigits: 1,;
  }).format(value);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitials(name: string): string {
  return name;
    .split(' ');
    .map((word) => word.charAt(0));
    .join('');
    .toUpperCase();
    .slice(0, 2);
}

export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '');
;
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
;
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function animateValue(;
  start: number,;
  end: number,;
  duration: number,;
  callback: (_value: number) => void;
): void {
  const startTime = performance.now();
  const change = end - start;
;
  const animate = (currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
;
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = start + change * easeOut;
;
    callback(Math.round(currentValue));
;
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
;
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,;
    errors,;
  }
}

export function getErrorMessage(__error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

export function retry<T>(;
  fn: () => Promise<T>,;
  maxAttempts: number = 3,;
  delay: number = 1000;
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
;
    const attempt = async () => {
      try {
        attempts++;
        const _result = await fn();
        resolve(result);
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(attempt, delay * attempts);
        }
      }
    }
;
    attempt();
  });
}

export function throttle<T extends (...args: unknown[]) => unknown>(;
  func: T,;
  limit: number;
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }
}
