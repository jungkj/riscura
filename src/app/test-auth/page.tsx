import { AuthTestComponent } from '@/components/test/AuthTestComponent';

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AuthTestComponent />
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Sign In with Demo Credentials" to authenticate</li>
              <li>Once authenticated, click "Test API Call" to test backend connection</li>
              <li>Check if the API returns data or authentication errors</li>
              <li>Use this to verify frontend-backend authentication is working</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h4 className="font-semibold text-blue-800">Demo Credentials:</h4>
              <p className="text-blue-700">Email: admin@riscura.com</p>
              <p className="text-blue-700">Password: admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 