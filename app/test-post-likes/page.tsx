'use client';

import { useState } from 'react';

export default function TestPostLikesPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState('');

  const testPostLikes = async () => {
    if (!chatId.trim()) {
      alert('Please enter a chat ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-post-likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim() }),
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Post Likes Function</h1>

      <div className="mb-4">
        <label htmlFor="chatId" className="block text-sm font-medium mb-2">
          Chat ID:
        </label>
        <input
          id="chatId"
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter chat ID to test"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="button"
        onClick={testPostLikes}
        disabled={loading || !chatId.trim()}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
      >
        {loading ? 'Testing...' : 'Test Post Likes Function'}
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
          8th Task: Post Gets 10 Likes
        </h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>
            This task awards 300 tokens when a user&apos;s post gets 10 likes
          </li>
          <li>Only triggers once per user (one-time reward)</li>
          <li>Automatically checks whenever someone votes on a post</li>
          <li>
            The function checks if the post owner hasn&apos;t already completed
            this task
          </li>
          <li>
            Make sure you&apos;re logged in first and use a valid chat ID to
            test
          </li>
        </ol>
      </div>
    </div>
  );
}
