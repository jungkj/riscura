# Phase 1.7: Compliance Framework Integration - Setup Guide

## Overview

This phase implements a comprehensive compliance framework integration system for the Riscura RCSA platform, providing automated control mapping, gap analysis, evidence collection, and AI-powered compliance intelligence.

## 🚀 Features Implemented

### Core Features
- ✅ **Pre-built Compliance Frameworks**: SOX, ISO 27001, NIST CSF, GDPR, COSO, SOC 2, PCI DSS, HIPAA
- ✅ **Automated Control Mapping**: AI-powered mapping of organizational controls to framework requirements
- ✅ **Compliance Gap Analysis**: Comprehensive gap identification with remediation recommendations
- ✅ **Evidence Collection & Management**: Automated evidence gathering and audit preparation
- ✅ **Regulatory Change Monitoring**: Automated monitoring of regulatory updates and impact assessment
- ✅ **Compliance Scoring & Maturity Assessment**: Quantitative compliance measurement
- ✅ **Control Testing Schedules**: Automated control testing and effectiveness monitoring
- ✅ **Remediation Tracking**: End-to-end remediation workflow management
- ✅ **Vendor Risk Assessment Integration**: Third-party risk assessment capabilities
- ✅ **Third-party Audit Support**: Comprehensive audit package generation

### AI Features
- ✅ **Intelligent Framework Mapping**: AI-powered semantic analysis for control-to-requirement mapping
- ✅ **Regulatory Interpretation & Guidance**: Natural language processing for regulatory interpretation
- ✅ **Automated Compliance Monitoring**: Continuous monitoring with intelligent alerting
- ✅ **Risk-based Control Prioritization**: AI-driven prioritization based on risk and impact analysis
- ✅ **Natural Language Compliance Queries**: ChatGPT-style interface for compliance questions

## 📁 Files Created

### Core Framework Management
- `src/lib/compliance/frameworks.ts` - Framework definitions and management
- `src/lib/compliance/mapping.ts` - Automated control mapping engine
- `src/lib/compliance/evidence.ts` - Evidence collection and audit preparation
- `src/lib/compliance/ai-intelligence.ts` - AI-powered compliance intelligence

### API Endpoints
- `src/app/api/compliance/frameworks/route.ts` - Framework management API
- `src/app/api/compliance/mapping/route.ts` - Control mapping and gap analysis API
- `src/app/api/compliance/ai/route.ts` - AI intelligence API

### UI Components
- `src/components/compliance/ComplianceDashboard.tsx` - Comprehensive compliance dashboard
- `src/lib/auth/validate.ts` - Request validation utility

## 🛠 Installation Steps

### 1. Install Dependencies

```bash
# Core compliance dependencies (already installed in previous phases)
npm install recharts date-fns

# Additional dependencies for compliance features
npm install @types/node-cron node-cron
```

### 2. Database Schema Updates

Add the following tables to your Prisma schema (update `prisma/schema.prisma`):

