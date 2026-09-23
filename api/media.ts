import { v2 as cloudinary } from 'cloudinary';

function sanitize(val: string | undefined): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^["']|["']$/g, '');
}

const cloudName = sanitize(
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  'dzkeh75jx'
);

const apiKey = sanitize(
  process.env.CLOUDINARY_API_KEY ||
  process.env.VITE_CLOUDINARY_API_KEY ||
  ''
);

const apiSecret = sanitize(
  process.env.CLOUDINARY_API_SECRET ||
  process.env.CLOUDINARY_SECRET ||
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
      error: 'Unauthorized. An active admin authentication session token is required to manage media.',
    });
  }

  // Check required Cloudinary server-side credentials
  if (!apiSecret || !apiKey) {
    return res.status(500).json({
      error:
        'Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in Vercel Environment Variables. Please configure them in Vercel Project Settings > Environment Variables, then redeploy.',
    });
  }

  // Configure Cloudinary SDK instance with server-side credentials
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  try {
    const { action } = payload || {};

    // 1. Direct Server-Side Upload (WebP Base64 -> Cloudinary)
    if (action === 'upload') {
      const { publicId, folder = 'modern_dresses', base64Data, contentType = 'image/webp' } = payload;
      if (!base64Data) {
        return res.status(400).json({ error: 'Missing base64Data for upload.' });
      }

      const dataUri = base64Data.startsWith('data:')
        ? base64Data
        : `data:${contentType};base64,${base64Data}`;

      const uploadOptions: any = {
        folder,
        overwrite: true,
        resource_type: 'image',
      };

      if (publicId) {
        // Strip folder prefix if already included in publicId
        const cleanPublicId = publicId.includes('/')
          ? publicId.split('/').pop()
          : publicId;
        uploadOptions.public_id = cleanPublicId;
      }

      const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

      return res.status(200).json({
        success: true,
        publicUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
      });
    }

    // 2. Generate Upload Signature for Direct Client Signed Uploads
    if (action === 'sign') {
      const { paramsToSign } = payload;
      if (!paramsToSign || typeof paramsToSign !== 'object') {
        return res.status(400).json({ error: 'Missing paramsToSign object.' });
      }

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      return res.status(200).json({
        success: true,
        signature,
        apiKey,
        cloudName,
        timestamp: paramsToSign.timestamp,
      });
    }

    // 3. Delete individual assets by Public ID
    if (action === 'delete') {
      const { publicIds } = payload;
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({ error: 'Missing publicIds array for delete.' });
      }

      const results = [];
      for (const pid of publicIds) {
        if (!pid) continue;
        const delRes = await cloudinary.uploader.destroy(pid, {
          invalidate: true,
          resource_type: 'image',
        });
        results.push({ publicId: pid, result: delRes.result });
      }

      return res.status(200).json({ success: true, deleted: results });
    }

    // 4. Delete entire folder / prefix (e.g. when product is deleted)
    if (action === 'delete-folder') {
      const { folderPrefix } = payload;
      if (!folderPrefix) {
        return res.status(400).json({ error: 'Missing folderPrefix.' });
      }

      try {
        await cloudinary.api.delete_resources_by_prefix(folderPrefix, {
          resource_type: 'image',
        });
      } catch (err: any) {
        console.warn('delete_resources_by_prefix warning:', err?.message);
      }

      try {
        await cloudinary.api.delete_folder(folderPrefix);
      } catch (err: any) {
        console.warn('delete_folder warning:', err?.message);
      }

      return res.status(200).json({ success: true, folder: folderPrefix });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err: any) {
    console.error('Cloudinary media API exception:', err);
    return res.status(500).json({
      error: `Cloudinary server error: ${err.message || 'Internal server error.'}`,
    });
  }
}
