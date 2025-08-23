export async function POST(req: Request) {
  try {
    const incomingUrl = new URL(req.url);
    const id = incomingUrl.searchParams.get('id');
    const type = incomingUrl.searchParams.get('type');

    const targetUrl = new URL('https://dlnk.one/e');
    if (id) targetUrl.searchParams.set('id', id);
    if (type) targetUrl.searchParams.set('type', type);

    // Pass through the body as-is
    const bodyText = await req.text();

    const res = await fetch(targetUrl.toString(), {
      method: 'POST',
      // Forward content-type if present
      headers: {
        ...(req.headers.get('content-type')
          ? { 'content-type': req.headers.get('content-type') as string }
          : {}),
      },
      body: bodyText,
      // Ensure we don't use Next.js caching for this proxy
      cache: 'no-store',
    });

    const responseBody = await res.text();

    return new Response(responseBody, {
      status: res.status,
      headers: {
        // Mirror content-type when possible to keep behavior consistent
        'content-type': res.headers.get('content-type') || 'text/plain; charset=utf-8',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Proxy failed', message }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function GET(req: Request) {
  // Optional: support GET pass-through if needed in the future
  const incomingUrl = new URL(req.url);
  const id = incomingUrl.searchParams.get('id');
  const type = incomingUrl.searchParams.get('type');

  const targetUrl = new URL('https://dlnk.one/e');
  if (id) targetUrl.searchParams.set('id', id);
  if (type) targetUrl.searchParams.set('type', type);

  const res = await fetch(targetUrl.toString(), { method: 'GET', cache: 'no-store' });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'text/plain; charset=utf-8' },
  });
}
