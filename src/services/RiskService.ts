// import { Risk } from '@/types'

export type CreateRiskOptions = Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>;
