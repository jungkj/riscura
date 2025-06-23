'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Test Page Working! 
        </h1>
        <p className="text-gray-600 mb-8">
          This confirms Next.js is working properly.
        </p>
        <div className="space-x-4">
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
          <a 
            href="/auth/login" 
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
} 