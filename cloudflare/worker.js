const ALLOWED_ORIGIN = 'https://suyttenhoef-cyber.github.io';

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === 'http://localhost:5173';
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    let response;

    if (url.pathname.startsWith('/odwb/')) {
      const target = 'https://www.odwb.be' + url.pathname.replace('/odwb', '') + url.search;
      response = await fetch(new Request(target, { method: request.method }));

    } else if (url.pathname.startsWith('/anthropic/')) {
      const target = 'https://api.anthropic.com' + url.pathname.replace('/anthropic', '') + url.search;
      const headers = new Headers();
      headers.set('content-type', 'application/json');
      headers.set('x-api-key', env.ANTHROPIC_KEY);
      headers.set('anthropic-version', '2023-06-01');
      response = await fetch(new Request(target, {
        method: request.method,
        headers,
        body: request.body,
      }));

    } else {
      return new Response('Not found', { status: 404 });
    }

    const out = new Response(response.body, response);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  },
};
