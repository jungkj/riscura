// Production-safe demo mode controls
// Demo data should NEVER be served in production unless explicitly enabled

export const DEMO_MODE_CONFIG = {
  // Demo mode is only allowed in development unless explicitly enabled
  isDemoModeAllowed: () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const demoModeForced = process.env.FORCE_DEMO_MODE === 'true';
    
    // In production, only allow demo mode if explicitly forced via env var
    if (isProduction) {
      return demoModeForced;
    }
    
    // In development, demo mode is always allowed
    return true;
  },

  // Check if a user should get demo data
  shouldServeDemoData: (userId: string | undefined, organizationId: string | undefined): boolean => {
    if (!DEMO_MODE_CONFIG.isDemoModeAllowed()) {
      return false;
    }

    // Demo user IDs that should get demo data
    const demoUserIds = [
      'demo-admin-id',
      'cmcccirww0002hevoh09kjf0t' // Actual demo user from database
    ];

    // Demo organization IDs
    const demoOrgIds = [
      'demo-org-id', 
      'cmcccirkt0000hevoh09kjf0t' // Actual demo org from database
    ];

    return !!(
      (userId && demoUserIds.includes(userId)) || 
      (organizationId && demoOrgIds.includes(organizationId))
    );
  },

  // Get demo data warning for development
  getDemoDataWarning: () => {
    if (process.env.NODE_ENV === 'production' && process.env.FORCE_DEMO_MODE === 'true') {
      return 'WARNING: Demo mode is enabled in production!';
    }
    if (process.env.NODE_ENV !== 'production') {
      return 'Development: Demo data active';
    }
    return null;
  }
};

export const isDemoUser = (userId: string): boolean => {
  return DEMO_MODE_CONFIG.shouldServeDemoData(userId, undefined);
};

export const isDemoOrganization = (organizationId: string): boolean => {
  return DEMO_MODE_CONFIG.shouldServeDemoData(undefined, organizationId);
};

export const shouldServeDemoData = (userId?: string, organizationId?: string): boolean => {
  return DEMO_MODE_CONFIG.shouldServeDemoData(userId, organizationId);
};