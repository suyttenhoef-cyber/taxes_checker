const ALLOWED_ORIGIN = 'https://suyttenhoef-cyber.github.io';

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === 'http://localhost:5173';
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleESignFlow(request, env, url, origin) {
  const cors = corsHeaders(origin);
  const path = url.pathname.replace('/esignflow', '');
  const auth = { 'Authorization': `Bearer ${env.ESIGNFLOW_API_KEY}` };
  const base = env.ESIGNFLOW_BASE_URL;

  if (path === '/upload' && request.method === 'POST') {
    const formData = await request.formData();
    const outForm  = new FormData();
    outForm.append('pdfFile', formData.get('pdfFile'));

    const res = await fetch(`${base}/documents/post`, {
      method:  'POST',
      headers: auth,
      body:    outForm,
    });
    return new Response(res.body, {
      status:  res.status,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  if (path === '/create' && request.method === 'POST') {
    const body = await request.json();
    // Inject signers from env so emails never travel through the browser
    if (body.Documents?.[0]) {
      body.Documents[0].Signers = [
        { UserEmail: env.ESIGNFLOW_SIGNER1_EMAIL, Order: 1 },
        { UserEmail: env.ESIGNFLOW_SIGNER2_EMAIL, Order: 2 },
      ];
    }
    const res = await fetch(`${base}/documents/create`, {
      method:  'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return new Response(res.body, {
      status:  res.status,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  if (path.startsWith('/status/') && request.method === 'GET') {
    const id  = path.replace('/status/', '');
    const res = await fetch(`${base}/documents/${id}`, { headers: auth });
    return new Response(res.body, {
      status:  res.status,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  if (path.startsWith('/download/') && request.method === 'GET') {
    const id  = path.replace('/download/', '');
    const res = await fetch(`${base}/documents/${id}/download`, { headers: auth });
    return new Response(res.body, {
      status:  res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/pdf',
        ...cors,
      },
    });
  }

  return new Response('Not found', { status: 404, headers: cors });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname.startsWith('/esignflow/')) {
      return handleESignFlow(request, env, url, origin);
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
