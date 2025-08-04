'use client';

import React, { useState, useRef, useEffect } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import {
  StatusIcons,
  RiskManagementIcons,
  ActionIcons,
  DataIcons,
  CommunicationIcons,
  TimeIcons,
  UserIcons,
  FileIcons,
} from '@/components/icons/IconLibrary';
import { LoadingStates, Spinner, InlineLoading } from '@/components/states/LoadingState';
import { EmptyStates } from '@/components/states/EmptyState';

// Query types and interfaces
interface QueryResult {
  id: string;
  type: 'data' | 'insight' | 'recommendation' | 'summary';
  query: string;
  result: any;
  confidence: number;
  timestamp: Date;
  executionTime: number;
  dataSource: string[];
  visualizations?: Array<{
    type: 'chart' | 'table' | 'metric' | 'list';
    data: any;
    config?: any;
  }>;
}

interface QuerySuggestion {
  id: string;
  text: string;
  category: string;
  description: string;
  icon: React.ComponentType<any>;
  popularity: number;
}

interface NaturalLanguageQueryProps {
  onQueryResult?: (result: QueryResult) => void;
  onQuerySave?: (query: string, result: QueryResult) => void;
  placeholder?: string;
  className?: string;
}

// Pre-defined query suggestions
const queryCategories = {
  'Risk Analysis': [
    {
      id: 'high-risks',
      text: 'Show me all high-risk items',
      category: 'Risk Analysis',
      description: 'Display risks with high severity scores',
      icon: RiskManagementIcons.Risk,
      popularity: 95,
    },
    {
      id: 'risk-trends',
      text: 'What are the risk trends over the last 6 months?',
      category: 'Risk Analysis',
      description: 'Analyze risk score changes over time',
      icon: DataIcons.TrendingUp,
      popularity: 87,
    },
    {
      id: 'risk-by-category',
      text: 'Break down risks by category',
      category: 'Risk Analysis',
      description: 'Group and count risks by their categories',
      icon: DataIcons.PieChart,
      popularity: 82,
    },
  ],
  Compliance: [
    {
      id: 'compliance-status',
      text: 'What is our overall compliance status?',
      category: 'Compliance',
      description: 'Summary of compliance across all frameworks',
      icon: RiskManagementIcons.Compliance,
      popularity: 91,
    },
    {
      id: 'compliance-gaps',
      text: 'Show me compliance gaps that need attention',
      category: 'Compliance',
      description: 'Identify areas with compliance deficiencies',
      icon: StatusIcons.AlertTriangle,
      popularity: 88,
    },
    {
      id: 'upcoming-deadlines',
      text: 'What compliance deadlines are coming up?',
      category: 'Compliance',
      description: 'List upcoming compliance review dates',
      icon: TimeIcons.Calendar,
      popularity: 79,
    },
  ],
  Controls: [
    {
      id: 'control-effectiveness',
      text: 'How effective are our security controls?',
      category: 'Controls',
      description: 'Analyze control performance and effectiveness',
      icon: UserIcons.Shield,
      popularity: 84,
    },
    {
      id: 'control-gaps',
      text: 'Which areas lack adequate controls?',
      category: 'Controls',
      description: 'Identify risks without sufficient controls',
      icon: RiskManagementIcons.Risk,
      popularity: 76,
    },
  ],
  Reporting: [
    {
      id: 'executive-summary',
      text: 'Generate an executive risk summary',
      category: 'Reporting',
      description: 'Create a high-level risk overview for leadership',
      icon: FileIcons.FileText,
      popularity: 93,
    },
    {
      id: 'department-risks',
      text: 'Show risks by department',
      category: 'Reporting',
      description: 'Break down risk exposure by organizational unit',
      icon: UserIcons.Users,
      popularity: 71,
    },
  ],
};

