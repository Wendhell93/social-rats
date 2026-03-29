/**
 * Generate all brand assets from logo-full.png (2x2 grid, 1536x1024)
 *
 * Quadrants:
 *   Top-left (0,0 - 768,512):      Dark bg, neon glow rat + "SocialRats"
 *   Top-right (768,0 - 1536,512):   App icon (purple rounded square) + "SocialRats" on white
 *   Bottom-left (0,512 - 768,1024): iPhone mockup
 *   Bottom-right (768,512 - ...):   Light bg outline rat + "SocialRats"
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PUBLIC = join(import.meta.dirname, '..', 'public');
const source = join(PUBLIC, 'logo-full.png');

async function main() {
  const meta = await sharp(source).metadata();
  const w = meta.width;   // 1536
  const h = meta.height;  // 1024
  const halfW = Math.floor(w / 2); // 768
  const halfH = Math.floor(h / 2); // 512

  console.log(`Source: ${w}x${h}`);

  // ── Extract top-right: app icon (purple rounded square) ──
  // The icon is in the top portion of the top-right quadrant (above text)
  const topRightBuf = await sharp(source)
    .extract({ left: halfW, top: 0, width: halfW, height: Math.floor(halfH * 0.72) })
    .toBuffer();
  const iconTrimmed = await sharp(topRightBuf).trim().toBuffer();

  // favicon-32x32.png
  await sharp(iconTrimmed)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  // favicon-16x16.png
  await sharp(iconTrimmed)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png');

  // apple-touch-icon.png (180x180)
  await sharp(iconTrimmed)
    .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(180, 180)
    .png()
    .toFile(join(PUBLIC, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // Logo 192x192 for PWA
  await sharp(iconTrimmed)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC, 'logo-192.png'));
  console.log('✓ logo-192.png');

  // Logo 512x512 for PWA
  await sharp(iconTrimmed)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC, 'logo-512.png'));
  console.log('✓ logo-512.png');

  // Generate .ico from 32px
  const pngToIco = (await import('png-to-ico')).default;
  // Need a version with opaque bg for .ico
  await sharp(iconTrimmed)
    .resize(32, 32, { fit: 'contain', background: { r: 12, g: 14, b: 26, alpha: 255 } })
    .flatten({ background: { r: 12, g: 14, b: 26 } })
    .png()
    .toFile(join(PUBLIC, 'favicon-ico-src.png'));
  const icoBuffer = await pngToIco(join(PUBLIC, 'favicon-ico-src.png'));
  writeFileSync(join(PUBLIC, 'favicon.ico'), icoBuffer);
  // Clean up temp
  const { unlinkSync } = await import('fs');
  unlinkSync(join(PUBLIC, 'favicon-ico-src.png'));
  console.log('✓ favicon.ico');

  // ── Sidebar icon (40x40) ──
  await sharp(iconTrimmed)
    .resize(40, 40, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC, 'logo-icon-40.png'));
  console.log('✓ logo-icon-40.png');

  // ── Sidebar logo with text: extract full top-left quadrant ──
  const topLeftBuf = await sharp(source)
    .extract({ left: 0, top: 0, width: halfW, height: halfH })
    .toBuffer();
  const sidebarTrimmed = await sharp(topLeftBuf).trim().toBuffer();
  await sharp(sidebarTrimmed)
    .resize(160, null, { fit: 'inside' })
    .png()
    .toFile(join(PUBLIC, 'logo-sidebar.png'));
  console.log('✓ logo-sidebar.png');

  // ── OG Image (1200x630): dark bg + top-left logo centered ──
  const ogLogo = await sharp(sidebarTrimmed)
    .resize(500, 530, { fit: 'inside' })
    .toBuffer();

  const ogMeta = await sharp(ogLogo).metadata();
  const ogLeft = Math.floor((1200 - ogMeta.width) / 2);
  const ogTop = Math.floor((630 - ogMeta.height) / 2);

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 12, g: 14, b: 26, alpha: 255 },
    },
  })
    .png()
    .composite([{ input: ogLogo, left: ogLeft, top: ogTop }])
    .toFile(join(PUBLIC, 'og-image.png'));
  console.log('✓ og-image.png (1200x630)');

  console.log('\n✅ All assets generated!');
}

main().catch(console.error);
