import { db } from '@/lib/db';
import { collaborationServer } from '@/lib/websocket/server';
import { taskManager } from './tasks';

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  entityType: string;
  organizationId: string;
  steps: ApprovalStep[];
  isActive: boolean;
  autoStart: boolean;
  triggerConditions?: ApprovalCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  id: string;
  order: number;
  name: string;
  description?: string;
  type: 'individual' | 'group' | 'majority' | 'unanimous';
  approvers: string[];
  requiredApprovals: number;
  autoAssign: boolean;
  timeoutHours?: number;
  escalationUserId?: string;
  allowDelegate: boolean;
  requireSignature: boolean;
  conditions?: ApprovalCondition[];
  parallelExecution: boolean;
}

export interface ApprovalCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  requesterId: string;
  organizationId: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  submittedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
  approvals: ApprovalAction[];
  comments: ApprovalComment[];
  digitalSignatures: DigitalSignature[];
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  stepId: string;
  approverId: string;
  action: 'approve' | 'reject' | 'delegate' | 'escalate';
  comment?: string;
  delegatedTo?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  signatureRequired: boolean;
  signatureId?: string;
}

export interface ApprovalComment {
  id: string;
  requestId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  attachments: string[];
  createdAt: Date;
}

export interface DigitalSignature {
  id: string;
  requestId: string;
  actionId: string;
  signerId: string;
  signatureData: string;
  algorithm: string;
  timestamp: Date;
  certificateData?: string;
  isValid: boolean;
  verificationData: Record<string, any>;
}

export interface ApprovalNotification {
  type: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
  recipients: string[];
  subject: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'sms' | 'push' | 'slack')[];
  metadata: Record<string, any>;
}

export class ApprovalWorkflowManager {

  // Create a new approval workflow
  async createWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalWorkflow> {
    // Validate workflow steps
    this.validateWorkflow(workflow);

    const createdWorkflow = await db.client.approvalWorkflow.create({
      data: {
        ...workflow,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'WORKFLOW_CREATED',
        entityType: 'APPROVAL_WORKFLOW',
        entityId: createdWorkflow.id,
        description: `Approval workflow created: ${workflow.name}`,
        userId: 'system',
        organizationId: workflow.organizationId,
        metadata: {
          workflowName: workflow.name,
          entityType: workflow.entityType,
          stepCount: workflow.steps.length,
        },
        isPublic: false,
      },
    });

    return createdWorkflow;
  }