// Mock query processing function
const processNaturalLanguageQuery = async (query: string): Promise<QueryResult> => {
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const lowerQuery = query.toLowerCase();

  // Simple keyword matching for demo (replace with actual NLP service)
  if (lowerQuery.includes('high risk') || lowerQuery.includes('critical')) {
    return {
      id: `query-${Date.now()}`,
      type: 'data',
      query,
      result: {
        summary: 'Found 12 high-risk items requiring immediate attention',
        data: [
          { id: 1, title: 'Data Breach Risk', severity: 'Critical', score: 95, department: 'IT' },
          {
            id: 2,
            title: 'Vendor Security Risk',
            severity: 'High',
            score: 87,
            department: 'Procurement',
          },
          {
            id: 3,
            title: 'Compliance Gap - GDPR',
            severity: 'High',
            score: 82,
            department: 'Legal',
          },
          {
            id: 4,
            title: 'System Downtime Risk',
            severity: 'High',
            score: 79,
            department: 'Operations',
          },
        ],
        totalCount: 12,
        criticalCount: 3,
        highCount: 9,
      },
      confidence: 0.94,
      timestamp: new Date(),
      executionTime: 1.2,
      dataSource: ['Risk Register', 'Assessment Database'],
      visualizations: [
        {
          type: 'chart',
          data: {
            type: 'bar',
            categories: ['Critical', 'High'],
            values: [3, 9],
          },
        },
      ],
    };
  }

  if (lowerQuery.includes('compliance') && lowerQuery.includes('status')) {
    return {
      id: `query-${Date.now()}`,
      type: 'summary',
      query,
      result: {
        summary: 'Overall compliance score: 84% across all frameworks',
        frameworks: [
          { name: 'ISO 27001', score: 89, status: 'Good' },
          { name: 'GDPR', score: 78, status: 'Needs Attention' },
          { name: 'SOX', score: 92, status: 'Excellent' },
          { name: 'HIPAA', score: 87, status: 'Good' },
        ],
        overallScore: 84,
        trend: '+3% from last quarter',
      },
      confidence: 0.91,
      timestamp: new Date(),
      executionTime: 0.8,
      dataSource: ['Compliance Dashboard', 'Framework Assessments'],
      visualizations: [
        {
          type: 'metric',
          data: { value: 84, label: 'Overall Compliance Score', trend: '+3%' },
        },
      ],
    };
  }

  if (lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
    return {
      id: `query-${Date.now()}`,
      type: 'insight',
      query,
      result: {
        summary: 'Risk trends show 15% improvement over the last 6 months',
        insights: [
          'Cybersecurity risks decreased by 22%',
          'Operational risks increased by 8%',
          'Compliance risks decreased by 31%',
          'Financial risks remained stable',
        ],
        trendData: [
          { month: 'Jan', score: 72 },
          { month: 'Feb', score: 69 },
          { month: 'Mar', score: 71 },
          { month: 'Apr', score: 68 },
          { month: 'May', score: 65 },
          { month: 'Jun', score: 61 },
        ],
      },
      confidence: 0.87,
      timestamp: new Date(),
      executionTime: 2.1,
      dataSource: ['Historical Risk Data', 'Trend Analysis Engine'],
      visualizations: [
        {
          type: 'chart',
          data: {
            type: 'line',
            xAxis: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            yAxis: [72, 69, 71, 68, 65, 61],
          },
        },
      ],
    };
  }

  // Default response for unrecognized queries
  return {
    id: `query-${Date.now()}`,
    type: 'recommendation',
    query,
    result: {
      summary: `I understand you're asking about "${query}". Here are some suggestions:`,
      recommendations: [
        'Try being more specific about the time period (e.g., "last 3 months")',
        "Specify the type of data you're looking for (risks, compliance, controls)",
        'Use keywords like "high", "critical", "trends", or "status"',
        'Ask about specific departments or categories',
      ],
    },
    confidence: 0.6,
    timestamp: new Date(),
    executionTime: 0.3,
    dataSource: ['Query Suggestions'],
    visualizations: [],
  };
};

