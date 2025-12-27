import { createHmac, timingSafeEqual } from 'node:crypto';
import { WABASignatureError } from './errors.js';

export interface VerifyWebhookSignatureOptions {
  /** X-Hub-Signature-256 header value */
  signature: string | undefined;
  /** Raw request body (NOT parsed JSON) */
  rawBody: Buffer | string;
  /** Meta App Secret */
  appSecret: string | undefined;
}

/**
 * Verifies webhook signature using HMAC-SHA256.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @throws {WABASignatureError} If appSecret is not provided
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  options: VerifyWebhookSignatureOptions
): boolean {
  const { signature, rawBody, appSecret } = options;

  if (!appSecret) {
    throw new WABASignatureError('appSecret is required for webhook verification');
  }

  if (!signature) {
    return false;
  }

  // Remove 'sha256=' prefix if present
  const signatureHash = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature;

  // Compute expected signature
  const hmac = createHmac('sha256', appSecret);
  const bodyBuffer =
    typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody;
  const expectedHash = hmac.update(bodyBuffer).digest('hex');

  // Convert to buffers for timing-safe comparison
  const signatureBuffer = Buffer.from(signatureHash, 'utf-8');
  const expectedBuffer = Buffer.from(expectedHash, 'utf-8');

  // Ensure same length before comparison
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}
