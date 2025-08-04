// import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type Risk = Tables['risks']['Row'];
type Control = Tables['controls']['Row'];
type Document = Tables['documents']['Row'];
type Activity = Tables['activities']['Row'];
type Organization = Tables['organizations']['Row'];
type User = Tables['users']['Row'];

export interface RealTimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealTimeCallbacks {
  onRiskChange?: (payload: RealtimePostgresChangesPayload<Risk>) => void;
  onControlChange?: (payload: RealtimePostgresChangesPayload<Control>) => void;
  onDocumentChange?: (payload: RealtimePostgresChangesPayload<Document>) => void;
  onActivityChange?: (payload: RealtimePostgresChangesPayload<Activity>) => void;
  onUserChange?: (payload: RealtimePostgresChangesPayload<User>) => void;
  onOrganizationChange?: (payload: RealtimePostgresChangesPayload<Organization>) => void;
}

export class RealTimeDataService {
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private organizationId: string | null = null;

  constructor(organizationId?: string) {
    this.organizationId = organizationId || null;
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  /**
   * Subscribe to real-time changes for an organization
   */
  subscribeToOrganization(_organizationId: string,
    callbacks: RealTimeCallbacks
  ): RealTimeSubscription {
    const channelName = `org-${organizationId}`

    // Remove existing subscription if any
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'risks',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          // console.log('Risk change:', payload)
          callbacks.onRiskChange?.(payload as RealtimePostgresChangesPayload<Risk>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'controls',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          // console.log('Control change:', payload)
          callbacks.onControlChange?.(payload as RealtimePostgresChangesPayload<Control>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          // console.log('Document change:', payload)
          callbacks.onDocumentChange?.(payload as RealtimePostgresChangesPayload<Document>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          // console.log('Activity change:', payload)
          callbacks.onActivityChange?.(payload as RealtimePostgresChangesPayload<Activity>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          // console.log('User change:', payload)
          callbacks.onUserChange?.(payload as RealtimePostgresChangesPayload<User>);
        }
      )
      .subscribe();

    const subscription: RealTimeSubscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    }

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to specific table changes
   */
  subscribeToTable<T extends keyof Tables>(_table: T,
    organizationId: string,
    callback: (payload: RealtimePostgresChangesPayload<DaisyTables[T]['Row']>) => void
  ): RealTimeSubscription {
    const channelName = `${table}-${organizationId}`;

    // Remove existing subscription if any
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
          filter: `organizationId=eq.${organizationId}`,
        },
        callback as any
      )
      .subscribe();

    const subscription: RealTimeSubscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    }

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // ============================================================================
  // DATA OPERATIONS
  // ============================================================================

  /**
   * Get risks with real-time subscription
   */
  async getRisks(_organizationId: string): Promise<Risk[]> {
    const { data, error } = await supabase
      .from('risks')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false })

    if (error) {
      // console.error('Error fetching risks:', error)
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new risk
   */
  async createRisk(_risk: Tables['risks']['Insert']): Promise<Risk> {
    const { data, error } = await supabase.from('risks').insert(risk).select().single();

    if (error) {
      // console.error('Error creating risk:', error)
      throw error;
    }

    // Log activity
    await this.logActivity({
      type: 'RISK_CREATED',
      description: `Risk "${risk.title}" was created`,
      entityType: 'RISK',
      entityId: data.id,
      userId: risk.createdBy!,
      organizationId: risk.organizationId,
    })

    return data;
  }

  /**
   * Update a risk
   */
  async updateRisk(id: string, updates: Tables['risks']['Update']): Promise<Risk> {
    const { data, error } = await supabase
      .from('risks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // console.error('Error updating risk:', error)
      throw error;
    }

    return data;
  }

  /**
   * Delete a risk
   */
  async deleteRisk(id: string): Promise<void> {
    const { error } = await supabase.from('risks').delete().eq('id', id);

    if (error) {
      // console.error('Error deleting risk:', error)
      throw error;
    }
  }

  /**
   * Get controls with real-time subscription
   */
  async getControls(_organizationId: string): Promise<Control[]> {
    const { data, error } = await supabase
      .from('controls')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) {
      // console.error('Error fetching controls:', error)
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new control
   */
  async createControl(control: Tables['controls']['Insert']): Promise<Control> {
    const { data, error } = await supabase.from('controls').insert(control).select().single();

    if (error) {
      // console.error('Error creating control:', error)
      throw error;
    }

    // Log activity
    await this.logActivity({
      type: 'CONTROL_CREATED',
      description: `Control "${control.title}" was created`,
      entityType: 'CONTROL',
      entityId: data.id,
      userId: control.createdBy!,
      organizationId: control.organizationId,
    })

    return data;
  }

  /**
   * Update a control
   */
  async updateControl(id: string, updates: Tables['controls']['Update']): Promise<Control> {
    const { data, error } = await supabase
      .from('controls')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // console.error('Error updating control:', error)
      throw error;
    }

    return data;
  }

  /**
   * Get documents
   */
  async getDocuments(_organizationId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) {
      // console.error('Error fetching documents:', error)
      throw error;
    }

    return data || [];
  }

