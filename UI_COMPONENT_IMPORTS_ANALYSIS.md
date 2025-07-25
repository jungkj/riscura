# UI Component Imports Analysis

## Summary

Total unique files importing UI components: ~260 files

### Import Counts by Component

| Component | Import Count | Import Path |
|-----------|--------------|-------------|
| Button | 259 | `@/components/ui/button` |
| Card | 235 | `@/components/ui/card` |
| Badge | 233 | `@/components/ui/badge` |
| Progress | 106 | `@/components/ui/progress` |
| Input | 103 | `@/components/ui/input` |
| Select | 94 | `@/components/ui/select` |
| Alert | 53 | `@/components/ui/alert` |
| Dialog | 45 | `@/components/ui/dialog` |
| Checkbox | 39 | `@/components/ui/checkbox` |

## Files by Component

### Button Component (259 imports)
Files importing from `@/components/ui/button`:

**App Directory:**
- `/src/app/page.tsx`
- `/src/app/contact/page.tsx`
- `/src/app/oauth-test/page.tsx`
- `/src/app/oauth-debug/page.tsx`
- `/src/app/test-oauth/page.tsx`
- `/src/app/test-login/page.tsx`
- `/src/app/auth/error/page.tsx`
- `/src/app/auth/forgot-password/page.tsx`
- `/src/app/billing/upgrade/page.tsx`
- `/src/app/(dashboard)/rcsa/page.tsx`
- `/src/app/dashboard/templates/page.tsx`
- `/src/app/dashboard/help/page.tsx`
- `/src/app/dashboard/data/import/page.tsx`
- `/src/app/dashboard/analytics/page.tsx`
- `/src/app/dashboard/analytics/trends/page.tsx`
- `/src/app/dashboard/aria/page.tsx`
- `/src/app/dashboard/compliance/gaps/page.tsx`
- `/src/app/dashboard/controls/mapping/page.tsx`
- `/src/app/dashboard/controls/testing/page.tsx`
- `/src/app/dashboard/import/page.tsx`
- `/src/app/dashboard/probo/page.tsx`
- `/src/app/dashboard/quick-actions/page.tsx`
- `/src/app/dashboard/risks/create/page.tsx`
- `/src/app/dashboard/risks/new/page.tsx`
- `/src/app/dashboard/risks/assessment/page.tsx`
- `/src/app/dashboard/risks/assessment/new/page.tsx`
- `/src/app/dashboard/risks/assessment/[id]/page.tsx`
- `/src/app/dashboard/risks/assessment/[id]/edit/page.tsx`
- `/src/app/dashboard/risks/heatmap/page.tsx`
- `/src/app/dashboard/risks/monitoring/page.tsx`
- `/src/app/dashboard/spreadsheets/page.tsx`
- `/src/app/dashboard/team/chat/page.tsx`
- `/src/app/dashboard/team/delegate/page.tsx`
- `/src/app/dashboard/team/notifications/page.tsx`
- `/src/app/dashboard/workflows/compliance-review/framework/page.tsx`
- `/src/app/dashboard/workflows/risk-assessment/report/page.tsx`
- `/src/app/dashboard/workflows/risk-assessment/controls/page.tsx`
- `/src/app/dashboard/workflows/risk-assessment/update/page.tsx`
- `/src/app/dashboard/workflows/risk-assessment/new/page.tsx`
- `/src/app/dashboard/assessments/self/page.tsx`
- `/src/app/dashboard/assessments/third-party/page.tsx`

