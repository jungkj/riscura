import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import { db } from '@/lib/db';
import { RiskCategory, RiskStatus, ControlType, ControlCategory, AutomationLevel, EffectivenessRating, ControlStatus, Priority } from '@/types/rcsa.types';
import { EntityType, RiskLevel } from '@prisma/client';
import { riskSchema as baseRiskSchema, controlSchema as baseControlSchema } from '@/lib/validations';

// Extend base schemas for import-specific fields
const riskSchema = baseRiskSchema.extend({
  externalId: z.string(),
  category: z.nativeEnum(RiskCategory), // Override with enum
  status: z.nativeEnum(RiskStatus),
  rationale: z.string().optional(),
  owner: z.string().optional(), // Make optional for import
});

const controlSchema = baseControlSchema.extend({
  externalId: z.string(),
  type: z.nativeEnum(ControlType), // Override with enum
  category: z.nativeEnum(ControlCategory),
  automationLevel: z.nativeEnum(AutomationLevel),
  owner: z.string().optional(), // Make optional for import
  evidence: z.string().optional(),
  designEffectiveness: z.string().optional(),
  operatingEffectiveness: z.string().optional(),
  riskIds: z.array(z.string()),
  effectiveness: z.string().optional(), // Override to make optional
});

const importBodySchema = z.object({
  risks: z.array(riskSchema),
  controls: z.array(controlSchema),
  sourceFileName: z.string().optional(),
});

function mapEffectivenessRating(rating?: string): EffectivenessRating | undefined {
  if (!rating) return undefined;
  const lower = rating.toLowerCase();
  
  if (lower.includes('effective') && !lower.includes('non') && !lower.includes('partial')) {
    return EffectivenessRating.EFFECTIVE;
  }
  if (lower.includes('partial')) return EffectivenessRating.PARTIALLY_EFFECTIVE;
  if (lower.includes('non') || lower.includes('ineffective')) return EffectivenessRating.NOT_EFFECTIVE;
  
  return undefined;
}

function calculateEffectivenessScore(operatingEffectiveness?: string): number {
  const rating = mapEffectivenessRating(operatingEffectiveness);
  switch (rating) {
    case EffectivenessRating.EFFECTIVE:
      return 0.8;
    case EffectivenessRating.PARTIALLY_EFFECTIVE:
      return 0.5;
    case EffectivenessRating.NOT_EFFECTIVE:
      return 0.2;
    default:
      return 0.5; // Default to medium effectiveness
  }
}

