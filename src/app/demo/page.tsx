'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="notion-card">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">
              🤖 ARIA AI Demo - OpenAI Integration Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={testContentGeneration}
                disabled={loading}
                className="notion-button-primary py-3 px-6"
              >
                {loading ? 'Testing...' : 'Test Content Generation'}
              </Button>
              
              <Button
                onClick={testRiskAnalysis}
                disabled={loading}
                className="notion-button-secondary py-3 px-6"
              >
                {loading ? 'Testing...' : 'Test Risk Analysis'}
              </Button>
            </div>

            {result && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Result:</h3>
                <div className="bg-secondary p-4 rounded-lg overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap text-foreground">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <Card className="notion-card-minimal bg-notion-blue/10 border-notion-blue/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">✅ Available Routes:</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>🏠 <strong>Landing Page:</strong> <a href="/" className="text-foreground hover:underline">http://localhost:3000/</a></li>
                  <li>🤖 <strong>AI Demo (this page):</strong> <a href="/demo" className="text-foreground hover:underline">http://localhost:3000/demo</a></li>
                  <li>🔐 <strong>Login:</strong> <a href="/auth/login" className="text-foreground hover:underline">http://localhost:3000/auth/login</a></li>
                  <li>📊 <strong>Dashboard:</strong> <a href="/dashboard" className="text-foreground hover:underline">http://localhost:3000/dashboard</a></li>
                  <li>💬 <strong>ARIA AI Chat:</strong> <a href="/dashboard/aria" className="text-foreground hover:underline">http://localhost:3000/dashboard/aria</a></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="notion-card-minimal bg-notion-green/10 border-notion-green/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">🎯 OpenAI Integration Status:</h3>
                <p className="text-muted-foreground">
                  ✅ API Key configured<br/>
                  ✅ Content generation working<br/>
                  ✅ Risk analysis working<br/>
                  ✅ Using model: gpt-4o-mini<br/>
                  ✅ Cost tracking enabled
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 