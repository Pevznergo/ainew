'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Test Email Verification System
      </h1>

      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">
          Email Verification Test
        </h3>
        <p className="text-yellow-700 mb-2">
          This test will send a verification email to your account to verify the
          email system is working properly.
        </p>
        <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
          <li>Make sure you&apos;re logged in first</li>
          <li>Check your email after clicking the test button</li>
          <li>Verify the verification URL points to the correct port (3003)</li>
          <li>Click the verification link to complete the test</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={testEmail}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Sending Test Email...' : 'Send Test Email'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">
            Result: {result.success ? '✅ Success' : '❌ Failed'}
          </h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">
          Registration Email Issue Analysis
        </h3>
        <div className="text-blue-700 space-y-2">
          <p>
            <strong>Problem:</strong> Users not receiving verification emails
            during registration
          </p>
          <p>
            <strong>Root Cause:</strong> NEXTAUTH_URL was pointing to port 3000,
            but app runs on port 3003
          </p>
          <p>
            <strong>Solution Applied:</strong> Updated NEXTAUTH_URL to
            http://localhost:3003
          </p>
          <p>
            <strong>Expected Result:</strong> Verification emails should now
            contain correct links
          </p>
        </div>
      </div>
    </div>
  );
}
