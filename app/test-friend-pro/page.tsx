'use client';

import { useState } from 'react';

export default function TestFriendProPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFriendPro = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-friend-pro', {
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
      <h1 className="text-2xl font-bold mb-6">
        Test Friend PRO Subscription Functionality
      </h1>

      <div className="space-y-4">
        <button
          type="button"
          onClick={testFriendPro}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
        >
          {loading ? 'Testing...' : 'Test Friend PRO Subscription Function'}
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
        <h3 className="font-semibold text-yellow-800 mb-2">
          10th Task: Friend PRO Subscriptions
        </h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>
            This task awards 1000 tokens for each friend who subscribes to PRO
          </li>
          <li>Maximum of 16 friends (16,000 tokens total)</li>
          <li>
            Triggers automatically when a referred user purchases PRO
            subscription
          </li>
          <li>
            The function checks if the user was referred and awards tokens to
            the referrer
          </li>
          <li>Make sure you&apos;re logged in first to test the function</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>When someone subscribes to PRO via payment webhook</li>
          <li>
            The <code>checkFriendProSubscription</code> function is called
          </li>
          <li>
            If the subscriber was referred, their referrer gets 1000 tokens
          </li>
          <li>
            The referrer&apos;s <code>task_friends_pro_subscribed</code> counter
            increases
          </li>
          <li>Maximum 16 friends with PRO subscriptions per user</li>
        </ul>
      </div>
    </div>
  );
}