  /**
   * Get recent activities
   */
  async getActivities(_organizationId: string, limit: number = 50): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      // console.error('Error fetching activities:', error)
      throw error;
    }

    return data || [];
  }

  /**
   * Log an activity
   */
  async logActivity(activity: Tables['activities']['Insert']): Promise<Activity> {
    const { data, error } = await supabase.from('activities').insert(activity).select().single();

    if (error) {
      // console.error('Error logging activity:', error)
      throw error;
    }

    return data;
  }

  /**
   * Get organization data
   */
  async getOrganization(_organizationId: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) {
      // console.error('Error fetching organization:', error)
      throw error;
    }

    return data;
  }

  /**
   * Get users in organization
   */
  async getUsers(_organizationId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isActive', true)
      .order('firstName', { ascending: true });

    if (error) {
      // console.error('Error fetching users:', error)
      throw error;
    }

    return data || [];
  }

  // ============================================================================
  // ANALYTICS & METRICS
  // ============================================================================

  /**
   * Get risk metrics for dashboard
   */
  async getRiskMetrics(_organizationId: string) {
    const { data: risks, error } = await supabase
      .from('risks')
      .select('*')
      .eq('organizationId', organizationId)

    if (error) {
      // console.error('Error fetching risk metrics:', error)
      throw error;
    }

    const total = risks?.length || 0;
    const critical = risks?.filter((r) => r.riskLevel === 'CRITICAL').length || 0;
    const high = risks?.filter((r) => r.riskLevel === 'HIGH').length || 0;
    const medium = risks?.filter((r) => r.riskLevel === 'MEDIUM').length || 0;
    const low = risks?.filter((r) => r.riskLevel === 'LOW').length || 0;

    const byStatus =
      risks?.reduce(
        (acc, risk) => {
          acc[risk.status] = (acc[risk.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {}

    const byCategory =
      risks?.reduce(
        (acc, risk) => {
          acc[risk.category] = (acc[risk.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {}

    return {
      total,
      byLevel: { critical, high, medium, low },
      byStatus,
      byCategory,
      averageScore: risks?.reduce((sum, r) => sum + r.riskScore, 0) / total || 0,
    }
  }

  /**
   * Get control metrics for dashboard
   */
  async getControlMetrics(_organizationId: string) {
    const { data: controls, error } = await supabase
      .from('controls')
      .select('*')
      .eq('organizationId', organizationId);

    if (error) {
      // console.error('Error fetching control metrics:', error)
      throw error;
    }

    const total = controls?.length || 0;
    const active = controls?.filter((c) => c.status === 'ACTIVE').length || 0;
    const effective = controls?.filter((c) => c.effectiveness === 'FULLY_EFFECTIVE').length || 0;

    const byType =
      controls?.reduce(
        (acc, control) => {
          acc[control.type] = (acc[control.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {}

    const byCategory =
      controls?.reduce(
        (acc, control) => {
          acc[control.category] = (acc[control.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {}

    const byEffectiveness =
      controls?.reduce(
        (acc, control) => {
          if (control.effectiveness) {
            acc[control.effectiveness] = (acc[control.effectiveness] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      ) || {}

    return {
      total,
      active,
      effective,
      effectivenessRate: total > 0 ? (effective / total) * 100 : 0,
      byType,
      byCategory,
      byEffectiveness,
    }
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService()

export default RealTimeDataService;
