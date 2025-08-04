export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          settings: Json | null;
          plan: string;
          stripeCustomerId: string | null;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        }
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          settings?: Json | null;
          plan?: string;
          stripeCustomerId?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        }
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          settings?: Json | null;
          plan?: string;
          stripeCustomerId?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        }
      }
      users: {
        Row: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          passwordHash: string | null;
          avatar: string | null;
          phoneNumber: string | null;
          role: 'ADMIN' | 'RISK_MANAGER' | 'AUDITOR' | 'USER';
          permissions: string[];
          isActive: boolean;
          emailVerified: string | null;
          emailVerificationToken: string | null;
          emailVerificationExpires: string | null;
          passwordResetToken: string | null;
          passwordResetExpires: string | null;
          lastLogin: string | null;
          organizationId: string;
          createdAt: string;
          updatedAt: string;
        }
        Insert: {
          id?: string;
          email: string;
          firstName: string;
          lastName: string;
          passwordHash?: string | null;
          avatar?: string | null;
          phoneNumber?: string | null;
          role?: 'ADMIN' | 'RISK_MANAGER' | 'AUDITOR' | 'USER';
          permissions?: string[];
          isActive?: boolean;
          emailVerified?: string | null;
          emailVerificationToken?: string | null;
          emailVerificationExpires?: string | null;
          passwordResetToken?: string | null;
          passwordResetExpires?: string | null;
          lastLogin?: string | null;
          organizationId: string;
          createdAt?: string;
          updatedAt?: string;
        }
        Update: {
          id?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          passwordHash?: string | null;
          avatar?: string | null;
          phoneNumber?: string | null;
          role?: 'ADMIN' | 'RISK_MANAGER' | 'AUDITOR' | 'USER';
          permissions?: string[];
          isActive?: boolean;
          emailVerified?: string | null;
          emailVerificationToken?: string | null;
          emailVerificationExpires?: string | null;
          passwordResetToken?: string | null;
          passwordResetExpires?: string | null;
          lastLogin?: string | null;
          organizationId?: string;
          createdAt?: string;
          updatedAt?: string;
        }
      }
      risks: {
        Row: {
          id: string;
          title: string;
          description: string;
          category:
            | 'OPERATIONAL'
            | 'FINANCIAL'
            | 'STRATEGIC'
            | 'COMPLIANCE'
            | 'TECHNOLOGY'
            | 'REPUTATIONAL';
          likelihood: number;
          impact: number;
          riskScore: number;
          riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
          owner: string | null;
          status: 'IDENTIFIED' | 'ASSESSED' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED' | 'AVOIDED';
          dateIdentified: string | null;
          lastAssessed: string | null;
          nextReview: string | null;
          aiConfidence: number | null;
          organizationId: string;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description: string;
          category:
            | 'OPERATIONAL'
            | 'FINANCIAL'
            | 'STRATEGIC'
            | 'COMPLIANCE'
            | 'TECHNOLOGY'
            | 'REPUTATIONAL';
          likelihood?: number;
          impact?: number;
          riskScore?: number;
          riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
          owner?: string | null;
          status?: 'IDENTIFIED' | 'ASSESSED' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED' | 'AVOIDED';
          dateIdentified?: string | null;
          lastAssessed?: string | null;
          nextReview?: string | null;
          aiConfidence?: number | null;
          organizationId: string;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?:
            | 'OPERATIONAL'
            | 'FINANCIAL'
            | 'STRATEGIC'
            | 'COMPLIANCE'
            | 'TECHNOLOGY'
            | 'REPUTATIONAL';
          likelihood?: number;
          impact?: number;
          riskScore?: number;
          riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
          owner?: string | null;
          status?: 'IDENTIFIED' | 'ASSESSED' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED' | 'AVOIDED';
          dateIdentified?: string | null;
          lastAssessed?: string | null;
          nextReview?: string | null;
          aiConfidence?: number | null;
          organizationId?: string;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string | null;
        }
      }
      controls: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'DIRECTIVE' | 'COMPENSATING';
          category: 'TECHNICAL' | 'ADMINISTRATIVE' | 'PHYSICAL';
          status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
          effectiveness:
            | 'NOT_EFFECTIVE'
            | 'PARTIALLY_EFFECTIVE'
            | 'LARGELY_EFFECTIVE'
            | 'FULLY_EFFECTIVE'
            | null;
          automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
          testingFrequency: string | null;
          lastTested: string | null;
          nextTest: string | null;
          owner: string | null;
          organizationId: string;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'DIRECTIVE' | 'COMPENSATING';
          category: 'TECHNICAL' | 'ADMINISTRATIVE' | 'PHYSICAL';
          status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
          effectiveness?:
            | 'NOT_EFFECTIVE'
            | 'PARTIALLY_EFFECTIVE'
            | 'LARGELY_EFFECTIVE'
            | 'FULLY_EFFECTIVE'
            | null;
          automationLevel?: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
          testingFrequency?: string | null;
          lastTested?: string | null;
          nextTest?: string | null;
          owner?: string | null;
          organizationId: string;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string;
          type?: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'DIRECTIVE' | 'COMPENSATING';
          category?: 'TECHNICAL' | 'ADMINISTRATIVE' | 'PHYSICAL';
          status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
          effectiveness?:
            | 'NOT_EFFECTIVE'
            | 'PARTIALLY_EFFECTIVE'
            | 'LARGELY_EFFECTIVE'
            | 'FULLY_EFFECTIVE'
            | null;
          automationLevel?: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
          testingFrequency?: string | null;
          lastTested?: string | null;
          nextTest?: string | null;
          owner?: string | null;
          organizationId?: string;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string | null;
        }
      }
      documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          fileName: string;
          filePath: string;
          fileSize: number;
          mimeType: string;
          version: number;
          isLatest: boolean;
          uploadedBy: string;
          organizationId: string;
          createdAt: string;
          updatedAt: string;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          fileName: string;
          filePath: string;
          fileSize: number;
          mimeType: string;
          version?: number;
          isLatest?: boolean;
          uploadedBy: string;
          organizationId: string;
          createdAt?: string;
          updatedAt?: string;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          fileName?: string;
          filePath?: string;
          fileSize?: number;
          mimeType?: string;
          version?: number;
          isLatest?: boolean;
          uploadedBy?: string;
          organizationId?: string;
          createdAt?: string;
          updatedAt?: string;
        }
      }
      activities: {
        Row: {
          id: string;
          type: string;
          description: string;
          entityType: string | null;
          entityId: string | null;
          metadata: Json | null;
          userId: string;
          organizationId: string;
          createdAt: string;
        }
        Insert: {
          id?: string;
          type: string;
          description: string;
          entityType?: string | null;
          entityId?: string | null;
          metadata?: Json | null;
          userId: string;
          organizationId: string;
          createdAt?: string;
        }
        Update: {
          id?: string;
          type?: string;
          description?: string;
          entityType?: string | null;
          entityId?: string | null;
          metadata?: Json | null;
          userId?: string;
          organizationId?: string;
          createdAt?: string;
        }
      }
    }
    Views: {
      [_ in never]: never;
    }
    Functions: {
      [_ in never]: never;
    }
    Enums: {
      [_ in never]: never;
    }
    CompositeTypes: {
      [_ in never]: never;
    }
  }
}
