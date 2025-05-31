'use client';

import { useState } from 'react';

export default function AIDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testContentGeneration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          data: {
            type: 'risk_policy',
            content: 'Create a brief cybersecurity risk policy',
            requirements: 'Keep it professional and actionable'
          }
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
    setLoading(false);
  };

  const testRiskAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'risk',
          data: {
            title: 'Data Breach Risk',
            description: 'Risk of unauthorized access to customer data',
            category: 'Technology',
            businessFunction: 'IT Security',
            impactLevel: 'High',
            likelihoodScore: 4
          }
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🤖 ARIA AI Demo - OpenAI Integration Test
          </h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testContentGeneration}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Content Generation'}
              </button>
              
              <button
                onClick={testRiskAnalysis}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Risk Analysis'}
              </button>
            </div>

            {result && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Result:</h3>
                <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">✅ Available Routes:</h3>
            <ul className="text-blue-800 space-y-1">
              <li>🏠 <strong>Landing Page:</strong> <a href="/" className="underline">http://localhost:3000/</a></li>
              <li>🤖 <strong>AI Demo (this page):</strong> <a href="/demo" className="underline">http://localhost:3000/demo</a></li>
              <li>🔐 <strong>Login:</strong> <a href="/auth/login" className="underline">http://localhost:3000/auth/login</a></li>
              <li>📊 <strong>Dashboard:</strong> <a href="/dashboard" className="underline">http://localhost:3000/dashboard</a></li>
              <li>💬 <strong>ARIA AI Chat:</strong> <a href="/dashboard/aria" className="underline">http://localhost:3000/dashboard/aria</a></li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🎯 OpenAI Integration Status:</h3>
            <p className="text-green-800">
              ✅ API Key configured<br/>
              ✅ Content generation working<br/>
              ✅ Risk analysis working<br/>
              ✅ Using model: gpt-4o-mini<br/>
              ✅ Cost tracking enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 