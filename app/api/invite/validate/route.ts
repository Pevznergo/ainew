import type { NextRequest } from 'next/server';
import { getInviteByCode } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing invite code' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const invite = await getInviteByCode(code);
    if (!invite) {
      return new Response(
        JSON.stringify({ available: false, remaining: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const remaining = Math.max(0, (invite.available_count || 0) - (invite.used_count || 0));
    return new Response(
      JSON.stringify({ available: remaining > 0, remaining }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