```prisma
model ComplianceFramework {
  id          String   @id @default(cuid())
  name        String
  description String
  version     String
  type        String   // 'regulatory' | 'standard' | 'guideline' | 'internal'
  industry    String[]
  geography   String[]
  mandatory   Boolean  @default(false)
  isActive    Boolean  @default(true)
  source      String
  website     String?
  lastUpdated DateTime @default(now())
  
  domains            ComplianceDomain[]
  requirements       ComplianceRequirement[]
  controlObjectives  ControlObjective[]
  mappings           FrameworkMapping[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ComplianceDomain {
  id          String @id @default(cuid())
  name        String
  description String
  category    String
  weight      Float
  requirements String[]
  
  frameworkId String
  framework   ComplianceFramework @relation(fields: [frameworkId], references: [id], onDelete: Cascade)
}

model ComplianceRequirement {
  id          String   @id @default(cuid())
  code        String
  title       String
  description String
  category    String
  subcategory String?
  priority    String   // 'low' | 'medium' | 'high' | 'critical'
  mandatory   Boolean  @default(false)
  testable    Boolean  @default(true)
  frequency   String   // 'annual' | 'quarterly' | 'monthly' | 'continuous'
  evidenceTypes String[]
  controlObjectives String[]
  relatedRequirements String[]
  tags        String[]
  
  frameworkId String
  framework   ComplianceFramework @relation(fields: [frameworkId], references: [id], onDelete: Cascade)
  domainId    String
  
  controlMappings ControlMapping[]
  evidence        ComplianceEvidence[]
}

model ControlMapping {
  id             String   @id @default(cuid())
  controlId      String
  frameworkId    String
  requirementId  String
  mappingType    String   // 'direct' | 'partial' | 'inherited' | 'compensating'
  coverage       Int      // 0-100%
  confidence     Float    // 0-1
  automated      Boolean  @default(false)
  verifiedBy     String?
  verifiedAt     DateTime?
  notes          String?
  evidenceRequired String[]
  testingRequired String[]
  deficiencies   String[]
  recommendations String[]
  lastAssessed   DateTime @default(now())
  nextAssessment DateTime
  organizationId String
  
  control     Control             @relation(fields: [controlId], references: [id], onDelete: Cascade)
  requirement ComplianceRequirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ComplianceEvidence {
  id             String   @id @default(cuid())
  controlId      String
  frameworkId    String
  requirementId  String
  title          String
  description    String
  type           String   // 'document' | 'screenshot' | 'report' | 'certificate' | 'test-result' | 'log' | 'configuration' | 'other'
  category       String   // 'policy' | 'procedure' | 'testing' | 'monitoring' | 'training' | 'technical' | 'management' | 'operational'
  status         String   @default("draft") // 'draft' | 'pending-review' | 'approved' | 'expired' | 'rejected'
  file           Json     // {filename, path, size, mimeType, hash}
  metadata       Json     // {source, author, reviewer, effectiveDate, expirationDate, version, tags, confidentiality}
  auditTrail     Json[]   // Array of audit entries
  organizationId String
  createdBy      String
  
  control      Control      @relation(fields: [controlId], references: [id], onDelete: Cascade)
  requirement  ComplianceRequirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  creator      User         @relation(fields: [createdBy], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ComplianceQuery {
  id         String   @id @default(cuid())
  query      String
  intent     String   // 'framework-search' | 'requirement-lookup' | 'control-mapping' | 'gap-analysis' | 'interpretation' | 'recommendation'
  context    Json     // {organizationId, frameworks, industry, geography, riskProfile}
  response   Json     // ComplianceQueryResponse
  confidence Float
  timestamp  DateTime @default(now())
  userId     String
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RegulatoryUpdate {
  id                  String   @id @default(cuid())
  frameworkId         String
  updateType          String   // 'requirement-added' | 'requirement-modified' | 'requirement-removed' | 'guidance-updated' | 'deadline-changed'
  title               String
  description         String
  effectiveDate       DateTime
  impactLevel         String   // 'low' | 'medium' | 'high' | 'critical'
  affectedRequirements String[]
  recommendedActions  Json[]   // Array of ComplianceAction
  source              String
  sourceUrl           String?
  isProcessed         Boolean  @default(false)
  organizationImpact  Json?    // OrganizationImpact
  
  createdAt DateTime @default(now())
}

model ComplianceInsight {
  id             String   @id @default(cuid())
  type           String   // 'risk-based-prioritization' | 'control-optimization' | 'regulatory-interpretation' | 'trend-analysis' | 'benchmark-comparison'
  title          String
  description    String
  organizationId String
  frameworkId    String?
  confidence     Float
  severity       String   // 'info' | 'warning' | 'critical'
  data           Json
  recommendations Json[]  // Array of ComplianceAction
  validUntil     DateTime?
  generatedAt    DateTime @default(now())
  isActive       Boolean  @default(true)
  
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

### 3. Run Database Migration

```bash
npx prisma db push
# or
npx prisma migrate dev --name add-compliance-framework
```

### 4. Initialize Compliance Frameworks

Add a script to initialize the pre-built frameworks:

```typescript
// scripts/init-compliance.ts
import { complianceFrameworkManager } from '@/lib/compliance/frameworks';

