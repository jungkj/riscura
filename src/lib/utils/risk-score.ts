/**
 * Parse risk score from various formats (string, number, text descriptions)
 * Returns a normalized score between 1-5
 */
export function parseRiskScore(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  
  if (typeof value === 'number') return value;
  
  // Handle string values
  const strValue = value.toString().toLowerCase().trim();
  
  // Handle text values
  const textToScore: { [key: string]: number } = {
    'very low': 1, 'verylow': 1, 'very_low': 1,
    'low': 2,
    'medium': 3, 'moderate': 3,
    'high': 4,
    'very high': 5, 'veryhigh': 5, 'very_high': 5, 'critical': 5
  };
  
  if (textToScore[strValue]) {
    return textToScore[strValue];
  }
  
  // Try to parse as number
  const numValue = parseFloat(strValue);
  if (!isNaN(numValue)) {
    return Math.max(1, Math.min(5, Math.round(numValue)));
  }
  
  // Default to 0 if unable to parse
  return 0;
}

/**
 * Validate if a risk score is within acceptable range (1-5)
 */
export function isValidRiskScore(score: number): boolean {
  return score >= 1 && score <= 5;
}

/**
 * Convert numeric risk score to text description
 */
export function riskScoreToText(score: number): string {
  const scoreToText: { [key: number]: string } = {
    1: 'Very Low',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Very High'
  };
  
  return scoreToText[Math.round(score)] || 'Unknown';
}