**Pages Directory:**
- `/src/pages/dashboard/DashboardPage.tsx`
- `/src/pages/dashboard/questionnaires/QuestionnairesPage.tsx`
- `/src/pages/dashboard/questionnaires/CollaborativeQuestionnairePage.tsx`
- `/src/pages/dashboard/reporting/ReportingPage.tsx`
- `/src/pages/documents/DocumentAnalysisPage.tsx`
- `/src/pages/ai/DocumentAnalysisPage.tsx`
- `/src/pages/ai/AIInsightsPage.tsx`
- `/src/pages/controls/ControlLibraryPage.tsx`
- `/src/pages/controls/EnhancedControlRegistry.tsx`
- `/src/pages/probo/index.tsx`
- `/src/pages/LandingPage.tsx`
- `/src/pages/workflows/WorkflowPage.tsx`
- `/src/pages/questionnaires/QuestionnairePage.tsx`
- `/src/pages/reporting/ReportingPage.tsx`
- `/src/pages/auth/UnauthorizedPage.tsx`
- `/src/pages/auth/LoginPage.tsx`
- `/src/pages/auth/RegisterPage.tsx`
- `/src/pages/auth/OnboardingPage.tsx`

**Components Directory:**
- `/src/components/dashboard/EmptyStateWizard.tsx`
- `/src/components/dashboard/QuickActionCenter.tsx`
- `/src/components/dashboard/RiskControlWidget.tsx`
- `/src/components/dashboard/SubscriptionBanner.tsx`
- `/src/components/dashboard/RealTimeDashboard.tsx`
- `/src/components/dashboard/ProboIntegrationDashboard.tsx`
- `/src/components/dashboard/DashboardGrid.tsx`
- `/src/components/dashboard/ComplianceDashboard.tsx`
- `/src/components/dashboard/AIBriefingPanel.tsx`
- `/src/components/dashboard/LiveDashboard.tsx`
- `/src/components/dashboard/EnterpriseRiskDashboard.tsx`
- `/src/components/dashboard/VantaInspiredDashboard.tsx`
- `/src/components/dashboard/ComplianceProgress.tsx`
- `/src/components/dashboard/EnhancedListCard.tsx`
- `/src/components/dashboard/DashboardStatsModal.tsx`
- `/src/components/dashboard/CustomDashboardBuilder.tsx`
- `/src/components/dashboard/EnhancedChartCard.tsx`
- `/src/components/dashboard/AdvancedFilters.tsx`
... and many more component files

### Card Component (235 imports)
Files importing from `@/components/ui/card`:

**Common patterns:**
- Most dashboard pages use Card for layout
- Report pages use Card for content sections
- Form pages use Card for grouping fields
- Analytics pages use Card for metric displays

### Badge Component (233 imports)
Files importing from `@/components/ui/badge`:

**Common usage:**
- Status indicators
- Risk levels
- Compliance scores
- User roles
- Tags and categories

### Progress Component (106 imports)
Files importing from `@/components/ui/progress`:

**Common usage:**
- Loading states
- Completion percentages
- Upload progress
- Assessment progress
- Compliance progress bars

### Input Component (103 imports)
Files importing from `@/components/ui/input`:

**Common usage:**
- Form fields
- Search bars
- Filter inputs
- Configuration fields
- User input fields

### Select Component (94 imports)
Files importing from `@/components/ui/select`:

**Common usage:**
- Dropdown menus
- Filter selectors
- Option pickers
- Category selectors
- Status changers

### Alert Component (53 imports)
Files importing from `@/components/ui/alert`:

**Common usage:**
- Error messages
- Success notifications
- Warning alerts
- Information displays
- System messages

### Dialog Component (45 imports)
Files importing from `@/components/ui/dialog`:

**Common usage:**
- Modal windows
- Confirmation dialogs
- Form modals
- Detail views
- Settings panels

### Checkbox Component (39 imports)
Files importing from `@/components/ui/checkbox`:

**Common usage:**
- Form selections
- Multi-select lists
- Settings toggles
- Filter options
- Agreement checkboxes

## Migration Notes

The codebase heavily relies on these UI components from the custom component library at `@/components/ui/`. Any migration or update to these components would require updating all the listed files.

The most widely used components are:
1. Button (259 imports)
2. Card (235 imports)
3. Badge (233 imports)

These three components appear in almost every page and major component in the application.