async function initializeCompliance() {
  console.log('Initializing compliance frameworks...');
  
  try {
    await complianceFrameworkManager.initializeFrameworks();
    console.log('✅ Compliance frameworks initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize compliance frameworks:', error);
  }
}

if (require.main === module) {
  initializeCompliance();
}
```

Run the initialization:

```bash
npx tsx scripts/init-compliance.ts
```

### 5. Update Navigation

Add compliance routes to your navigation (update your layout or navigation component):

```typescript
// Add to your navigation menu
{
  title: 'Compliance',
  icon: Shield,
  href: '/dashboard/compliance',
  children: [
    { title: 'Overview', href: '/dashboard/compliance' },
    { title: 'Frameworks', href: '/dashboard/compliance/frameworks' },
    { title: 'Gap Analysis', href: '/dashboard/compliance/gaps' },
    { title: 'Evidence', href: '/dashboard/compliance/evidence' },
    { title: 'AI Assistant', href: '/dashboard/compliance/ai' },
  ],
}
```

## 🔧 Configuration

### Environment Variables

Add to your `.env.local`:

```env
# Compliance Configuration
COMPLIANCE_AI_ENABLED=true
COMPLIANCE_AUTO_MAPPING=true
COMPLIANCE_MONITORING_ENABLED=true

# Regulatory Monitoring (optional - for production)
REGULATORY_API_KEY=your_regulatory_monitoring_api_key
REGULATORY_WEBHOOK_SECRET=your_webhook_secret
```

### Customization Options

1. **Framework Configuration**: Modify framework definitions in `src/lib/compliance/frameworks.ts`
2. **Mapping Algorithm**: Adjust confidence thresholds and weights in `src/lib/compliance/mapping.ts`
3. **AI Intelligence**: Customize NLP patterns and response templates in `src/lib/compliance/ai-intelligence.ts`
4. **Evidence Types**: Configure evidence collection rules in `src/lib/compliance/evidence.ts`

## 📚 Usage Examples

### 1. Perform Automated Control Mapping

```typescript
import { complianceMappingEngine } from '@/lib/compliance/mapping';

// Map controls to SOX and ISO 27001
const mappings = await complianceMappingEngine.performAutomatedMapping(
  'org_123',
  ['sox-2002', 'iso-27001-2022']
);
```

### 2. Generate Gap Analysis

```typescript
import { complianceMappingEngine } from '@/lib/compliance/mapping';

// Perform gap analysis for GDPR
const gapAnalysis = await complianceMappingEngine.performGapAnalysis(
  'org_123',
  'gdpr-2018',
  true // Include recommendations
);
```

### 3. AI Compliance Query

```typescript
import { complianceAIIntelligence } from '@/lib/compliance/ai-intelligence';

// Ask natural language compliance question
const response = await complianceAIIntelligence.processComplianceQuery(
  "What controls do I need for SOX Section 404?",
  {
    organizationId: 'org_123',
    frameworks: ['sox-2002'],
    industry: 'financial',
    geography: 'US',
  },
  'user_123'
);
```

### 4. Create Evidence Request

```typescript
import { complianceEvidenceManager } from '@/lib/compliance/evidence';

