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

    } else if (url.pathname.startsWith('/openai/')) {
      const target = 'https://api.openai.com' + url.pathname.replace('/openai', '') + url.search;
      const headers = new Headers();
      headers.set('content-type', 'application/json');
      headers.set('Authorization', `Bearer ${env.OPENAI_KEY}`);
      response = await fetch(new Request(target, {
        method: request.method,
        headers,
        body: request.body,
      }));

    } else if (url.pathname.startsWith('/github/')) {
      const target = 'https://api.github.com' + url.pathname.replace('/github', '') + url.search;
      const headers = new Headers();
      headers.set('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
      headers.set('User-Agent', 'taxes-checker-app');
      headers.set('Accept', 'application/vnd.github.v3+json');
      if (request.method !== 'GET') headers.set('Content-Type', 'application/json');
      response = await fetch(new Request(target, {
        method: request.method,
        headers,
        body: request.method !== 'GET' ? request.body : undefined,
      }));

    } else {
      return new Response('Not found', { status: 404 });
    }

    const out = new Response(response.body, response);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  },
};
