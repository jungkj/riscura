import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotionRCSASpreadsheet } from '@/components/spreadsheet/NotionRCSASpreadsheet';
import { RCSAProvider } from '@/context/RCSAContext';
import { rcsaApiClient } from '@/lib/api/rcsa-client';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/api/rcsa-client', () => ({
  rcsaApiClient: {
    getTestScripts: jest.fn(),
    generateTestScript: jest.fn(),
    createTestScript: jest.fn()
  }
}));

jest.mock('@/context/RCSAContext', () => ({
  ...jest.requireActual('@/context/RCSAContext'),
  useRCSA: () => ({
    risks: mockRisks,
    controls: mockControls,
    refreshData: jest.fn()
  })
}));

// Mock data
const mockRisks = [
  {
    id: '1',
    title: 'Data Breach Risk',
    description: 'Risk of unauthorized data access',
    category: 'OPERATIONAL',
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    organizationId: 'org1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockControls = [
  {
    id: '1',
    title: 'Access Control',
    description: 'Implement strong access controls',
    type: 'PREVENTIVE',
    category: 'TECHNICAL',
    frequency: 'CONTINUOUS',
    automationLevel: 'AUTOMATED',
    effectiveness: 0.85,
    status: 'EFFECTIVE',
    organizationId: 'org1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    risks: [{
      id: 'mapping1',
      riskId: '1',
      controlId: '1',
      effectiveness: 0.85,
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  }
];

const mockTestScripts = [
  {
    id: '1',
    title: 'Access Control Test',
    description: 'Test access control effectiveness',
    steps: [],
    expectedResults: 'Access properly restricted',
    testType: 'MANUAL',
    frequency: 'MONTHLY',
    automationCapable: false,
    tags: [],
    organizationId: 'org1',
    createdAt: new Date(),
    updatedAt: new Date(),
    controls: [{
      id: 'mapping1',
      controlId: '1',
      testScriptId: '1',
      isMandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  }
];

describe('NotionRCSASpreadsheet', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (rcsaApiClient.getTestScripts as jest.Mock).mockResolvedValue({
      success: true,
      data: { data: mockTestScripts }
    });
  });

  it('renders the spreadsheet with correct headers', async () => {
    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('RCSA Spreadsheet')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Automation')).toBeInTheDocument();
      expect(screen.getByText('AI Actions')).toBeInTheDocument();
    });
  });

  it('displays risks, controls, and test scripts in hierarchy', async () => {
    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Data Breach Risk')).toBeInTheDocument();
      expect(screen.getByText('Access Control')).toBeInTheDocument();
      expect(screen.getByText('Access Control Test')).toBeInTheDocument();
    });
  });

  it('expands and collapses rows when clicked', async () => {
    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    await waitFor(() => {
      const expandButton = screen.getAllByRole('button')[0];
      fireEvent.click(expandButton);
      
      // Verify expansion logic
      expect(screen.getByText('Access Control')).toBeVisible();
    });
  });

  it('navigates to entity detail page when view button is clicked', async () => {
    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    await waitFor(() => {
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      fireEvent.click(viewButtons[0]);
      
      expect(mockPush).toHaveBeenCalledWith('/risks/1');
    });
  });

  it('opens AI generator when Generate Control is clicked', async () => {
    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    await waitFor(() => {
      const generateButton = screen.getByText('Generate Control');
      fireEvent.click(generateButton);
      
      // AI Generator modal should be visible
      expect(screen.getByText(/AI Control Generator/i)).toBeInTheDocument();
    });
  });

  it('generates test script when Generate Test is clicked', async () => {
    (rcsaApiClient.generateTestScript as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        testScript: {
          title: 'Generated Test',
          description: 'AI generated test',
          steps: [],
          expectedResults: 'Control validated',
          testType: 'MANUAL',
          frequency: 'MONTHLY',
          automationCapable: false,
          tags: ['ai-generated']
        },
        confidence: 0.85,
        reasoning: 'Generated based on control type'
      }
    });

    (rcsaApiClient.createTestScript as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: '2', ...mockTestScripts[0] }
    });

    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    await waitFor(() => {
      const generateTestButton = screen.getByText('Generate Test');
      fireEvent.click(generateTestButton);
    });

    await waitFor(() => {
      expect(rcsaApiClient.generateTestScript).toHaveBeenCalledWith({
        controlId: '1',
        controlDescription: 'Implement strong access controls'
      });
    });
  });

  it('filters entities based on search query', async () => {
    render(
      <RCSAProvider>
        <NotionRCSASpreadsheet />
      </RCSAProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'access' } });

    await waitFor(() => {
      expect(screen.getByText('Access Control')).toBeInTheDocument();
      expect(screen.getByText('Access Control Test')).toBeInTheDocument();
    });
  });
});