// Request evidence for a control
const request = await complianceEvidenceManager.createEvidenceRequest({
  controlId: 'control_123',
  frameworkId: 'sox-2002',
  requirementId: 'sox-404',
  title: 'Access Control Testing Evidence',
  description: 'Provide evidence of access control testing procedures',
  evidenceTypes: ['test-result', 'documentation'],
  priority: 'high',
  dueDate: new Date('2024-03-31'),
  assignedTo: ['user_456'],
  status: 'open',
  instructions: 'Please provide test results and documentation',
  examples: ['Previous test reports', 'Control documentation'],
  organizationId: 'org_123',
  requestedBy: 'user_123',
});
```

## 🎯 API Endpoints

### Framework Management
- `GET /api/compliance/frameworks` - List frameworks with filters
- `POST /api/compliance/frameworks` - Initialize frameworks

### Control Mapping
- `POST /api/compliance/mapping` - Perform automated mapping or gap analysis

### AI Intelligence
- `POST /api/compliance/ai` - Process compliance queries and generate insights

## 🚀 Getting Started

1. **Initialize Frameworks**: Run the initialization script to set up pre-built frameworks
2. **Import Controls**: Ensure your existing controls are properly categorized and documented
3. **Run Automated Mapping**: Use the API to map controls to framework requirements
4. **Review Mappings**: Verify and adjust automated mappings as needed
5. **Perform Gap Analysis**: Identify compliance gaps and generate remediation plans
6. **Set Up Evidence Collection**: Configure automated evidence collection workflows
7. **Enable AI Monitoring**: Activate AI-powered compliance monitoring and insights

## 🔍 Features in Detail

### Pre-built Frameworks

The system includes comprehensive definitions for major compliance frameworks:

- **SOX (Sarbanes-Oxley Act)**: Financial reporting controls for public companies
- **ISO 27001**: Information security management system requirements
- **NIST Cybersecurity Framework**: Comprehensive cybersecurity guidance
- **GDPR**: European data protection and privacy regulation
- **COSO**: Internal control framework
- **SOC 2**: Trust services criteria for service organizations
- **PCI DSS**: Payment card industry data security standards
- **HIPAA**: Healthcare information protection requirements

### Automated Control Mapping

The AI-powered mapping engine:
- Uses semantic analysis to match controls to requirements
- Calculates confidence scores and coverage percentages
- Identifies mapping types (direct, partial, inherited, compensating)
- Generates evidence and testing requirements
- Provides recommendations for improvement

### Gap Analysis

Comprehensive gap analysis provides:
- Coverage percentage across frameworks
- Maturity scoring based on control effectiveness
- Risk-based gap prioritization
- Remediation timeline and effort estimates
- Cost-benefit analysis for gap closure
- Strategic recommendations

### Evidence Management

The evidence system supports:
- Automated evidence collection from multiple sources
- Evidence lifecycle management with expiration tracking
- Audit package generation with multiple deliverable types
- Chain of custody and audit trail maintenance
- Integration with document management systems

### AI Intelligence

The AI system provides:
- Natural language query processing with intent classification
- Regulatory interpretation and guidance
- Automated compliance monitoring and alerting
- Risk-based control prioritization
- Trend analysis and benchmarking
- Predictive compliance insights

## 🔒 Security Considerations

- All compliance data is encrypted at rest and in transit
- Role-based access control for sensitive compliance information
- Comprehensive audit trails for all compliance activities
- Evidence integrity verification with cryptographic hashing
- Secure API endpoints with proper authentication and authorization

## 📈 Monitoring and Metrics

The system tracks key compliance metrics:
- Overall compliance score across frameworks
- Control effectiveness and maturity levels
- Gap resolution rates and timelines
- Evidence collection completeness
- Audit readiness scores
- Regulatory change impact assessments

## 🔧 Troubleshooting

### Common Issues

1. **Framework initialization fails**: Check database connectivity and schema
2. **Mapping confidence low**: Review control descriptions and categorization
3. **Evidence collection errors**: Verify source system connectivity and permissions
4. **AI queries timeout**: Check system resources and query complexity

### Performance Optimization

- Use database indexing for compliance queries
- Implement caching for framework data
- Optimize control mapping algorithms for large datasets
- Use background jobs for evidence collection
- Monitor API response times and optimize queries

## 🚀 Next Steps

After implementing the compliance framework integration:

1. **Training**: Train your team on the new compliance features
2. **Customization**: Adapt frameworks and controls to your specific needs
3. **Integration**: Connect with external regulatory monitoring services
4. **Automation**: Set up automated workflows for routine compliance tasks
5. **Reporting**: Configure executive compliance dashboards and reports

This completes the implementation of Phase 1.7: Compliance Framework Integration, providing a comprehensive, AI-powered compliance management system for the Riscura RCSA platform. 