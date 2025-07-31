// Repository index - centralized access to all repositories
export {
  BaseRepository,
  type IBaseRepository,
  type RepositoryResult,
  createPaginatedResult,
} from './base.repository';
export type { RiskFilters, RiskWithControls } from './risk.repository';

// Lazy import functions to avoid circular dependencies
export const createRiskRepository = async () => {
  const { RiskRepository } = await import('./risk.repository');
  return new RiskRepository();
};

// Repository factory for dependency injection patterns
export interface IRepositoryFactory {
  createRiskRepository(): Promise<import('./risk.repository').RiskRepository>;
}

export class RepositoryFactory implements IRepositoryFactory {
  async createRiskRepository() {
    return await createRiskRepository();
  }
}

// Default factory instance
export const repositoryFactory = new RepositoryFactory();