export const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({
  onQueryResult,
  onQuerySave,
  placeholder = 'Ask me anything about your risks, compliance, or controls...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get all suggestions flattened
  const allSuggestions = Object.values(queryCategories).flat();
  const filteredSuggestions = selectedCategory
    ? allSuggestions.filter((s) => s.category === selectedCategory)
    : allSuggestions.sort((a, b) => b.popularity - a.popularity).slice(0, 6);

  // Handle query submission
  const handleSubmitQuery = async (queryText?: string) => {
    const queryToProcess = queryText || query.trim();
    if (!queryToProcess) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const result = await processNaturalLanguageQuery(queryToProcess);
      setResults((prev) => [result, ...prev]);
      setRecentQueries((prev) =>
        [queryToProcess, ...prev.filter((q) => q !== queryToProcess)].slice(0, 5)
      );

      if (onQueryResult) {
        onQueryResult(result);
      }

      setQuery('');
    } catch (error) {
      // console.error('Query processing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.text);
    handleSubmitQuery(suggestion.text);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  // Handle input blur (with delay to allow suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitQuery();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderResult = (result: QueryResult) => {
    return (
      <div key={result.id} className="border border-gray-200 rounded-lg p-4 bg-white">
        {/* Result Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <StatusIcons.Info size="sm" color="primary" />
              <span className="text-sm font-medium text-gray-900">AI Analysis</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  result.confidence > 0.9
                    ? 'bg-green-100 text-green-800'
                    : result.confidence > 0.7
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-gray-600 italic">"{result.query}"</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{result.executionTime}s</span>
            <button
              onClick={() => onQuerySave && onQuerySave(result.query, result)}
              className="text-blue-600 hover:text-blue-700"
              aria-label="Save query"
            >
              <ActionIcons.Save size="xs" />
            </button>
          </div>
        </div>

        {/* Result Content */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-900 font-medium">{result.result.summary}</p>
          </div>

          {/* Data Visualization */}
          {result.visualizations && result.visualizations.length > 0 && (
            <div className="space-y-3">
              {result.visualizations.map((viz, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  {viz.type === 'metric' && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {viz.data.value}
                        {viz.data.value < 100 ? '%' : ''}
                      </div>
                      <div className="text-sm text-gray-600">{viz.data.label}</div>
                      {viz.data.trend && (
                        <div className="text-xs text-green-600 mt-1">{viz.data.trend}</div>
                      )}
                    </div>
                  )}
                  {viz.type === 'chart' && (
                    <div className="text-center text-sm text-gray-500">
                      📊 Chart visualization would render here
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Detailed Data */}
          {result.result.data && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900">Item</th>
                    <th className="text-left py-2 font-medium text-gray-900">Severity</th>
                    <th className="text-left py-2 font-medium text-gray-900">Score</th>
                    <th className="text-left py-2 font-medium text-gray-900">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {result.result.data.slice(0, 4).map((item: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 text-gray-900">{item.title}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.severity === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : item.severity === 'High'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-2 text-gray-900">{item.score}</td>
                      <td className="py-2 text-gray-600">{item.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Insights */}
          {result.result.insights && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Key Insights:</h4>
              <ul className="space-y-1">
                {result.result.insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.result.recommendations && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Suggestions:</h4>
              <ul className="space-y-1">
                {result.result.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Result Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Sources:</span>
            {result.dataSource.map((source, index) => (
              <span key={index} className="bg-gray-100 px-2 py-0.5 rounded">
                {source}
              </span>
            ))}
          </div>
          <span>{result.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <CommunicationIcons.MessageSquare size="sm" color="primary" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Natural Language Query</h2>
            <p className="text-sm text-gray-500">
              Ask questions about your risk data in plain English
            </p>
          </div>
        </div>
      </div>

      {/* Query Input */}
      <div className="p-4 border-b border-gray-200 relative" ref={suggestionsRef}>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSubmitQuery()}
              disabled={!query.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              aria-label="Submit query"
            >
              {isLoading ? <Spinner size="sm" /> : <CommunicationIcons.MessageSquare size="sm" />}
            </button>
          </div>
        </div>

        {/* Query Suggestions */}
        {showSuggestions && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            {/* Categories */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {Object.keys(queryCategories).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Queries */}
            {recentQueries.length > 0 && !selectedCategory && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Recent Queries</h4>
                <div className="space-y-1">
                  {recentQueries.slice(0, 3).map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubmitQuery(recentQuery)}
                      className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      {recentQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="p-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                {selectedCategory ? `${selectedCategory} Queries` : 'Popular Queries'}
              </h4>
              <div className="space-y-2">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-start space-x-3 w-full p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded flex items-center justify-center mt-0.5">
                      <suggestion.icon size="xs" color="secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {suggestion.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{suggestion.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4">
        {isLoading && (
          <div className="text-center py-8">
            <InlineLoading />
            <p className="text-sm text-gray-500 mt-2">Processing your query...</p>
          </div>
        )}

        {results.length === 0 && !isLoading && (
          <EmptyStates.NoData
            title="No queries yet"
            description="Start by asking a question about your risk data, or try one of the suggested queries above."
          />
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Query Results ({results.length})</h3>
              <button
                onClick={() => setResults([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">{results.map(renderResult)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NaturalLanguageQuery;
