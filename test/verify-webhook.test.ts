import { describe, it, expect } from 'vitest';
import { verifyWebhookSignature } from '../src/verify.js';
import { WABAClient } from '../src/client.js';
import { WABASignatureError } from '../src/errors.js';
import { loadFixture, TEST_APP_SECRET } from './fixtures.js';

describe('verifyWebhookSignature', () => {
  describe('valid signatures', () => {
    it('verifies text-message fixture signature', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(true);
    });

    it('verifies image-message fixture signature', () => {
      const fixture = loadFixture('image-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(true);
    });

    it('verifies sent-status fixture signature', () => {
      const fixture = loadFixture('sent-status');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(true);
    });

    it('verifies incoming-call fixture signature', () => {
      const fixture = loadFixture('incoming-call');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(true);
    });

    it('accepts rawBody as Buffer', () => {
      const fixture = loadFixture('text-message');
      const rawBody = Buffer.from(JSON.stringify(fixture.body), 'utf-8');

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(true);
    });
  });

  describe('invalid signatures', () => {
    it('returns false for wrong signature', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(false);
    });

    it('returns false for wrong app secret', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody,
        appSecret: 'wrong_secret',
      });

      expect(isValid).toBe(false);
    });

    it('returns false for modified body', () => {
      const fixture = loadFixture('text-message');
      const body = fixture.body as Record<string, unknown>;
      const modifiedBody = JSON.stringify({ ...body, tampered: true });

      const isValid = verifyWebhookSignature({
        signature: fixture.headers['x-hub-signature-256'],
        rawBody: modifiedBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(false);
    });

    it('returns false for missing signature', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: undefined,
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(false);
    });

    it('returns false for empty signature', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: '',
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(false);
    });

    it('returns false for signature with wrong length', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      const isValid = verifyWebhookSignature({
        signature: 'sha256=abc123',
        rawBody,
        appSecret: TEST_APP_SECRET,
      });

      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('throws WABASignatureError when appSecret is undefined', () => {
      const fixture = loadFixture('text-message');
      const rawBody = JSON.stringify(fixture.body);

      expect(() =>
        verifyWebhookSignature({
          signature: fixture.headers['x-hub-signature-256'],
          rawBody,
          appSecret: undefined,
        })
      ).toThrow(WABASignatureError);
    });
  });
});

describe('WABAClient.verifyWebhook', () => {
  it('verifies signature using client method', () => {
    const client = new WABAClient({
      accessToken: 'test-token',
      appSecret: TEST_APP_SECRET,
    });

    const fixture = loadFixture('text-message');
    const rawBody = JSON.stringify(fixture.body);

    const isValid = client.verifyWebhook(
      fixture.headers['x-hub-signature-256'],
      rawBody
    );

    expect(isValid).toBe(true);
  });

  it('throws WABASignatureError when appSecret not configured', () => {
    const client = new WABAClient({
      accessToken: 'test-token',
      // appSecret not provided
    });

    const fixture = loadFixture('text-message');
    const rawBody = JSON.stringify(fixture.body);

    expect(() =>
      client.verifyWebhook(fixture.headers['x-hub-signature-256'], rawBody)
    ).toThrow(WABASignatureError);
  });

  it('returns false for invalid signature', () => {
    const client = new WABAClient({
      accessToken: 'test-token',
      appSecret: TEST_APP_SECRET,
    });

    const fixture = loadFixture('text-message');
    const rawBody = JSON.stringify(fixture.body);

    const isValid = client.verifyWebhook(
      'sha256=invalid',
      rawBody
    );

    expect(isValid).toBe(false);
  });
});
