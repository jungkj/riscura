import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AIProvider } from './context/AIContext';
import { RiskProvider } from './context/RiskContext';
import { ControlProvider } from './context/ControlContext';
import { QuestionnaireProvider } from './context/QuestionnaireContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { Toaster } from '@/components/ui/toaster';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Main Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import RiskListPage from './pages/risks/RiskListPage';
import RiskDetailPage from './pages/risks/RiskDetailPage';
import DocumentAnalysisPage from './pages/documents/DocumentAnalysisPage';
import AIInsightsPage from './pages/ai/AIInsightsPage';
import ControlLibraryPage from './pages/controls/ControlLibraryPage';
import QuestionnairePage from './pages/questionnaires/QuestionnairePage';
import WorkflowPage from './pages/workflows/WorkflowPage';
import ReportingPage from './pages/reporting/ReportingPage';
import ARIAPage from './pages/ai/ARIAPage';

// Import route components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <AIProvider>
          <RiskProvider>
            <ControlProvider>
              <QuestionnaireProvider>
                <WorkflowProvider>
                  <Router>
                    <Routes>
                      {/* Public Landing Page Route */}
                      <Route path="/" element={<PublicRoute />} />
                      
                      {/* Auth Routes */}
                      <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />
                      </Route>
                      
                      {/* Unauthorized Route */}
                      <Route path="/unauthorized" element={<UnauthorizedPage />} />
                      
                      {/* Protected App Routes */}
                      <Route element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/aria" element={<ARIAPage />} />
                        <Route path="/risks" element={<RiskListPage />} />
                        <Route path="/risks/:id" element={<RiskDetailPage />} />
                        <Route path="/document-analysis" element={<DocumentAnalysisPage />} />
                        <Route path="/ai-insights" element={<AIInsightsPage />} />
                        <Route path="/controls" element={<ControlLibraryPage />} />
                        <Route path="/questionnaires" element={<QuestionnairePage />} />
                        <Route path="/workflows" element={<WorkflowPage />} />
                        <Route path="/reporting" element={<ReportingPage />} />
                      </Route>
                    </Routes>
                  </Router>
                  <Toaster />
                </WorkflowProvider>
              </QuestionnaireProvider>
            </ControlProvider>
          </RiskProvider>
        </AIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;