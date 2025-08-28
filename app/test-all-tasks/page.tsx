'use client';

import { useState } from 'react';

export default function TestAllTasksPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAllTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-all-tasks', {
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
        Test All Tasks Completion Function
      </h1>

      <button
        type="button"
        onClick={testAllTasks}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test All Tasks Completion Function'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">
          Final Task: All Tasks Completion Bonus
        </h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>
            This task awards 10,000 tokens when ALL other tasks are completed
          </li>
          <li>Checks all main boolean tasks (excluding friend counters)</li>
          <li>
            Automatically triggers when any task is completed via completeTask
          </li>
          <li>
            Tasks required: email verification, profile completion, first chat,
            first share, Twitter, Facebook, VK, Telegram, Reddit, and post
            getting 10 likes
          </li>
          <li>
            Friend invitation tasks are separate (counter-based) and not
            required for completion bonus
          </li>
          <li>Make sure you&apos;re logged in first to test the function</li>
        </ol>
      </div>
    </div>
  );
}
