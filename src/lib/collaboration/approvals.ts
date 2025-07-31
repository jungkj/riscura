// Temporarily commented out due to Prisma schema issues - needs to be fixed later
/*
import { db } from '@/lib/db';
import { z } from 'zod';

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  id: string;
  name: string;
  description: string;
  order: number;
  approvers: ApprovalUser[];
  requiredApprovals: number;
  allowDelegation: boolean;
  timeoutHours?: number;
  escalationUsers?: ApprovalUser[];
  conditions?: ApprovalCondition[];
}

export interface ApprovalUser {
  id: string;
  userId: string;
  role: string;
  email: string;
  name: string;
}

export interface ApprovalCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  requesterId: string;
  currentStepId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  data: any;
  approvals: ApprovalAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalAction {
  id: string;
  stepId: string;
  approverId: string;
  action: 'approve' | 'reject' | 'delegate';
  comment?: string;
  delegatedTo?: string;
  createdAt: Date;
}

// Validation schemas
const approvalWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  steps: z.array(z.object({
    name: z.string().min(1, 'Step name is required'),
    description: z.string().optional(),
    order: z.number().min(0),
    approvers: z.array(z.object({
      userId: z.string(),
      role: z.string(),
      email: z.string().email(),
      name: z.string(),
    })).min(1, 'At least one approver is required'),
    requiredApprovals: z.number().min(1),
    allowDelegation: z.boolean().default(false),
    timeoutHours: z.number().optional(),
    escalationUsers: z.array(z.object({
      userId: z.string(),
      role: z.string(),
      email: z.string().email(),
      name: z.string(),
    })).optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
      value: z.any(),
    })).optional(),
  })).min(1, 'At least one step is required'),
  organizationId: z.string(),
  isActive: z.boolean().default(true),
});

const approvalRequestSchema = z.object({
  workflowId: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  requesterId: z.string(),
  data: z.any(),
});

const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delegate']),
  comment: z.string().optional(),
  delegatedTo: z.string().optional(),
});

export class ApprovalWorkflowManager {
  // Create a new approval workflow
  async createWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalWorkflow> {
    // Validate workflow
    this.validateWorkflow(workflow);

    const createdWorkflow = await db.client.approvalWorkflow.create({
      data: {
        ...workflow,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return createdWorkflow;
  }

  // Get workflow by ID
  async getWorkflow(id: string): Promise<ApprovalWorkflow | null> {
    return await db.client.approvalWorkflow.findUnique({
      where: { id },
    });
  }

  // Update workflow
  async updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
    return await db.client.approvalWorkflow.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  // Delete workflow
  async deleteWorkflow(id: string): Promise<void> {
    await db.client.approvalWorkflow.delete({
      where: { id },
    });
  }

  // List workflows for organization
  async listWorkflows(organizationId: string): Promise<ApprovalWorkflow[]> {
    return await db.client.approvalWorkflow.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create approval request
  async createRequest(request: Omit<ApprovalRequest, 'id' | 'currentStepId' | 'status' | 'approvals' | 'createdAt' | 'updatedAt'>): Promise<ApprovalRequest> {
    // Validate request
    approvalRequestSchema.parse(request);

    // Get workflow
    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow is not active');
    }

    // Check if request meets workflow conditions
    const firstStep = workflow.steps.sort((a, b) => a.order - b.order)[0];
    if (!this.checkStepConditions(firstStep, request.data)) {
      throw new Error('Request does not meet workflow conditions');
    }

    const createdRequest = await db.client.approvalRequest.create({
      data: {
        ...request,
        currentStepId: firstStep.id,
        status: 'pending',
        approvals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Send notifications to approvers
    await this.notifyApprovers(createdRequest, firstStep);

    return createdRequest;
  }

  // Process approval action
  async processAction(requestId: string, approverId: string, action: ApprovalAction): Promise<ApprovalRequest> {
    // Validate action
    approvalActionSchema.parse(action);

    // Get request
    const request = await db.client.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    // Get workflow
    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Get current step
    const currentStep = workflow.steps.find(step => step.id === request.currentStepId);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Check if user is authorized to approve
    const isAuthorized = currentStep.approvers.some(approver => approver.userId === approverId);
    if (!isAuthorized) {
      throw new Error('User not authorized to approve this step');
    }

    // Check if user has already acted on this step
    const existingAction = request.approvals.find(
      approval => approval.stepId === currentStep.id && approval.approverId === approverId
    );
    if (existingAction) {
      throw new Error('User has already acted on this step');
    }

    // Add approval action
    const newAction: ApprovalAction = {
      id: generateId(),
      stepId: currentStep.id,
      approverId,
      action: action.action,
      comment: action.comment,
      delegatedTo: action.delegatedTo,
      createdAt: new Date(),
    };

    const updatedApprovals = [...request.approvals, newAction];

    // Check if step is complete
    const stepApprovals = updatedApprovals.filter(approval => approval.stepId === currentStep.id);
    const approveCount = stepApprovals.filter(approval => approval.action === 'approve').length;
    const rejectCount = stepApprovals.filter(approval => approval.action === 'reject').length;

    let newStatus = request.status;
    let nextStepId = request.currentStepId;

    if (rejectCount > 0) {
      // Any rejection fails the request
      newStatus = 'rejected';
    } else if (approveCount >= currentStep.requiredApprovals) {
      // Step is approved, move to next step or complete
      const nextStep = workflow.steps
        .filter(step => step.order > currentStep.order)
        .sort((a, b) => a.order - b.order)[0];

      if (nextStep) {
        nextStepId = nextStep.id;
        // Send notifications to next step approvers
        await this.notifyApprovers(request, nextStep);
      } else {
        // All steps complete
        newStatus = 'approved';
      }
    }

    // Update request
    const updatedRequest = await db.client.approvalRequest.update({
      where: { id: requestId },
      data: {
        currentStepId: nextStepId,
        status: newStatus,
        approvals: updatedApprovals,
        updatedAt: new Date(),
      },
    });

    // Send completion notification if request is complete
    if (newStatus === 'approved' || newStatus === 'rejected') {
      await this.notifyCompletion(updatedRequest, newStatus);
    }

    return updatedRequest;
  }

  // Get request by ID
  async getRequest(id: string): Promise<ApprovalRequest | null> {
    return await db.client.approvalRequest.findUnique({
      where: { id },
    });
  }

  // List requests for user
  async listRequestsForUser(userId: string): Promise<ApprovalRequest[]> {
    return await db.client.approvalRequest.findMany({
      where: {
        OR: [
          { requesterId: userId },
          {
            approvals: {
              some: { approverId: userId },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // List pending requests for approver
  async listPendingForApprover(approverId: string): Promise<ApprovalRequest[]> {
    // This would need a more complex query to check workflow steps
    // For now, return all pending requests
    return await db.client.approvalRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cancel request
  async cancelRequest(requestId: string, userId: string): Promise<ApprovalRequest> {
    const request = await db.client.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.requesterId !== userId) {
      throw new Error('Only the requester can cancel the request');
    }

    if (request.status !== 'pending') {
      throw new Error('Only pending requests can be cancelled');
    }

    return await db.client.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });
  }

  // Get workflow statistics
  async getWorkflowStats(workflowId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    cancelledRequests: number;
    averageProcessingTime: number;
  }> {
    const requests = await db.client.approvalRequest.findMany({
      where: { workflowId },
    });

    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
    const cancelledRequests = requests.filter(r => r.status === 'cancelled').length;

    // Calculate average processing time for completed requests
    const completedRequests = requests.filter(r => r.status === 'approved' || r.status === 'rejected');
    const averageProcessingTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()), 0) / completedRequests.length
      : 0;

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      cancelledRequests,
      averageProcessingTime: averageProcessingTime / (1000 * 60 * 60), // Convert to hours
    };
  }

  // Private helper methods
  private validateWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>): void {
    approvalWorkflowSchema.parse(workflow);

    // Additional validation
    const orders = workflow.steps.map(step => step.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error('Step orders must be unique');
    }

    // Validate that required approvals doesn't exceed available approvers
    for (const step of workflow.steps) {
      if (step.requiredApprovals > step.approvers.length) {
        throw new Error(`Step "${step.name}" requires more approvals than available approvers`);
      }
    }
  }

  private checkStepConditions(step: ApprovalStep, data: any): boolean {
    if (!step.conditions || step.conditions.length === 0) {
      return true;
    }

    return step.conditions.every(condition => {
      const fieldValue = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async notifyApprovers(request: ApprovalRequest, step: ApprovalStep): Promise<void> {
    // Implementation would send notifications to approvers
    // This could integrate with email, Slack, or in-app notifications
    console.log(`Notifying approvers for step: ${step.name}`);
  }

  private async notifyCompletion(request: ApprovalRequest, status: string): Promise<void> {
    // Implementation would send completion notification to requester
    console.log(`Request ${request.id} completed with status: ${status}`);
  }
}

// Utility function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Export singleton instance
export const approvalWorkflowManager = new ApprovalWorkflowManager();

// Export types for external use
export type {
  ApprovalWorkflow,
  ApprovalStep,
  ApprovalUser,
  ApprovalCondition,
  ApprovalRequest,
  ApprovalAction,
};
*/

// Temporary placeholder exports to maintain compatibility
export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  steps: any[];
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalWorkflowManager {
  async createWorkflow(workflow: any): Promise<ApprovalWorkflow> {
    throw new Error('ApprovalWorkflowManager temporarily disabled - needs schema fixes');
  }
}

export const approvalWorkflowManager = new ApprovalWorkflowManager();
