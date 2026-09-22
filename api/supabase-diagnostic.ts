import dns from 'dns';
import https from 'https';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = 'ljwiekmbnippkvnlkrdi.supabase.co';
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ljwiekmbnippkvnlkrdi.supabase.co';
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);

  const results: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    envCheck: {
      rawSupabaseUrl: rawUrl,
      rawSupabaseUrlLength: rawUrl.length,
      rawSupabaseUrlCharCodes: Array.from(rawUrl).map((c) => c.charCodeAt(0)),
      hasServiceRoleKey,
      serviceRoleKeyLength: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length,
    },
    dnsDefaultLookup: null,
    dnsCustomResolverGoogle: null,
    dnsCustomResolverCloudflare: null,
    dnsSupabaseCoLookup: null,
    httpsRootFetch: null,
    httpsStorageFetch: null,
  };

  // 1. Default DNS Lookup
  try {
    const defaultLookup = await new Promise((resolve) => {
      dns.lookup(host, (err, address, family) => {
        if (err) resolve({ error: err.message, code: err.code });
        else resolve({ address, family });
      });
    });
    results.dnsDefaultLookup = defaultLookup;
  } catch (err: any) {
    results.dnsDefaultLookup = { error: err.message };
  }

  // 2. DNS resolve with Google (8.8.8.8)
  try {
    const resolverGoogle = new dns.Resolver();
    resolverGoogle.setServers(['8.8.8.8', '8.8.4.4']);
    const googleResolve = await new Promise((resolve) => {
      resolverGoogle.resolve4(host, (err, addresses) => {
        if (err) resolve({ error: err.message, code: err.code });
        else resolve({ addresses });
      });
    });
    results.dnsCustomResolverGoogle = googleResolve;
  } catch (err: any) {
    results.dnsCustomResolverGoogle = { error: err.message };
  }

  // 3. DNS resolve with Cloudflare (1.1.1.1)
  try {
    const resolverCloudflare = new dns.Resolver();
    resolverCloudflare.setServers(['1.1.1.1', '1.0.0.1']);
    const cloudflareResolve = await new Promise((resolve) => {
      resolverCloudflare.resolve4(host, (err, addresses) => {
        if (err) resolve({ error: err.message, code: err.code });
        else resolve({ addresses });
      });
    });
    results.dnsCustomResolverCloudflare = cloudflareResolve;
  } catch (err: any) {
    results.dnsCustomResolverCloudflare = { error: err.message };
  }

  // 4. Baseline DNS test for supabase.co
  try {
    const baseline = await new Promise((resolve) => {
      dns.lookup('supabase.co', (err, address, family) => {
        if (err) resolve({ error: err.message, code: err.code });
        else resolve({ address, family });
      });
    });
    results.dnsSupabaseCoLookup = baseline;
  } catch (err: any) {
    results.dnsSupabaseCoLookup = { error: err.message };
  }

  // 5. HTTPS fetch to root URL
  try {
    const rootRes = await fetch(`https://${host}`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    results.httpsRootFetch = {
      status: rootRes.status,
      statusText: rootRes.statusText,
      headers: Object.fromEntries(rootRes.headers.entries()),
    };
  } catch (err: any) {
    results.httpsRootFetch = {
      error: err.message,
      cause: err.cause ? (err.cause.message || err.cause.code || err.cause) : null,
    };
  }

  // 6. HTTPS fetch to storage endpoint
  try {
    const storageRes = await fetch(`https://${host}/storage/v1/version`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const text = await storageRes.text().catch(() => '');
    results.httpsStorageFetch = {
      status: storageRes.status,
      statusText: storageRes.statusText,
      body: text.substring(0, 200),
    };
  } catch (err: any) {
    results.httpsStorageFetch = {
      error: err.message,
      cause: err.cause ? (err.cause.message || err.cause.code || err.cause) : null,
    };
  }

  return res.status(200).json(results);
}
