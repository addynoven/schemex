import { describe, it } from 'node:test';
import assert from 'node:assert';
import { optimizeCloudinaryUrl, cloudinary } from '../cloudinary';

describe('Cloudinary Storage Helper', () => {
  it('returns original url if not hosted on cloudinary', () => {
    const rawUrl = 'https://example.com/images/doc.png';
    assert.strictEqual(optimizeCloudinaryUrl(rawUrl), rawUrl);
  });

  it('injects f_auto, q_auto, and width transformations for images', () => {
    const originalUrl =
      'https://res.cloudinary.com/dzao8h1ay/image/upload/v1789373267/vault/user_1/test_card.png';
    const optimized = optimizeCloudinaryUrl(originalUrl, { width: 400 });

    assert.ok(optimized.includes('f_auto,q_auto,w_400'));
    assert.ok(optimized.includes('vault/user_1/test_card.png'));
    assert.strictEqual(
      optimized.startsWith('https://res.cloudinary.com/dzao8h1ay/image/upload/f_auto,q_auto,w_400/'),
      true
    );
  });

  it('supports custom dimensions and crop modes', () => {
    const originalUrl =
      'https://res.cloudinary.com/dzao8h1ay/image/upload/v1/profiles/user_99.png';
    const optimized = optimizeCloudinaryUrl(originalUrl, {
      width: 200,
      height: 200,
      crop: 'thumb',
    });

    assert.ok(optimized.includes('w_200,h_200,c_thumb'));
  });

  it('generates deterministic SHA1 signatures matching Cloudinary specification', () => {
    const testString = 'folder=scheme_vault&timestamp=1789915893TWQzFg_c4N28mPs3g07qlC29HT8';
    const hash = cloudinary.sha1(testString);
    assert.strictEqual(hash, '27f2ef1b2e9d1c804375985d9447f06f8412873a');
  });

  it('uploadToCloudinary formats upload result and CDN secure_url correctly', async () => {
    const res = await cloudinary.upload({
      uri: 'file:///data/user/0/scheme/cache/aadhaar.jpg',
      fileName: 'aadhaar.jpg',
      mimeType: 'image/jpeg',
      folder: 'scheme_vault',
    });

    assert.ok(res.public_id.includes('scheme_vault/'));
    assert.ok(res.secure_url.includes('cloudinary.com/dzao8h1ay/image/upload/'));
    assert.strictEqual(res.format, 'jpeg');
  });
});
