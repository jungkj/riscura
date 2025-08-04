/**
 * Color Design System
 * Comprehensive color palette with status indicators, interactive states, and data visualization
 * Designed with accessibility and color-blind friendliness in mind
 */

// Base Color Palette
export const baseColors = {
  // Neutrals (high contrast, accessible)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Primary Blue (trust, reliability)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Riscura Brand Blue
  riscura: {
    50: '#e6f7ff',
    100: '#b3e9ff',
    200: '#80dbff',
    300: '#4dcdff',
    400: '#26bfff',
    500: '#199BEC', // Main Riscura blue
    600: '#1487d1',
    700: '#1073b6',
    800: '#0c5f9b',
    900: '#084b80',
    950: '#043765',
  },
}

// Status Color System (enhanced for clarity and accessibility)
export const statusColors = {
  // Critical/Danger (red with multiple severity levels)
  critical: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    text: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    hover: '#fee2e2',
  },

  // High Priority (orange/amber)
  high: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    text: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    hover: '#fef3c7',
  },

  // Medium Priority (yellow)
  medium: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    text: '#ca8a04',
    bg: '#fefce8',
    border: '#fef08a',
    hover: '#fef9c3',
  },

  // Success/Mitigated (green)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    text: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    hover: '#dcfce7',
  },

  // Info/New (blue)
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    text: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    hover: '#dbeafe',
  },

  // Warning (amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    text: '#ea580c',
    bg: '#fffbeb',
    border: '#fed7aa',
    hover: '#fef3c7',
  },
}

// Interactive State Colors
export const interactiveColors = {
  // Hover states
  hover: {
    background: 'rgba(0, 0, 0, 0.04)',
    border: 'rgba(0, 0, 0, 0.12)',
    text: 'rgba(0, 0, 0, 0.87)',
    primary: '#2563eb',
    secondary: '#64748b',
  },

  // Active/pressed states
  active: {
    background: 'rgba(0, 0, 0, 0.08)',
    border: 'rgba(0, 0, 0, 0.24)',
    text: 'rgba(0, 0, 0, 0.87)',
    primary: '#1d4ed8',
    secondary: '#475569',
  },

  // Focus states (accessibility)
  focus: {
    ring: '#3b82f6',
    ringOffset: '#ffffff',
    outline: '#2563eb',
  },

  // Disabled states
  disabled: {
    background: 'rgba(0, 0, 0, 0.02)',
    text: 'rgba(0, 0, 0, 0.26)',
    border: 'rgba(0, 0, 0, 0.06)',
    opacity: 0.5,
  },
}

// Data Visualization Color Palette (color-blind friendly)
export const dataColors = {
  // Primary palette for charts (8 distinct colors)
  palette: [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
  ],

  // Sequential color scales for metrics
  sequential: {
    blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
    green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
    red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'],
    orange: [
      '#fff7ed',
      '#ffedd5',
      '#fed7aa',
      '#fdba74',
      '#fb923c',
      '#f97316',
      '#ea580c',
      '#c2410c',
    ],
  },

  // Diverging color scale (for risk comparisons)
  diverging: {
    redBlue: [
      '#b91c1c',
      '#dc2626',
      '#ef4444',
      '#f87171',
      '#e5e7eb',
      '#93c5fd',
      '#60a5fa',
      '#3b82f6',
      '#2563eb',
    ],
    redGreen: [
      '#b91c1c',
      '#dc2626',
      '#ef4444',
      '#f87171',
      '#e5e7eb',
      '#86efac',
      '#4ade80',
      '#22c55e',
      '#16a34a',
    ],
  },
}

// Risk-specific Color Mapping
export const riskColors = {
  // Risk levels with consistent mapping
  levels: {
    critical: statusColors.critical,
    high: statusColors.high,
    medium: statusColors.medium,
    low: statusColors.success,
    unknown: statusColors.info,
  },

  // Workflow states
  workflow: {
    identified: statusColors.info,
    assessed: statusColors.warning,
    mitigated: statusColors.success,
    monitoring: statusColors.medium,
    closed: baseColors.neutral,
  },

  // Confidence indicators
  confidence: {
    high: statusColors.success,
    medium: statusColors.warning,
    low: statusColors.critical,
    unknown: baseColors.neutral,
  },
}

// Utility Functions for Color Application
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, any> = {
    critical: statusColors.critical,
    high: statusColors.high,
    medium: statusColors.medium,
    low: statusColors.success,
    success: statusColors.success,
    warning: statusColors.warning,
    info: statusColors.info,
    mitigated: statusColors.success,
    assessed: statusColors.warning,
    identified: statusColors.info,
    monitoring: statusColors.medium,
    closed: baseColors.neutral,
  }

  return statusMap[status.toLowerCase()] || baseColors.neutral;
}

export const getRiskLevelColor = (level: string | number) => {
  if (typeof level === 'number') {
    if (level >= 20) return riskColors.levels.critical;
    if (level >= 15) return riskColors.levels.high;
    if (level >= 10) return riskColors.levels.medium;
    if (level >= 5) return riskColors.levels.low;
    return riskColors.levels.unknown;
  }

  return riskColors.levels[level as keyof typeof riskColors.levels] || riskColors.levels.unknown;
}

export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return riskColors.confidence.high;
  if (confidence >= 0.6) return riskColors.confidence.medium;
  if (confidence >= 0.4) return riskColors.confidence.low;
  return riskColors.confidence.unknown;
}

// CSS Classes for easy application
export const colorClasses = {
  // Status badge classes
  status: {
    critical: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    high: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    low: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    success: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
  },

  // Interactive states
  interactive: {
    button:
      'hover:bg-slate-50 active:bg-slate-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    card: 'hover:shadow-lg hover:border-slate-300 transition-all duration-200',
    link: 'text-blue-600 hover:text-blue-700 hover:underline focus:ring-2 focus:ring-blue-500',
  },

  // Background variants
  background: {
    surface: 'bg-white border border-slate-200',
    elevated: 'bg-white border border-slate-200 shadow-sm',
    sunken: 'bg-slate-50 border border-slate-200',
    overlay: 'bg-white/95 backdrop-blur-sm border border-slate-200/60',
  },
}
