import type {
  IncomingMessage,
  MediaMessage,
  ImageMessage,
  AudioMessage,
  VideoMessage,
  DocumentMessage,
  StickerMessage,
} from './types/messages.js';
import type { WebhookPayload } from './types/webhooks.js';

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
 * Returns undefined if the webhook doesn't contain message contact info.
 */
export function getContactInfo(webhook: WebhookPayload): ContactInfo | undefined {
  const entry = webhook.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value || !('contacts' in value) || !value.contacts?.length) {
    return undefined;
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