export const POST = withApiMiddleware({
  requireAuth: true,
  bodySchema: importBodySchema,
  rateLimiters: ['standard'],
})(async (context, validatedData) => {
  const { risks, controls, sourceFileName } = validatedData;
  const { user, organizationId } = context;
  
  try {
    const result = await db.client.$transaction(async (prisma) => {
      const riskIdMap = new Map<string, string>();
      const createdRisks = [];
      const createdControls = [];
      const createdMappings = [];
      
      // Create or update risks
      for (const risk of risks) {
        const riskScore = risk.likelihood * risk.impact;
        let riskLevel: RiskLevel;
        
        if (riskScore <= 6) riskLevel = RiskLevel.LOW;
        else if (riskScore <= 12) riskLevel = RiskLevel.MEDIUM;
        else if (riskScore <= 20) riskLevel = RiskLevel.HIGH;
        else riskLevel = RiskLevel.CRITICAL;
        
        // Check if risk already exists
        const existingRisk = await prisma.risk.findFirst({
          where: {
            organizationId,
            OR: [
              { title: risk.title },
              { description: risk.description }
            ]
          }
        });
        
        let dbRisk;
        if (existingRisk) {
          // Update existing risk
          dbRisk = await prisma.risk.update({
            where: { id: existingRisk.id },
            data: {
              title: risk.title,
              description: risk.description,
              category: risk.category,
              likelihood: risk.likelihood,
              impact: risk.impact,
              riskScore,
              riskLevel,
              status: risk.status,
              owner: risk.owner,
              updatedAt: new Date(),
            }
          });
        } else {
          // Create new risk
          dbRisk = await prisma.risk.create({
            data: {
              title: risk.title,
              description: risk.description,
              category: risk.category,
              likelihood: risk.likelihood,
              impact: risk.impact,
              riskScore,
              riskLevel,
              status: risk.status,
              owner: risk.owner,
              organizationId,
              createdBy: user.id,
              dateIdentified: new Date(),
            }
          });
        }
        
        riskIdMap.set(risk.externalId, dbRisk.id);
        createdRisks.push(dbRisk);
        
        // Store extracted risk record for traceability
        await prisma.extractedRisk.create({
          data: {
            externalId: risk.externalId,
            text: `${risk.title}\n${risk.description}\n${risk.rationale || ''}`,
            sourceDocument: sourceFileName || 'RCSA Import',
            organizationId,
            extractedBy: user.id,
            confidence: 0.95, // High confidence since user approved
          }
        });
      }
      
      // Create or update controls
      for (const control of controls) {
        // Check if control already exists
        const existingControl = await prisma.control.findFirst({
          where: {
            organizationId,
            OR: [
              { title: control.title },
              { description: control.description }
            ]
          }
        });
        
        let dbControl;
        if (existingControl) {
          // Update existing control
          dbControl = await prisma.control.update({
            where: { id: existingControl.id },
            data: {
              title: control.title,
              description: control.description,
              type: control.type,
              category: control.category,
              frequency: control.frequency,
              automationLevel: control.automationLevel,
              owner: control.owner,
              effectivenessRating: mapEffectivenessRating(control.designEffectiveness),
              updatedAt: new Date(),
            }
          });
        } else {
          // Create new control
          dbControl = await prisma.control.create({
            data: {
              title: control.title,
              description: control.description,
              type: control.type,
              category: control.category,
              frequency: control.frequency,
              automationLevel: control.automationLevel,
              owner: control.owner,
              effectivenessRating: mapEffectivenessRating(control.designEffectiveness),
              status: ControlStatus.IMPLEMENTED,
              priority: Priority.MEDIUM,
              organizationId,
              createdBy: user.id,
            }
          });
        }
        
        createdControls.push(dbControl);
        
        // Store extracted control record for traceability
        await prisma.extractedControl.create({
          data: {
            externalId: control.externalId,
            text: `${control.title}\n${control.description}\n${control.evidence || ''}`,
            sourceDocument: sourceFileName || 'RCSA Import',
            organizationId,
            extractedBy: user.id,
            confidence: 0.95,
          }
        });
        
        // Create risk-control mappings
        for (const riskExternalId of control.riskIds) {
          const riskId = riskIdMap.get(riskExternalId);
          if (riskId) {
            // Check if mapping already exists
            const existingMapping = await prisma.controlRiskMapping.findUnique({
              where: {
                riskId_controlId: {
                  riskId,
                  controlId: dbControl.id,
                }
              }
            });
            
            if (!existingMapping) {
              const mapping = await prisma.controlRiskMapping.create({
                data: {
                  riskId,
                  controlId: dbControl.id,
                  effectiveness: calculateEffectivenessScore(control.operatingEffectiveness),
                }
              });
              createdMappings.push(mapping);
            }
          }
        }
      }
      
      // Create activity log
      await prisma.activity.create({
        data: {
          type: 'IMPORTED',
          entityType: 'RISK',
          entityId: createdRisks[0]?.id || 'bulk-import',
          description: `Imported ${createdRisks.length} risks and ${createdControls.length} controls from RCSA`,
          metadata: {
            sourceFile: sourceFileName,
            riskCount: createdRisks.length,
            controlCount: createdControls.length,
            mappingCount: createdMappings.length,
          },
          userId: user.id,
          organizationId,
        }
      });
      
      return {
        risks: createdRisks,
        controls: createdControls,
        mappings: createdMappings,
      };
    });
    
    return {
      success: true,
      data: {
        importedRisks: result.risks.length,
        importedControls: result.controls.length,
        createdMappings: result.mappings.length,
        message: `Successfully imported ${result.risks.length} risks and ${result.controls.length} controls`
      }
    };
    
  } catch (error) {
    console.error('RCSA import error:', error);
    return {
      success: false,
      error: 'Failed to import RCSA data to database'
    };
  }
});