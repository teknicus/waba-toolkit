import type {
  IncomingMessage,
  MediaMessage,
  ImageMessage,
  AudioMessage,
  VideoMessage,
  DocumentMessage,
  StickerMessage,
} from './types/messages.js';
import type {
  WebhookPayload,
  MessageWebhookValue,
  StatusWebhookValue,
  CallWebhookValue,
} from './types/webhooks.js';

const MEDIA_TYPES = new Set(['image', 'audio', 'video', 'document', 'sticker']);

/**
 * Type guard: returns true if message contains downloadable media.
 * Narrows type to messages with image/audio/video/document/sticker.
 */
export function isMediaMessage(message: IncomingMessage): message is MediaMessage {
  return MEDIA_TYPES.has(message.type);
}

/**
 * Extracts media ID from any media message type.
 * Returns undefined if message has no media.
 */
export function extractMediaId(message: IncomingMessage): string | undefined {
  if (!isMediaMessage(message)) {
    return undefined;
  }

  switch (message.type) {
    case 'image':
      return (message as ImageMessage).image.id;
    case 'audio':
      return (message as AudioMessage).audio.id;
    case 'video':
      return (message as VideoMessage).video.id;
    case 'document':
      return (message as DocumentMessage).document.id;
    case 'sticker':
      return (message as StickerMessage).sticker.id;
    default:
      return undefined;
  }
}

export interface ContactInfo {
  waId: string;
  profileName: string | undefined;
  phoneNumberId: string;
}

/**
 * Extracts sender info from webhook payload.
 * Returns null if the webhook doesn't contain message contact info.
 */
export function getContactInfo(webhook: WebhookPayload): ContactInfo | null {
  const entry = webhook.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value || !('contacts' in value) || !value.contacts?.length) {
    return null;
  }

  const contact = value.contacts[0];
  const metadata = value.metadata;

  return {
    waId: contact.wa_id,
    profileName: contact.profile?.name,
    phoneNumberId: metadata.phone_number_id,
  };
}

/**
 * Parses message timestamp to Date object.
 * WhatsApp timestamps are Unix epoch seconds as strings.
 */
export function getMessageTimestamp(message: IncomingMessage): Date {
  const epochSeconds = parseInt(message.timestamp, 10);
  return new Date(epochSeconds * 1000);
}

/**
 * Extracts message ID from message or status webhook.
 * Returns null if not a message/status webhook or ID not present.
 */
export function getMessageId(webhook: WebhookPayload): string | null {
  const entry = webhook.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) {
    return null;
  }

  // Try message webhook
  if ('messages' in value) {
    const messageValue = value as MessageWebhookValue;
    return messageValue.messages?.[0]?.id ?? null;
  }

  // Try status webhook
  if ('statuses' in value) {
    const statusValue = value as StatusWebhookValue;
    return statusValue.statuses?.[0]?.id ?? null;
  }

  return null;
}

/**
 * Extracts call ID from call webhook.
 * Returns null if not a call webhook or ID not present.
 */
export function getCallId(webhook: WebhookPayload): string | null {
  const entry = webhook.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) {
    return null;
  }

  // Check if it's a call webhook
  if ('calls' in value) {
    const callValue = value as CallWebhookValue;
    return callValue.calls?.[0]?.id ?? null;
  }

  return null;
}
