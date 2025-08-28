'use client';

import { useState } from 'react';

export default function TestFirstChatPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFirstChat = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-first-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test First Chat Functionality</h1>

      <div className="space-y-4">
        <button
          type="button"
          onClick={testFirstChat}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
        >
          {loading ? 'Testing...' : 'Test First Chat Function'}
        </button>

        {result && (
          <div className="mt-4 p-4 border rounded">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Make sure you&apos;re logged in first</li>
          <li>Click the &quot;Test First Chat Function&quot; button above</li>
          <li>
            Check the result to see if the first chat task completion works
          </li>
          <li>
            Check the browser console and server logs for detailed debugging
            info
          </li>
        </ol>
      </div>
    </div>
  );
}
