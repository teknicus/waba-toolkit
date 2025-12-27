import type {
  WebhookPayload,
  WebhookClassification,
  MessageWebhookValue,
  StatusWebhookValue,
  CallWebhookValue,
} from '../types/webhooks.js';

/**
 * Classifies a webhook payload into its type.
 * Returns a discriminated union for type-safe handling.
 */
export function classifyWebhook(payload: WebhookPayload): WebhookClassification {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) {
    return { type: 'unknown', payload };
  }

  // Check for calls array (call webhooks)
  if ('calls' in value && Array.isArray(value.calls)) {
    return { type: 'call', payload: value as CallWebhookValue };
  }

  // Check for statuses array (status webhooks)
  if ('statuses' in value && Array.isArray(value.statuses)) {
    return { type: 'status', payload: value as StatusWebhookValue };
  }

  // Check for messages array (message webhooks)
  if ('messages' in value && Array.isArray(value.messages)) {
    return { type: 'message', payload: value as MessageWebhookValue };
  }

  // Check for errors without messages (error webhook)
  if ('errors' in value && Array.isArray(value.errors)) {
    return { type: 'message', payload: value as MessageWebhookValue };
  }

  return { type: 'unknown', payload };
}
