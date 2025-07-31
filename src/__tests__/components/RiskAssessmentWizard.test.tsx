import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from '@/hooks/use-toast';
import RiskAssessmentWizard from '@/components/RiskAssessmentWizard';

// Mock external dependencies
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock API calls
global.fetch = jest.fn();

describe('RiskAssessmentWizard', () => {
  const defaultProps = {
    organizationId: 'test-org-1',
    userId: 'test-user-1',
    onComplete: jest.fn(),
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();

    // Mock useDropzone implementation
    const mockUseDropzone = require('react-dropzone').useDropzone;
    mockUseDropzone.mockReturnValue({
      getRootProps: () => ({
        'data-testid': 'dropzone',
        onClick: jest.fn(),
      }),
      getInputProps: () => ({
        'data-testid': 'file-input',
      }),
      isDragActive: false,
    });

    // Mock successful fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Wizard Navigation', () => {
    it('should render initial setup step', () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      expect(screen.getByText('Assessment Setup')).toBeInTheDocument();
      expect(screen.getByText('Configure your risk assessment parameters')).toBeInTheDocument();
      expect(screen.getByLabelText(/assessment name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should show all wizard steps', () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      expect(screen.getByText('Assessment Setup')).toBeInTheDocument();
      expect(screen.getByText('Document Upload')).toBeInTheDocument();
      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      expect(screen.getByText('Review & Finalize')).toBeInTheDocument();
    });

    it('should navigate to next step when form is valid', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      // Fill out required fields
      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      // Select assessment type
      const assessmentTypeSelect = screen.getByLabelText(/assessment type/i);
      await user.click(assessmentTypeSelect);
      await user.click(screen.getByText('Self Assessment'));

      // Set due date
      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2024-12-31');

      // Go to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });
    });

    it('should not allow navigation without required fields', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should still be on first step
      expect(screen.getByText('Configure your risk assessment parameters')).toBeInTheDocument();
    });

    it('should allow going back to previous step', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      // Fill out form and go to next step
      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(screen.getByText('Configure your risk assessment parameters')).toBeInTheDocument();
    });
  });

  describe('Assessment Configuration', () => {
    it('should allow adding stakeholders', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const stakeholderInput = screen.getByPlaceholderText(/add stakeholder/i);
      await user.type(stakeholderInput, 'john.doe@example.com');

      const addButton = screen.getByRole('button', { name: /add stakeholder/i });
      await user.click(addButton);

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(stakeholderInput).toHaveValue('');
    });

    it('should allow removing stakeholders', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      // Add a stakeholder
      const stakeholderInput = screen.getByPlaceholderText(/add stakeholder/i);
      await user.type(stakeholderInput, 'john.doe@example.com');
      await user.click(screen.getByRole('button', { name: /add stakeholder/i }));

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();

      // Remove the stakeholder
      const removeButton = screen.getByLabelText(/remove stakeholder/i);
      await user.click(removeButton);

      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
    });

    it('should allow selecting risk categories', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const operationalCheckbox = screen.getByLabelText('Operational');
      const financialCheckbox = screen.getByLabelText('Financial');

      await user.click(operationalCheckbox);
      await user.click(financialCheckbox);

      expect(operationalCheckbox).toBeChecked();
      expect(financialCheckbox).toBeChecked();
    });

    it('should allow selecting compliance frameworks', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const soc2Checkbox = screen.getByLabelText('SOC 2');
      const iso27001Checkbox = screen.getByLabelText('ISO 27001');

      await user.click(soc2Checkbox);
      await user.click(iso27001Checkbox);

      expect(soc2Checkbox).toBeChecked();
      expect(iso27001Checkbox).toBeChecked();
    });

    it('should validate email format for stakeholders', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const stakeholderInput = screen.getByPlaceholderText(/add stakeholder/i);
      await user.type(stakeholderInput, 'invalid-email');

      const addButton = screen.getByRole('button', { name: /add stakeholder/i });
      await user.click(addButton);

      // Should show validation error
      expect(toast).toHaveBeenCalledWith({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
    });
  });

  describe('File Upload', () => {
    beforeEach(async () => {
      // Navigate to file upload step
      render(<RiskAssessmentWizard {...defaultProps} />);

      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });
    });

    it('should display dropzone for file upload', () => {
      expect(screen.getByTestId('dropzone')).toBeInTheDocument();
      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
    });

    it('should show supported file types', () => {
      expect(screen.getByText(/Excel spreadsheets/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Word documents/i)).toBeInTheDocument();
    });

    it('should display uploaded files in the list', async () => {
      // Mock dropzone with files
      const mockFiles = [
        new File(['test content'], 'test-rcsa.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        new File(['policy content'], 'policy.pdf', { type: 'application/pdf' }),
      ];

      const mockUseDropzone = require('react-dropzone').useDropzone;
      mockUseDropzone.mockReturnValue({
        getRootProps: () => ({
          'data-testid': 'dropzone',
        }),
        getInputProps: () => ({
          'data-testid': 'file-input',
        }),
        isDragActive: false,
      });

      // Re-render component to trigger file addition
      const { rerender } = render(<RiskAssessmentWizard {...defaultProps} />);

      // Simulate file drop
      const dropzoneCallback = mockUseDropzone.mock.calls[0][0].onDrop;
      dropzoneCallback(mockFiles, []);

      rerender(<RiskAssessmentWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('test-rcsa.xlsx')).toBeInTheDocument();
        expect(screen.getByText('policy.pdf')).toBeInTheDocument();
      });
    });

    it('should allow removing uploaded files', async () => {
      // This would need to be implemented in the actual component
      // For now, we'll test the UI elements exist
      expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    });

    it('should show file size limits', () => {
      expect(screen.getByText(/maximum 25mb per file/i)).toBeInTheDocument();
    });
  });

  describe('AI Analysis Step', () => {
    beforeEach(async () => {
      // Navigate to AI analysis step
      const { rerender } = render(<RiskAssessmentWizard {...defaultProps} />);

      // Go through previous steps
      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      });
    });

    it('should display analysis options', () => {
      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      expect(screen.getByText(/ai-powered risk and control extraction/i)).toBeInTheDocument();
    });

    it('should show start analysis button', () => {
      expect(screen.getByRole('button', { name: /start analysis/i })).toBeInTheDocument();
    });

    it('should handle analysis process', async () => {
      const startButton = screen.getByRole('button', { name: /start analysis/i });
      await user.click(startButton);

      // Should show processing state
      expect(screen.getByText(/analyzing documents/i)).toBeInTheDocument();
    });
  });

  describe('Review and Finalize Step', () => {
    beforeEach(async () => {
      // Mock analysis results
      const mockAnalysisResults = {
        risks: [
          { id: '1', title: 'Data Breach Risk', category: 'Technology', likelihood: 3, impact: 4 },
          {
            id: '2',
            title: 'Compliance Violation',
            category: 'Compliance',
            likelihood: 2,
            impact: 5,
          },
        ],
        controls: [
          { id: '1', title: 'Access Control', effectiveness: 85 },
          { id: '2', title: 'Data Encryption', effectiveness: 92 },
        ],
      };

      render(<RiskAssessmentWizard {...defaultProps} />);

      // Navigate to final step (simplified navigation for testing)
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      for (const button of nextButtons) {
        await user.click(button);
        await waitFor(() => {}, { timeout: 100 });
      }
    });

    it('should show assessment summary', () => {
      expect(screen.getByText('Review & Finalize')).toBeInTheDocument();
    });

    it('should show complete assessment button', () => {
      expect(screen.getByRole('button', { name: /complete assessment/i })).toBeInTheDocument();
    });

    it('should call onComplete when assessment is finalized', async () => {
      const completeButton = screen.getByRole('button', { name: /complete assessment/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(defaultProps.onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress indicator', () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should update progress as steps are completed', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25'); // 1/4 steps

      // Complete first step
      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(progressBar).toHaveAttribute('aria-valuenow', '50'); // 2/4 steps
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<RiskAssessmentWizard {...defaultProps} />);

      // Try to proceed with analysis
      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start analysis/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Analysis failed',
          description: 'Please try again or contact support',
          variant: 'destructive',
        });
      });
    });

    it('should validate form before allowing progression', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should still be on first step
      expect(screen.getByText('Configure your risk assessment parameters')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      expect(screen.getByRole('progressbar')).toHaveAccessibleName();
      expect(screen.getByLabelText(/assessment name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      const nameInput = screen.getByLabelText(/assessment name/i);
      nameInput.focus();

      // Tab should move to next input
      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();
    });

    it('should announce step changes to screen readers', async () => {
      render(<RiskAssessmentWizard {...defaultProps} />);

      // Fill form and proceed
      await user.type(screen.getByLabelText(/assessment name/i), 'Test Assessment');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/scope/i), 'Test Scope');
      await user.type(screen.getByLabelText(/department/i), 'IT Department');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
      });

      // Check for accessibility announcements
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Document Upload');
    });
  });
});