  // Start approval process for an entity
  async startApproval(params: {
    workflowId: string;
    entityType: string;
    entityId: string;
    requesterId: string;
    organizationId: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
  }): Promise<ApprovalRequest> {
    
    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: params.workflowId },
    });

    if (!workflow) {
      throw new Error('Approval workflow not found');
    }

    if (!workflow.isActive) {
      throw new Error('Approval workflow is not active');
    }

    // Check if approval already exists
    const existingRequest = await db.client.approvalRequest.findFirst({
      where: {
        workflowId: params.workflowId,
        entityType: params.entityType,
        entityId: params.entityId,
        status: { in: ['pending', 'escalated'] },
      },
    });

    if (existingRequest) {
      throw new Error('Approval request already exists for this entity');
    }

    // Create approval request
    const request = await db.client.approvalRequest.create({
      data: {
        workflowId: params.workflowId,
        entityType: params.entityType,
        entityId: params.entityId,
        requesterId: params.requesterId,
        organizationId: params.organizationId,
        currentStep: 0,
        status: 'pending',
        submittedAt: new Date(),
        expiresAt: params.expiresAt,
        metadata: params.metadata || {},
        approvals: [],
        comments: [],
        digitalSignatures: [],
      },
    });

    // Start first approval step
    await this.processApprovalStep(request.id, 0);

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'APPROVAL_STARTED',
        entityType: params.entityType.toUpperCase(),
        entityId: params.entityId,
        description: `Approval process started: ${workflow.name}`,
        userId: params.requesterId,
        organizationId: params.organizationId,
        metadata: {
          requestId: request.id,
          workflowName: workflow.name,
          stepCount: workflow.steps.length,
        },
        isPublic: true,
      },
    });

    return request;
  }

  // Process a specific approval step
  private async processApprovalStep(requestId: string, stepIndex: number): Promise<void> {
    const request = await db.client.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow || stepIndex >= workflow.steps.length) {
      // All steps completed - approve the request
      await this.completeApproval(requestId, 'approved');
      return;
    }

    const step = workflow.steps[stepIndex];

    // Check step conditions
    if (step.conditions && !this.evaluateConditions(step.conditions, request.metadata)) {
      // Skip this step
      await this.processApprovalStep(requestId, stepIndex + 1);
      return;
    }

    // Update request current step
    await db.client.approvalRequest.update({
      where: { id: requestId },
      data: { currentStep: stepIndex },
    });

    // Create tasks for approvers
    for (const approverId of step.approvers) {
      await taskManager.createTask({
        title: `Approval Required: ${workflow.name}`,
        description: `Please review and approve: ${step.name}`,
        status: 'todo',
        priority: 'high',
        type: 'approval',
        assigneeId: approverId,
        creatorId: request.requesterId,
        organizationId: request.organizationId,
        entityType: request.entityType,
        entityId: request.entityId,
        dueDate: step.timeoutHours ? new Date(Date.now() + step.timeoutHours * 60 * 60 * 1000) : undefined,
        metadata: {
          requestId,
          stepId: step.id,
          workflowName: workflow.name,
          stepName: step.name,
          requireSignature: step.requireSignature,
        },
        dependencies: [],
        attachments: [],
        tags: ['approval', 'review'],
        watchers: [request.requesterId],
      });
    }

    // Set up timeout if specified
    if (step.timeoutHours) {
      setTimeout(async () => {
        await this.handleStepTimeout(requestId, stepIndex);
      }, step.timeoutHours * 60 * 60 * 1000);
    }

    // Send notifications
    await this.sendApprovalNotifications(request, step, 'pending');
  }

  // Submit approval action
  async submitApproval(params: {
    requestId: string;
    approverId: string;
    action: 'approve' | 'reject' | 'delegate';
    comment?: string;
    delegatedTo?: string;
    signatureData?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ApprovalAction> {
    
    const request = await db.client.approvalRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'pending' && request.status !== 'escalated') {
      throw new Error('Approval request is not in pending status');
    }

    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow) {
      throw new Error('Approval workflow not found');
    }

    const currentStep = workflow.steps[request.currentStep];
    if (!currentStep) {
      throw new Error('Invalid approval step');
    }

    // Check if user is authorized to approve this step
    if (!currentStep.approvers.includes(params.approverId)) {
      throw new Error('User is not authorized to approve this step');
    }

    // Check if user has already acted on this step
    const existingAction = request.approvals.find(a => 
      a.stepId === currentStep.id && a.approverId === params.approverId
    );

    if (existingAction) {
      throw new Error('User has already acted on this step');
    }

    // Create approval action
    const action = await db.client.approvalAction.create({
      data: {
        requestId: params.requestId,
        stepId: currentStep.id,
        approverId: params.approverId,
        action: params.action,
        comment: params.comment,
        delegatedTo: params.delegatedTo,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        signatureRequired: currentStep.requireSignature,
      },
    });

    // Handle digital signature if required
    if (currentStep.requireSignature && params.signatureData) {
      await this.processDigitalSignature(params.requestId, action.id, params.approverId, params.signatureData);
    }

    // Handle delegation
    if (params.action === 'delegate' && params.delegatedTo) {
      await this.handleDelegation(params.requestId, currentStep.id, params.approverId, params.delegatedTo);
    }

    // Check if step is complete
    const stepApprovals = request.approvals.filter(a => a.stepId === currentStep.id);
    const approvalCount = stepApprovals.filter(a => a.action === 'approve').length + 1; // +1 for current action
    const rejectionCount = stepApprovals.filter(a => a.action === 'reject').length + (params.action === 'reject' ? 1 : 0);

    let stepComplete = false;
    let requestStatus: 'pending' | 'approved' | 'rejected' = 'pending';

    switch (currentStep.type) {
      case 'individual':
        stepComplete = true;
        requestStatus = params.action === 'approve' ? 'approved' : 'rejected';
        break;
      
      case 'group':
        if (params.action === 'reject') {
          stepComplete = true;
          requestStatus = 'rejected';
        } else if (approvalCount >= currentStep.requiredApprovals) {
          stepComplete = true;
          requestStatus = 'approved';
        }
        break;
      
      case 'majority':
        const totalApprovers = currentStep.approvers.length;
        const majorityThreshold = Math.ceil(totalApprovers / 2);
        if (approvalCount >= majorityThreshold) {
          stepComplete = true;
          requestStatus = 'approved';
        } else if (rejectionCount >= majorityThreshold) {
          stepComplete = true;
          requestStatus = 'rejected';
        }
        break;
      
      case 'unanimous':
        if (rejectionCount > 0) {
          stepComplete = true;
          requestStatus = 'rejected';
        } else if (approvalCount === currentStep.approvers.length) {
          stepComplete = true;
          requestStatus = 'approved';
        }
        break;
    }

    // Log activity
    await db.client.activity.create({
      data: {
        type: `APPROVAL_${params.action.toUpperCase()}`,
        entityType: request.entityType.toUpperCase(),
        entityId: request.entityId,
        description: `Approval ${params.action}: ${currentStep.name}`,
        userId: params.approverId,
        organizationId: request.organizationId,
        metadata: {
          requestId: params.requestId,
          stepName: currentStep.name,
          comment: params.comment,
        },
        isPublic: true,
      },
    });

    // Send real-time updates
    if (collaborationServer) {
      const roomId = `approval:${params.requestId}`;
      collaborationServer.broadcastToRoom(roomId, {
        type: 'approval:action_submitted',
        payload: { action, request },
        timestamp: new Date(),
        userId: params.approverId,
      });
    }

    // Handle step completion
    if (stepComplete) {
      if (requestStatus === 'approved') {
        // Move to next step or complete approval
        await this.processApprovalStep(params.requestId, request.currentStep + 1);
      } else {
        // Reject the request
        await this.completeApproval(params.requestId, 'rejected');
      }
    }

    return action;
  }

  // Handle step timeout and escalation
  private async handleStepTimeout(requestId: string, stepIndex: number): Promise<void> {
    const request = await db.client.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'pending' || request.currentStep !== stepIndex) {
      return; // Request may have been completed or moved to next step
    }

    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow) return;

    const step = workflow.steps[stepIndex];
    if (!step || !step.escalationUserId) return;

    // Update request status to escalated
    await db.client.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'escalated' },
    });

    // Create escalation task
    await taskManager.createTask({
      title: `Escalated Approval: ${workflow.name}`,
      description: `Approval step "${step.name}" has timed out and requires escalation`,
      status: 'todo',
      priority: 'urgent',
      type: 'escalation',
      assigneeId: step.escalationUserId,
      creatorId: 'system',
      organizationId: request.organizationId,
      entityType: request.entityType,
      entityId: request.entityId,
      metadata: {
        requestId,
        stepId: step.id,
        originalApprovers: step.approvers,
        timeoutHours: step.timeoutHours,
      },
      dependencies: [],
      attachments: [],
      tags: ['escalation', 'urgent'],
      watchers: [request.requesterId, ...step.approvers],
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'APPROVAL_ESCALATED',
        entityType: request.entityType.toUpperCase(),
        entityId: request.entityId,
        description: `Approval escalated due to timeout: ${step.name}`,
        userId: 'system',
        organizationId: request.organizationId,
        metadata: {
          requestId,
          stepName: step.name,
          escalatedTo: step.escalationUserId,
          timeoutHours: step.timeoutHours,
        },
        isPublic: true,
      },
    });

    // Send notifications
    await this.sendApprovalNotifications(request, step, 'escalated');
  }

  // Complete approval process
  private async completeApproval(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
    const request = await db.client.approvalRequest.update({
      where: { id: requestId },
      data: {
        status,
        completedAt: new Date(),
      },
    });

    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow) return;

    // Log completion
    await db.client.activity.create({
      data: {
        type: `APPROVAL_${status.toUpperCase()}`,
        entityType: request.entityType.toUpperCase(),
        entityId: request.entityId,
        description: `Approval process ${status}: ${workflow.name}`,
        userId: 'system',
        organizationId: request.organizationId,
        metadata: {
          requestId,
          workflowName: workflow.name,
          totalSteps: workflow.steps.length,
          completedSteps: request.currentStep + 1,
        },
        isPublic: true,
      },
    });

    // Send real-time updates
    if (collaborationServer) {
      const roomId = `approval:${requestId}`;
      collaborationServer.broadcastToRoom(roomId, {
        type: 'approval:completed',
        payload: { request, status },
        timestamp: new Date(),
        userId: 'system',
      });
    }

    // Send final notifications
    await this.sendApprovalNotifications(request, null, status === 'approved' ? 'approved' : 'rejected');

    // Handle post-approval actions
    if (status === 'approved') {
      await this.handlePostApprovalActions(request);
    }
  }

  // Handle post-approval automation
  private async handlePostApprovalActions(request: ApprovalRequest): Promise<void> {
    // Update entity status if applicable
    switch (request.entityType) {
      case 'document':
        await db.client.document.update({
          where: { id: request.entityId },
          data: { 
            status: 'approved',
            approvedAt: new Date(),
            approvedById: 'system', // Could be set to final approver
          },
        });
        break;
      
      case 'risk':
        await db.client.risk.update({
          where: { id: request.entityId },
          data: { status: 'approved' },
        });
        break;
      
      case 'control':
        await db.client.control.update({
          where: { id: request.entityId },
          data: { status: 'approved' },
        });
        break;
    }

    // Create follow-up tasks if needed
    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (workflow && request.metadata.createFollowUpTasks) {
      // Create implementation or monitoring tasks
      await taskManager.createTask({
        title: `Implementation Required: ${workflow.name}`,
        description: 'Implement approved changes and monitor compliance',
        status: 'todo',
        priority: 'medium',
        type: 'action',
        assigneeId: request.requesterId,
        creatorId: 'system',
        organizationId: request.organizationId,
        entityType: request.entityType,
        entityId: request.entityId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        metadata: {
          approvalRequestId: request.id,
          type: 'post_approval_implementation',
        },
        dependencies: [],
        attachments: [],
        tags: ['implementation', 'approved'],
        watchers: [],
      });
    }
  }

  // Process digital signature
  private async processDigitalSignature(requestId: string, actionId: string, signerId: string, signatureData: string): Promise<DigitalSignature> {
    // In a real implementation, this would validate the signature using cryptographic libraries
    // For now, we'll store the signature data and mark it as valid
    
    const signature = await db.client.digitalSignature.create({
      data: {
        requestId,
        actionId,
        signerId,
        signatureData,
        algorithm: 'RSA-SHA256', // Example algorithm
        timestamp: new Date(),
        isValid: true, // Would be result of actual verification
        verificationData: {
          signatureLength: signatureData.length,
          algorithm: 'RSA-SHA256',
          verified: true,
        },
      },
    });

    // Update action with signature ID
    await db.client.approvalAction.update({
      where: { id: actionId },
      data: { signatureId: signature.id },
    });

    return signature;
  }

  // Handle delegation
  private async handleDelegation(requestId: string, stepId: string, delegatorId: string, delegateeId: string): Promise<void> {
    // Remove delegator from step approvers and add delegatee
    const request = await db.client.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return;

    const workflow = await db.client.approvalWorkflow.findUnique({
      where: { id: request.workflowId },
    });

    if (!workflow) return;

    const step = workflow.steps[request.currentStep];
    if (!step || step.id !== stepId) return;

    // Update step approvers
    const updatedApprovers = step.approvers.map(id => id === delegatorId ? delegateeId : id);
    
    // Update workflow step
    const updatedSteps = workflow.steps.map(s => 
      s.id === stepId ? { ...s, approvers: updatedApprovers } : s
    );

    await db.client.approvalWorkflow.update({
      where: { id: workflow.id },
      data: { steps: updatedSteps },
    });

    // Create delegation task for new approver
    await taskManager.createTask({
      title: `Delegated Approval: ${workflow.name}`,
      description: `${delegatorId} has delegated approval responsibility to you for: ${step.name}`,
      status: 'todo',
      priority: 'high',
      type: 'approval',
      assigneeId: delegateeId,
      creatorId: delegatorId,
      organizationId: request.organizationId,
      entityType: request.entityType,
      entityId: request.entityId,
      metadata: {
        requestId,
        stepId,
        delegatedFrom: delegatorId,
        originalApprover: delegatorId,
      },
      dependencies: [],
      attachments: [],
      tags: ['delegated', 'approval'],
      watchers: [delegatorId],
    });

    // Log delegation
    await db.client.activity.create({
      data: {
        type: 'APPROVAL_DELEGATED',
        entityType: request.entityType.toUpperCase(),
        entityId: request.entityId,
        description: `Approval delegated from ${delegatorId} to ${delegateeId}`,
        userId: delegatorId,
        organizationId: request.organizationId,
        metadata: {
          requestId,
          stepName: step.name,
          delegatedTo: delegateeId,
        },
        isPublic: true,
      },
    });
  }

  // Send approval notifications
  private async sendApprovalNotifications(request: ApprovalRequest, step: ApprovalStep | null, type: 'pending' | 'approved' | 'rejected' | 'escalated'): Promise<void> {
    let recipients: string[] = [];
    let subject = '';
    let message = '';
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    switch (type) {
      case 'pending':
        recipients = step ? step.approvers : [];
        subject = 'Approval Required';
        message = `Please review and approve: ${step?.name}`;
        urgency = 'high';
        break;
      
      case 'approved':
        recipients = [request.requesterId];
        subject = 'Approval Completed';
        message = 'Your approval request has been approved';
        urgency = 'medium';
        break;
      
      case 'rejected':
        recipients = [request.requesterId];
        subject = 'Approval Rejected';
        message = 'Your approval request has been rejected';
        urgency = 'high';
        break;
      
      case 'escalated':
        recipients = step?.escalationUserId ? [step.escalationUserId] : [];
        subject = 'Approval Escalated';
        message = `Approval step has been escalated due to timeout: ${step?.name}`;
        urgency = 'critical';
        break;
    }

    // Send notifications to each recipient
    for (const recipientId of recipients) {
      await db.client.notification.create({
        data: {
          type: `APPROVAL_${type.toUpperCase()}`,
          recipientId,
          senderId: 'system',
          entityType: 'APPROVAL_REQUEST',
          entityId: request.id,
          title: subject,
          message,
          isRead: false,
          createdAt: new Date(),
        },
      });

      // Send real-time notification
      if (collaborationServer) {
        collaborationServer.sendToUser(recipientId, {
          type: 'notification:received',
          payload: {
            type: `approval:${type}`,
            request,
            urgency,
          },
          timestamp: new Date(),
          userId: 'system',
        });
      }
    }
  }

  // Validate workflow configuration
  private validateWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      if (step.order !== i) {
        throw new Error(`Step order must be sequential starting from 0`);
      }

      if (!step.approvers || step.approvers.length === 0) {
        throw new Error(`Step ${i} must have at least one approver`);
      }

      if (step.requiredApprovals > step.approvers.length) {
        throw new Error(`Step ${i} required approvals cannot exceed number of approvers`);
      }

      if (step.type === 'unanimous' && step.requiredApprovals !== step.approvers.length) {
        throw new Error(`Step ${i} unanimous approval requires all approvers`);
      }
    }
  }

  // Evaluate conditions
  private evaluateConditions(conditions: ApprovalCondition[], metadata: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = metadata[condition.field];
      let conditionResult = false;

      switch (condition.operator) {
        case 'equals':
          conditionResult = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionResult = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionResult = fieldValue > condition.value;
          break;
        case 'less_than':
          conditionResult = fieldValue < condition.value;
          break;
        case 'contains':
          conditionResult = String(fieldValue).includes(String(condition.value));
          break;
        case 'not_contains':
          conditionResult = !String(fieldValue).includes(String(condition.value));
          break;
        case 'in':
          conditionResult = Array.isArray(condition.value) && condition.value.includes(fieldValue);
          break;
        case 'not_in':
          conditionResult = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
          break;
      }

      if (condition.logicalOperator) {
        logicalOperator = condition.logicalOperator;
      }

      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }

    return result;
  }

  // Get approval requests for user
  async getUserApprovalRequests(userId: string, organizationId: string, filters: {
    status?: string[];
    entityType?: string;
    pendingOnly?: boolean;
    assignedToMe?: boolean;
    createdByMe?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ requests: ApprovalRequest[]; total: number }> {
    
    const where: any = {
      organizationId,
    };

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.pendingOnly) {
      where.status = { in: ['pending', 'escalated'] };
    }

    if (filters.assignedToMe || filters.createdByMe) {
      where.OR = [];
      
      if (filters.assignedToMe) {
        // Find requests where user is an approver in current step
        where.OR.push({
          // This would need a more complex query to check current step approvers
          requesterId: userId, // Simplified for now
        });
      }
      
      if (filters.createdByMe) {
        where.OR.push({ requesterId: userId });
      }
    }

    const [requests, total] = await Promise.all([
      db.client.approvalRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
              steps: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          digitalSignatures: true,
        },
        orderBy: [
          { status: 'asc' },
          { submittedAt: 'desc' },
        ],
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      db.client.approvalRequest.count({ where }),
    ]);

    return { requests, total };
  }

  // Cancel approval request
  async cancelApprovalRequest(requestId: string, cancelledBy: string): Promise<void> {
    const request = await db.client.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'pending' && request.status !== 'escalated') {
      throw new Error('Cannot cancel completed approval request');
    }

    // Update request status
    await db.client.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    // Cancel related tasks
    await db.client.task.updateMany({
      where: {
        entityType: request.entityType,
        entityId: request.entityId,
        status: { in: ['todo', 'in_progress'] },
        metadata: {
          path: ['requestId'],
          equals: requestId,
        },
      },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'APPROVAL_CANCELLED',
        entityType: request.entityType.toUpperCase(),
        entityId: request.entityId,
        description: 'Approval request cancelled',
        userId: cancelledBy,
        organizationId: request.organizationId,
        metadata: {
          requestId,
        },
        isPublic: true,
      },
    });

    // Send notifications
    await this.sendApprovalNotifications(request, null, 'rejected'); // Using rejected for cancelled
  }
}

export const approvalWorkflowManager = new ApprovalWorkflowManager(); 