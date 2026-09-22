const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const sourcePath = path.resolve(__dirname, 'logo321.png');
  const publicDir = path.resolve(__dirname, 'public');
  const iconsDir = path.resolve(publicDir, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Also copy original logo to public directory for UI usage
  fs.copyFileSync(sourcePath, path.resolve(publicDir, 'logo.png'));
  fs.copyFileSync(sourcePath, path.resolve(publicDir, 'logo321.png'));
  console.log('Copied logo to public/logo.png and public/logo321.png');

  const metadata = await sharp(sourcePath).metadata();
  console.log('Source dimensions:', metadata.width, 'x', metadata.height);

  // Helper to create square icon with padding
  // For standard icons: transparent background, logo fits inside with padding
  async function createSquareIcon(size, paddingRatio = 0.15, background = { r: 250, g: 248, b: 245, alpha: 0 }) {
    const innerSize = Math.round(size * (1 - paddingRatio * 2));
    // Resize source logo keeping aspect ratio to fit inside innerSize x innerSize
    const resizedLogo = await sharp(sourcePath)
      .resize(innerSize, innerSize, { fit: 'inside' })
      .toBuffer();

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: background
      }
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png();
  }

  // 1. Standard PWA icons (192x192, 512x512)
  console.log('Generating 192x192 icon...');
  await (await createSquareIcon(192, 0.12)).toFile(path.resolve(publicDir, 'pwa-192x192.png'));
  await (await createSquareIcon(192, 0.12)).toFile(path.resolve(iconsDir, 'icon-192x192.png'));

  console.log('Generating 512x512 icon...');
  await (await createSquareIcon(512, 0.12)).toFile(path.resolve(publicDir, 'pwa-512x512.png'));
  await (await createSquareIcon(512, 0.12)).toFile(path.resolve(iconsDir, 'icon-512x512.png'));

  // 2. Maskable PWA icons (with solid matching boutique background #FAF8F5 and safe area padding)
  // Maskable safe zone is central 80% (padding ratio at least 20%)
  console.log('Generating maskable icons (with boutique background #FAF8F5)...');
  const boutiqueBg = { r: 250, g: 248, b: 245, alpha: 1 };
  await (await createSquareIcon(192, 0.22, boutiqueBg)).toFile(path.resolve(publicDir, 'pwa-maskable-192x192.png'));
  await (await createSquareIcon(192, 0.22, boutiqueBg)).toFile(path.resolve(iconsDir, 'icon-maskable-192x192.png'));
  await (await createSquareIcon(512, 0.22, boutiqueBg)).toFile(path.resolve(publicDir, 'pwa-maskable-512x512.png'));
  await (await createSquareIcon(512, 0.22, boutiqueBg)).toFile(path.resolve(iconsDir, 'icon-maskable-512x512.png'));

  // 3. Apple Touch Icon (180x180 with solid boutique background #FAF8F5)
  console.log('Generating apple-touch-icon.png (180x180)...');
  await (await createSquareIcon(180, 0.15, boutiqueBg)).toFile(path.resolve(publicDir, 'apple-touch-icon.png'));
  await (await createSquareIcon(180, 0.15, boutiqueBg)).toFile(path.resolve(iconsDir, 'apple-touch-icon.png'));

  // 4. Favicons (16, 32, 48, 64)
  console.log('Generating favicons...');
  await (await createSquareIcon(64, 0.08)).toFile(path.resolve(publicDir, 'favicon.png'));
  await (await createSquareIcon(32, 0.08)).toFile(path.resolve(publicDir, 'favicon-32x32.png'));
  await (await createSquareIcon(16, 0.08)).toFile(path.resolve(publicDir, 'favicon-16x16.png'));

  console.log('All PWA icons generated successfully from logo321.png!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
