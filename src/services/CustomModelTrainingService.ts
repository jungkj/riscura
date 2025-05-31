import { generateId } from '@/lib/utils';

// Minimal types for basic functionality
export interface TrainingJob {
  id: string;
  name: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  config: {
    organizationId: string;
    modelName: string;
  };
  metrics?: {
    accuracy: number[];
    trainingLoss?: number[];
  };
  progress?: {
    currentEpoch: number;
    totalEpochs: number;
    progressPercentage: number;
    currentStep?: number;
    remainingTime?: number;
  };
  resources?: {
    estimatedCost: number;
  };
  createdAt: Date;
  completedAt?: Date;
  startedAt?: Date;
}

// Simple implementation of CustomModelTrainingService
export class CustomModelTrainingService {
  private trainingJobs: Map<string, TrainingJob> = new Map();

  /**
   * Get training jobs for an organization
   */
  public async getOrganizationModels(organizationId: string): Promise<TrainingJob[]> {
    return Array.from(this.trainingJobs.values())
      .filter(job => job.config.organizationId === organizationId);
  }

  /**
   * Start training a job
   */
  async startTraining(jobId: string): Promise<void> {
    const job = this.trainingJobs.get(jobId);
    if (!job) {
      throw new Error(`Training job ${jobId} not found`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Cannot start training job in status: ${job.status}`);
    }

    // Update status to training
    job.status = 'training';
    
    // Simulate training completion after 5 seconds
    setTimeout(() => {
      const currentJob = this.trainingJobs.get(jobId);
      if (currentJob) {
        currentJob.status = 'completed';
      }
    }, 5000);
  }

  /**
   * Create a new training job
   */
  async createTrainingJob(config: { organizationId: string; modelName: string }): Promise<TrainingJob> {
    const jobId = generateId('training_job');
    
    const job: TrainingJob = {
      id: jobId,
      name: config.modelName,
      status: 'pending',
      config,
      createdAt: new Date()
    };

    this.trainingJobs.set(jobId, job);
    return job;
  }

  /**
   * Get a specific training job
   */
  public async getTrainingJob(jobId: string): Promise<TrainingJob | undefined> {
    return this.trainingJobs.get(jobId);
  }
}

// Export service instance
export const customModelTrainingService = new CustomModelTrainingService();

// Export additional types that might be imported elsewhere
export interface TrainingConfiguration {
  organizationId: string;
  modelName: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  version?: string;
  documents?: any[];
  embeddings?: {
    vectorDimension: number;
    indexType: string;
    indexConfig: any;
    totalVectors: number;
    lastUpdated: Date;
  };
  indexConfig?: {
    similarity: string;
    numResults: number;
    threshold: number;
  };
  accessConfig?: {
    permissions: string[];
    userGroups: string[];
    apiAccess: boolean;
  };
  qualityMetrics?: {
    averageQuality: number;
    totalDocuments: number;
    categoryCoverage: Record<string, number>;
    lastAssessment: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description?: string;
  status: string;
  hypothesis?: string;
  variants?: Array<{
    id: string;
    name: string;
    modelId: string;
    version: string;
    configuration: any;
    allocation: number;
    status: string;
  }>;
  trafficAllocation?: {
    strategy: string;
    allocations: Record<string, number>;
  };
  successMetrics?: Array<{
    name: string;
    type: string;
    target: number;
    direction: string;
    significance: string;
  }>;
  experimentConfig?: {
    minSampleSize: number;
    maxDuration: number;
    significanceLevel: number;
    power: number;
    earlyStoppingEnabled: boolean;
  };
  createdAt?: Date;
}

export interface ModelDeployment {
  id: string;
  modelId: string;
  version?: string;
  target?: {
    id: string;
    name: string;
    environment: string;
    type: string;
    configuration: any;
    resources: any;
    scaling: any;
    monitoring: any;
  };
  status: string;
  health?: {
    status: string;
    uptime: number;
    errorRate: number;
    latency: number;
    throughput: number;
  };
  metrics?: {
    requestCount: number;
    successRate: number;
    averageLatency: number;
    errorCount: number;
    lastUpdated: Date;
  };
  rolloutStrategy?: {
    type: string;
    percentage: number;
  };
  rollbackConfig?: {
    enabled: boolean;
    triggers: string[];
    maxRollbackAttempts: number;
  };
  deployedAt?: Date;
  lastHealthCheck?: Date;
}

export interface ModelPerformance {
  modelId: string;
  version?: string;
  period?: {
    start: Date;
    end: Date;
  };
  metrics?: {
    accuracy: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
      average: number;
    };
    throughput: number;
    errorRate: number;
    userSatisfaction: number;
    businessMetrics: {
      costPerPrediction: number;
      revenueImpact: number;
      customerSatisfaction: number;
      operationalEfficiency: number;
    };
    technicalMetrics: {
      memoryUsage: number;
      cpuUtilization: number;
      diskUsage: number;
      networkLatency: number;
    };
  };
  degradationAlerts?: any[];
  driftDetection?: {
    detected: boolean;
    severity: string;
    driftType: string;
    confidence: number;
    affectedFeatures: string[];
    recommendations: string[];
    detectedAt: Date;
  };
  feedbackAnalysis?: {
    totalFeedback: number;
    averageRating: number;
    sentimentDistribution: Record<string, number>;
    commonIssues: string[];
    improvements: string[];
  };
  recommendations?: Array<{
    type: string;
    priority: string;
    description: string;
    expectedImpact: string;
    effort: string;
  }>;
} 