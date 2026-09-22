import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'modern-dresses';

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '');
}

function sanitizeKey(key: string | undefined): string {
  if (!key) return '';
  return key
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^["']|["']$/g, '');
}

// Server-side environment variables (Vercel Serverless Function)
const supabaseUrl = sanitizeUrl(
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ljwiekmbnippkvnlkrdi.supabase.co'
);

const serviceRoleKey = sanitizeKey(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ''
);

export default async function handler(req: any, res: any) {
  // Enable CORS for same-origin and development requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' });
  }

  // Parse body if received as raw string
  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body payload.' });
    }
  }

  // Verify authentication header presence for admin operations
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized. An active admin authentication session token is required to upload/delete media.',
    });
  }

  // Verify server-side secret key configuration
  if (!serviceRoleKey) {
    return res.status(500).json({
      error:
        'Missing SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables. Please copy the "service_role" secret key from Supabase Dashboard > Project Settings > API and add it as SUPABASE_SERVICE_ROLE_KEY in Vercel Project Settings > Environment Variables, then redeploy.',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { action } = payload || {};

    if (action === 'upload') {
      const { path, base64Data, contentType = 'image/webp' } = payload;
      if (!path || !base64Data) {
        return res.status(400).json({ error: 'Missing path or base64Data for upload.' });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

      let publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
      let uploadSuccess = false;
      let lastError = '';

      // 1. Primary: SDK upload
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, uint8Array, {
            contentType,
            upsert: true,
          });

        if (!error && data) {
          uploadSuccess = true;
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);
          publicUrl = publicUrlData.publicUrl;
        } else if (error) {
          lastError = error.message;
          console.warn('SDK upload returned error, attempting REST fallback:', error.message);
        }
      } catch (sdkErr: any) {
        lastError = sdkErr?.message || 'SDK upload exception';
        console.warn('SDK upload exception, attempting REST fallback:', sdkErr.message);
      }

      // 2. Secondary fallback: Direct Supabase Storage REST endpoint
      if (!uploadSuccess) {
        try {
          const restUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${path}`;
          const restRes = await fetch(restUrl, {
            method: 'POST',
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              'Content-Type': contentType,
              'x-upsert': 'true',
            },
            body: buffer,
          });

          if (restRes.ok) {
            uploadSuccess = true;
          } else {
            const restErrText = await restRes.text().catch(() => '');
            return res.status(restRes.status).json({
              error: `Supabase Storage upload error (${restRes.status}): ${restErrText || restRes.statusText}. (Target: ${supabaseUrl})`,
            });
          }
        } catch (restErr: any) {
          const causeText = restErr?.cause ? ` (Cause: ${restErr.cause.message || restErr.cause.code || restErr.cause})` : '';
          return res.status(500).json({
            error: `Supabase Storage network error: ${restErr.message}${causeText}. Target Project URL: ${supabaseUrl}. Please ensure this Supabase project is active and accessible.`,
          });
        }
      }

      return res.status(200).json({
        success: true,
        publicUrl,
        path,
      });
    }

    if (action === 'delete') {
      const { paths } = payload;
      if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ error: 'Missing paths array for delete.' });
      }

      const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
      if (error) {
        console.warn('SDK delete error, trying REST fallback:', error.message);
        const restDelUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}`;
        const restRes = await fetch(restDelUrl, {
          method: 'DELETE',
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefixes: paths }),
        });

        if (!restRes.ok) {
          const restErrText = await restRes.text().catch(() => '');
          return res.status(restRes.status).json({ error: `Delete failed: ${restErrText || restRes.statusText}` });
        }
      }

      return res.status(200).json({ success: true, deleted: paths });
    }

    if (action === 'delete-folder') {
      const { folderPrefix } = payload;
      if (!folderPrefix) {
        return res.status(400).json({ error: 'Missing folderPrefix.' });
      }

      // Recursively list and delete
      const deleteFolderRecursive = async (prefix: string) => {
        const { data: files, error: listErr } = await supabase.storage
          .from(BUCKET_NAME)
          .list(prefix, { limit: 100 });

        if (listErr || !files || files.length === 0) return;

        const filesToRemove: string[] = [];
        for (const item of files) {
          if (item.id === null) {
            await deleteFolderRecursive(`${prefix}/${item.name}`);
          } else {
            filesToRemove.push(`${prefix}/${item.name}`);
          }
        }

        if (filesToRemove.length > 0) {
          await supabase.storage.from(BUCKET_NAME).remove(filesToRemove);
        }
      };

      await deleteFolderRecursive(folderPrefix);
      return res.status(200).json({ success: true, folder: folderPrefix });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error('Server media endpoint exception:', err);
    const causeMsg = err?.cause ? ` (Cause: ${err.cause.message || err.cause.code || err.cause})` : '';
    return res.status(500).json({
      error: `Media server error: ${err.message || 'Internal server error.'}${causeMsg}. (Target URL: ${supabaseUrl})`,
    });
  }
}

