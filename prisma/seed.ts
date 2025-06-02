import { PrismaClient, UserRole, RiskCategory, RiskLevel, RiskStatus, ControlType, ControlStatus, TaskType, TaskStatus, Priority, NotificationType, ActivityType, EntityType, WorkflowType, WorkflowStatus, QuestionnaireStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.activity.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.response.deleteMany({});
  await prisma.questionnaire.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.controlRiskMapping.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.control.deleteMany({});
  await prisma.risk.deleteMany({});
  await prisma.workflowStep.deleteMany({});
  await prisma.workflowV2.deleteMany({});
  await prisma.workflow.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('🧹 Cleaned existing data');

  // Create Organizations
  const demoOrg = await prisma.organization.create({
    data: {
      id: 'org-riscura-demo',
      name: 'Riscura Demo Corporation',
      domain: 'riscura-demo.com',
      settings: {
        riskAppetite: 'moderate',
        industry: 'financial_services',
        size: 'large',
        frameworks: ['ISO31000', 'COSO', 'SOX'],
        timezone: 'UTC',
        currency: 'USD'
      },
      plan: 'enterprise',
      isActive: true,
    },
  });

  const techStartup = await prisma.organization.create({
    data: {
      id: 'org-techstartup',
      name: 'TechStartup Inc.',
      domain: 'techstartup.com',
      settings: {
        riskAppetite: 'aggressive',
        industry: 'technology',
        size: 'small',
        frameworks: ['NIST', 'ISO27001'],
        timezone: 'PST',
        currency: 'USD'
      },
      plan: 'pro',
      isActive: true,
    },
  });

  console.log('🏢 Created organizations');

  // Create Users with hashed passwords
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const adminUser = await prisma.user.create({
    data: {
      id: 'user-admin-001',
      email: 'admin@riscura-demo.com',
      firstName: 'Sarah',
      lastName: 'Anderson',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      permissions: ['*'], // All permissions
      isActive: true,
      emailVerified: new Date(),
      organizationId: demoOrg.id,
    },
  });

  const riskManagerUser = await prisma.user.create({
    data: {
      id: 'user-risk-manager-001',
      email: 'riskmanager@riscura-demo.com',
      firstName: 'Michael',
      lastName: 'Johnson',
      passwordHash: hashedPassword,
      role: UserRole.RISK_MANAGER,
      permissions: ['risks:read', 'risks:write', 'controls:read', 'controls:write', 'reports:read'],
      isActive: true,
      emailVerified: new Date(),
      organizationId: demoOrg.id,
    },
  });

  const auditorUser = await prisma.user.create({
    data: {
      id: 'user-auditor-001',
      email: 'auditor@riscura-demo.com',
      firstName: 'Jennifer',
      lastName: 'Williams',
      passwordHash: hashedPassword,
      role: UserRole.AUDITOR,
      permissions: ['risks:read', 'controls:read', 'reports:read', 'documents:read'],
      isActive: true,
      emailVerified: new Date(),
      organizationId: demoOrg.id,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      id: 'user-regular-001',
      email: 'user@riscura-demo.com',
      firstName: 'David',
      lastName: 'Brown',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      permissions: ['risks:read', 'controls:read'],
      isActive: true,
      emailVerified: new Date(),
      organizationId: demoOrg.id,
    },
  });

  // Create startup users
  const startupCEO = await prisma.user.create({
    data: {
      id: 'user-startup-ceo',
      email: 'ceo@techstartup.com',
      firstName: 'Alex',
      lastName: 'Chen',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      permissions: ['*'],
      isActive: true,
      emailVerified: new Date(),
      organizationId: techStartup.id,
    },
  });

  console.log('👥 Created users');

  // Create Risks
  const risks = [
    {
      id: 'risk-cyber-001',
      title: 'Cybersecurity Data Breach Risk',
      description: 'Risk of unauthorized access to customer data and proprietary information through cyber attacks, including phishing, malware, and advanced persistent threats.',
      category: RiskCategory.TECHNOLOGY,
      likelihood: 4,
      impact: 5,
      riskScore: 20,
      riskLevel: RiskLevel.CRITICAL,
      owner: riskManagerUser.id,
      status: RiskStatus.ASSESSED,
      dateIdentified: new Date('2024-01-15'),
      lastAssessed: new Date('2024-01-20'),
      nextReview: new Date('2024-04-20'),
      aiConfidence: 0.92,
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
    {
      id: 'risk-market-001',
      title: 'Market Volatility and Credit Risk',
      description: 'Risk arising from market fluctuations affecting investment portfolios, credit exposures, and revenue streams in volatile economic conditions.',
      category: RiskCategory.FINANCIAL,
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: RiskLevel.HIGH,
      owner: riskManagerUser.id,
      status: RiskStatus.MITIGATED,
      dateIdentified: new Date('2024-01-10'),
      lastAssessed: new Date('2024-01-25'),
      nextReview: new Date('2024-04-25'),
      aiConfidence: 0.87,
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
    {
      id: 'risk-compliance-001',
      title: 'Regulatory Compliance Violations',
      description: 'Risk of non-compliance with SOX, GDPR, and industry-specific regulations leading to penalties, fines, and reputational damage.',
      category: RiskCategory.COMPLIANCE,
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      riskLevel: RiskLevel.MEDIUM,
      owner: auditorUser.id,
      status: RiskStatus.IDENTIFIED,
      dateIdentified: new Date('2024-01-20'),
      lastAssessed: new Date('2024-01-22'),
      nextReview: new Date('2024-04-22'),
      aiConfidence: 0.95,
      organizationId: demoOrg.id,
      createdBy: auditorUser.id,
    },
    {
      id: 'risk-operational-001',
      title: 'Key Personnel Departure Risk',
      description: 'Risk of business disruption due to departure of key personnel, loss of institutional knowledge, and inability to maintain critical operations.',
      category: RiskCategory.OPERATIONAL,
      likelihood: 3,
      impact: 3,
      riskScore: 9,
      riskLevel: RiskLevel.MEDIUM,
      owner: adminUser.id,
      status: RiskStatus.IDENTIFIED,
      dateIdentified: new Date('2024-01-18'),
      nextReview: new Date('2024-04-18'),
      aiConfidence: 0.78,
      organizationId: demoOrg.id,
      createdBy: adminUser.id,
    },
    {
      id: 'risk-strategic-001',
      title: 'Digital Transformation Initiative Risk',
      description: 'Risk of project failure, cost overruns, and business disruption from large-scale digital transformation initiatives.',
      category: RiskCategory.STRATEGIC,
      likelihood: 2,
      impact: 4,
      riskScore: 8,
      riskLevel: RiskLevel.MEDIUM,
      owner: adminUser.id,
      status: RiskStatus.ASSESSED,
      dateIdentified: new Date('2024-01-12'),
      lastAssessed: new Date('2024-01-28'),
      nextReview: new Date('2024-04-28'),
      aiConfidence: 0.83,
      organizationId: demoOrg.id,
      createdBy: adminUser.id,
    },
    // Startup risks
    {
      id: 'risk-startup-funding',
      title: 'Series A Funding Risk',
      description: 'Risk of inability to secure Series A funding leading to cash flow issues and potential business closure.',
      category: RiskCategory.FINANCIAL,
      likelihood: 3,
      impact: 5,
      riskScore: 15,
      riskLevel: RiskLevel.HIGH,
      owner: startupCEO.id,
      status: RiskStatus.IDENTIFIED,
      dateIdentified: new Date('2024-01-25'),
      nextReview: new Date('2024-03-25'),
      aiConfidence: 0.91,
      organizationId: techStartup.id,
      createdBy: startupCEO.id,
    },
  ];

  const createdRisks = await Promise.all(
    risks.map(risk => prisma.risk.create({ data: risk }))
  );

  console.log('🚨 Created risks');

  // Create Controls
  const controls = [
    {
      id: 'ctrl-mfa-001',
      title: 'Multi-Factor Authentication System',
      description: 'Comprehensive MFA implementation across all systems and applications with hardware token support for privileged accounts.',
      type: ControlType.PREVENTIVE,
      effectiveness: 0.85,
      owner: riskManagerUser.id,
      frequency: 'Continuous',
      status: ControlStatus.ACTIVE,
      lastTestDate: new Date('2024-01-15'),
      nextTestDate: new Date('2024-04-15'),
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
    {
      id: 'ctrl-encrypt-001',
      title: 'Data Encryption at Rest and in Transit',
      description: 'AES-256 encryption for data at rest and TLS 1.3 for data in transit with proper key management and rotation policies.',
      type: ControlType.PREVENTIVE,
      effectiveness: 0.90,
      owner: riskManagerUser.id,
      frequency: 'Continuous',
      status: ControlStatus.ACTIVE,
      lastTestDate: new Date('2024-01-10'),
      nextTestDate: new Date('2024-04-10'),
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
    {
      id: 'ctrl-monitoring-001',
      title: 'Security Information and Event Management (SIEM)',
      description: 'Real-time monitoring and analysis of security events with automated alerting and incident response workflows.',
      type: ControlType.DETECTIVE,
      effectiveness: 0.80,
      owner: riskManagerUser.id,
      frequency: 'Continuous',
      status: ControlStatus.ACTIVE,
      lastTestDate: new Date('2024-01-20'),
      nextTestDate: new Date('2024-04-20'),
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
    {
      id: 'ctrl-backup-001',
      title: 'Automated Data Backup and Recovery',
      description: 'Daily automated backups with geo-redundant storage and quarterly disaster recovery testing.',
      type: ControlType.CORRECTIVE,
      effectiveness: 0.75,
      owner: adminUser.id,
      frequency: 'Daily',
      status: ControlStatus.ACTIVE,
      lastTestDate: new Date('2024-01-25'),
      nextTestDate: new Date('2024-04-25'),
      organizationId: demoOrg.id,
      createdBy: adminUser.id,
    },
    {
      id: 'ctrl-compliance-001',
      title: 'Regulatory Compliance Monitoring',
      description: 'Automated compliance monitoring system with real-time regulatory change tracking and impact assessment.',
      type: ControlType.DETECTIVE,
      effectiveness: 0.88,
      owner: auditorUser.id,
      frequency: 'Weekly',
      status: ControlStatus.ACTIVE,
      lastTestDate: new Date('2024-01-22'),
      nextTestDate: new Date('2024-04-22'),
      organizationId: demoOrg.id,
      createdBy: auditorUser.id,
    },
    {
      id: 'ctrl-access-001',
      title: 'Privileged Access Management',
      description: 'Role-based access control with just-in-time access provisioning and comprehensive audit logging.',
      type: ControlType.PREVENTIVE,
      effectiveness: 0.82,
      owner: riskManagerUser.id,
      frequency: 'Continuous',
      status: ControlStatus.ACTIVE,
      lastTestDate: new Date('2024-01-18'),
      nextTestDate: new Date('2024-04-18'),
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
  ];

  const createdControls = await Promise.all(
    controls.map(control => prisma.control.create({ data: control }))
  );

  console.log('🛡️ Created controls');

  // Create Control-Risk Mappings
  const mappings = [
    { riskId: createdRisks[0].id, controlId: createdControls[0].id, effectiveness: 0.85 }, // Cyber risk -> MFA
    { riskId: createdRisks[0].id, controlId: createdControls[1].id, effectiveness: 0.90 }, // Cyber risk -> Encryption
    { riskId: createdRisks[0].id, controlId: createdControls[2].id, effectiveness: 0.80 }, // Cyber risk -> SIEM
    { riskId: createdRisks[0].id, controlId: createdControls[5].id, effectiveness: 0.82 }, // Cyber risk -> PAM
    { riskId: createdRisks[2].id, controlId: createdControls[4].id, effectiveness: 0.88 }, // Compliance risk -> Compliance monitoring
    { riskId: createdRisks[1].id, controlId: createdControls[3].id, effectiveness: 0.75 }, // Market risk -> Backup
  ];

  await Promise.all(
    mappings.map(mapping => prisma.controlRiskMapping.create({ data: mapping }))
  );

  console.log('🔗 Created control-risk mappings');

  // Create Documents
  const documents = [
    {
      id: 'doc-policy-001',
      name: 'Information Security Policy v2.1',
      type: 'policy',
      size: 2048576, // 2MB
      extractedText: 'This policy establishes the requirements for information security management...',
      aiAnalysis: {
        risks: ['data_breach', 'unauthorized_access'],
        controls: ['access_control', 'encryption'],
        confidence: 0.94
      },
      organizationId: demoOrg.id,
      uploadedBy: adminUser.id,
    },
    {
      id: 'doc-procedure-001',
      name: 'Incident Response Procedure',
      type: 'procedure',
      size: 1024768,
      extractedText: 'This procedure defines the steps for responding to security incidents...',
      aiAnalysis: {
        risks: ['cyber_attack', 'data_loss'],
        controls: ['incident_response', 'monitoring'],
        confidence: 0.89
      },
      organizationId: demoOrg.id,
      uploadedBy: riskManagerUser.id,
    },
    {
      id: 'doc-assessment-001',
      name: 'Q1 2024 Risk Assessment Report',
      type: 'report',
      size: 3145728, // 3MB
      extractedText: 'Quarterly risk assessment findings and recommendations...',
      aiAnalysis: {
        risks: ['operational_risk', 'financial_risk'],
        controls: ['risk_monitoring', 'internal_controls'],
        confidence: 0.91
      },
      organizationId: demoOrg.id,
      uploadedBy: auditorUser.id,
    },
  ];

  const createdDocuments = await Promise.all(
    documents.map(doc => prisma.document.create({ data: doc }))
  );

  console.log('📄 Created documents');

  // Create Questionnaires
  const questionnaire = await prisma.questionnaire.create({
    data: {
      id: 'quest-cyber-001',
      title: 'Cybersecurity Readiness Assessment',
      description: 'Comprehensive assessment of cybersecurity controls and procedures',
      questions: [
        {
          id: 'q1',
          text: 'Does your organization have a formal information security policy?',
          type: 'yes_no',
          required: true,
          order: 1,
          category: 'governance'
        },
        {
          id: 'q2',
          text: 'How would you rate your organization\'s cybersecurity maturity?',
          type: 'rating',
          options: ['1 - Initial', '2 - Developing', '3 - Defined', '4 - Managed', '5 - Optimized'],
          required: true,
          order: 2,
          category: 'maturity'
        },
        {
          id: 'q3',
          text: 'Please upload your current security policy document',
          type: 'file_upload',
          required: false,
          order: 3,
          category: 'documentation'
        }
      ],
      targetRoles: ['ADMIN', 'RISK_MANAGER', 'AUDITOR'],
      status: QuestionnaireStatus.ACTIVE,
      dueDate: new Date('2024-04-30'),
      estimatedTime: 15,
      tags: ['cybersecurity', 'assessment', 'Q1-2024'],
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
  });

  // Create sample responses
  await prisma.response.create({
    data: {
      questionnaireId: questionnaire.id,
      questionId: 'q1',
      userId: adminUser.id,
      answer: true,
    },
  });

  await prisma.response.create({
    data: {
      questionnaireId: questionnaire.id,
      questionId: 'q2',
      userId: adminUser.id,
      answer: 4,
    },
  });

  console.log('📋 Created questionnaires and responses');

  // Create Tasks
  const tasks = [
    {
      id: 'task-001',
      title: 'Complete Q2 Risk Assessment',
      description: 'Conduct comprehensive risk assessment for Q2 2024 including all identified risks',
      type: TaskType.RISK_ASSESSMENT,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      assigneeId: riskManagerUser.id,
      dueDate: new Date('2024-03-31'),
      estimatedHours: 16,
      riskId: createdRisks[0].id,
      organizationId: demoOrg.id,
      createdBy: adminUser.id,
    },
    {
      id: 'task-002',
      title: 'Test MFA Control Effectiveness',
      description: 'Perform quarterly testing of multi-factor authentication controls',
      type: TaskType.CONTROL_TESTING,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      assigneeId: riskManagerUser.id,
      dueDate: new Date('2024-02-15'),
      estimatedHours: 8,
      controlId: createdControls[0].id,
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
    {
      id: 'task-003',
      title: 'Review Compliance Documentation',
      description: 'Annual review of SOX compliance documentation and evidence',
      type: TaskType.DOCUMENT_REVIEW,
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      assigneeId: auditorUser.id,
      dueDate: new Date('2024-01-30'),
      completedAt: new Date('2024-01-28'),
      estimatedHours: 12,
      actualHours: 10,
      organizationId: demoOrg.id,
      createdBy: auditorUser.id,
    },
  ];

  const createdTasks = await Promise.all(
    tasks.map(task => prisma.task.create({ data: task }))
  );

  console.log('✅ Created tasks');

  // Create Workflows
  const workflow = await prisma.workflow.create({
    data: {
      id: 'workflow-001',
      name: 'Risk Assessment Approval Workflow',
      description: 'Standard approval workflow for risk assessments',
      type: WorkflowType.APPROVAL,
      steps: [
        {
          id: 'step1',
          name: 'Risk Manager Review',
          type: 'review',
          assignee: riskManagerUser.id,
          order: 1,
          status: 'completed'
        },
        {
          id: 'step2',
          name: 'Auditor Validation',
          type: 'approval',
          assignee: auditorUser.id,
          order: 2,
          status: 'in_progress'
        },
        {
          id: 'step3',
          name: 'Admin Final Approval',
          type: 'approval',
          assignee: adminUser.id,
          order: 3,
          status: 'pending'
        }
      ],
      status: WorkflowStatus.ACTIVE,
      priority: Priority.HIGH,
      relatedEntities: {
        risks: [createdRisks[0].id, createdRisks[1].id]
      },
      organizationId: demoOrg.id,
      createdBy: riskManagerUser.id,
    },
  });

  console.log('🔄 Created workflows');

  // Create Comments
  await prisma.comment.create({
    data: {
      content: 'This risk assessment looks comprehensive. I recommend we also consider supply chain risks.',
      authorId: auditorUser.id,
      entityType: EntityType.RISK,
      entityId: createdRisks[0].id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'MFA implementation is working well. Test results show 99.8% success rate.',
      authorId: riskManagerUser.id,
      entityType: EntityType.CONTROL,
      entityId: createdControls[0].id,
    },
  });

  console.log('💬 Created comments');

  // Create Notifications
  const notifications = [
    {
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: 'You have been assigned to complete Q2 Risk Assessment',
      userId: riskManagerUser.id,
      recipientId: riskManagerUser.id,
      actionUrl: '/tasks/task-001',
      relatedEntityType: 'task',
      relatedEntityId: createdTasks[0].id,
      priority: Priority.HIGH,
    },
    {
      type: NotificationType.WORKFLOW_UPDATE,
      title: 'Workflow Step Completed',
      message: 'Risk Manager Review step has been completed',
      userId: auditorUser.id,
      recipientId: auditorUser.id,
      actionUrl: '/workflows/workflow-001',
      relatedEntityType: 'workflow',
      relatedEntityId: workflow.id,
      priority: Priority.MEDIUM,
    },
  ];

  await Promise.all(
    notifications.map(notification => prisma.notification.create({ data: notification }))
  );

  console.log('🔔 Created notifications');

  // Create Activity Log entries
  const activities = [
    {
      type: ActivityType.CREATED,
      userId: riskManagerUser.id,
      entityType: EntityType.RISK,
      entityId: createdRisks[0].id,
      description: 'Created new cybersecurity risk assessment',
      isPublic: true,
      organizationId: demoOrg.id,
    },
    {
      type: ActivityType.UPDATED,
      userId: riskManagerUser.id,
      entityType: EntityType.CONTROL,
      entityId: createdControls[0].id,
      description: 'Updated MFA control effectiveness rating',
      metadata: { previousEffectiveness: 0.80, newEffectiveness: 0.85 },
      isPublic: true,
      organizationId: demoOrg.id,
    },
    {
      type: ActivityType.COMPLETED,
      userId: auditorUser.id,
      entityType: EntityType.TASK,
      entityId: createdTasks[2].id,
      description: 'Completed compliance documentation review',
      isPublic: true,
      organizationId: demoOrg.id,
    },
  ];

  await Promise.all(
    activities.map(activity => prisma.activity.create({ data: activity }))
  );

  console.log('📊 Created activity logs');

  // Create sample AI conversation logs
  await prisma.aIConversation.create({
    data: {
      userId: riskManagerUser.id,
      title: 'Cybersecurity Risk Analysis Discussion',
      agentType: 'risk_analyzer',
      messages: [
        {
          role: 'user',
          content: 'Can you help me analyze the cybersecurity risks for our financial services organization?',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'I\'d be happy to help analyze cybersecurity risks for your financial services organization. Based on industry patterns, key risks include...',
          timestamp: new Date()
        }
      ],
      context: {
        industry: 'financial_services',
        organizationSize: 'large'
      },
      tokenUsage: 1250,
      estimatedCost: 0.025,
      organizationId: demoOrg.id,
    },
  });

  console.log('🤖 Created AI conversation logs');

  // Create sample usage logs
  await prisma.aIUsageLog.create({
    data: {
      userId: riskManagerUser.id,
      requestType: 'risk_analysis',
      promptTokens: 450,
      completionTokens: 800,
      totalTokens: 1250,
      estimatedCost: 0.025,
      responseTime: 2500,
      success: true,
      organizationId: demoOrg.id,
    },
  });

  console.log('📈 Created AI usage logs');

  console.log('✅ Database seeding completed successfully!');
  console.log(`
🎉 Demo Environment Ready!

Organizations created:
  - Riscura Demo Corporation (${demoOrg.id})
  - TechStartup Inc. (${techStartup.id})

Demo Users created:
  - Admin: admin@riscura-demo.com / demo123
  - Risk Manager: riskmanager@riscura-demo.com / demo123
  - Auditor: auditor@riscura-demo.com / demo123
  - User: user@riscura-demo.com / demo123
  - Startup CEO: ceo@techstartup.com / demo123

Sample Data:
  - ${createdRisks.length} Risks
  - ${createdControls.length} Controls
  - ${createdDocuments.length} Documents
  - ${createdTasks.length} Tasks
  - 1 Questionnaire with responses
  - 1 Workflow
  - Comments, notifications, and activity logs

Ready for development and demo! 🚀
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 