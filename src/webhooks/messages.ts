import type {
  IncomingMessage,
  MessageClassification,
  TextMessage,
  ImageMessage,
  AudioMessage,
  VideoMessage,
  DocumentMessage,
  StickerMessage,
  LocationMessage,
  ContactsMessage,
  InteractiveMessage,
  ReactionMessage,
  ButtonMessage,
  OrderMessage,
  SystemMessage,
  ReferralMessage,
  UnsupportedMessage,
} from '../types/messages.js';

/**
 * Classifies an incoming message by its type.
 * Returns a discriminated union for type-safe handling.
 */
export function classifyMessage(message: IncomingMessage): MessageClassification {
  switch (message.type) {
    case 'text':
      return { type: 'text', message: message as TextMessage };
    case 'image':
      return { type: 'image', message: message as ImageMessage };
    case 'audio':
      return { type: 'audio', message: message as AudioMessage };
    case 'video':
      return { type: 'video', message: message as VideoMessage };
    case 'document':
      return { type: 'document', message: message as DocumentMessage };
    case 'sticker':
      return { type: 'sticker', message: message as StickerMessage };
    case 'location':
      return { type: 'location', message: message as LocationMessage };
    case 'contacts':
      return { type: 'contacts', message: message as ContactsMessage };
    case 'interactive':
      return { type: 'interactive', message: message as InteractiveMessage };
    case 'reaction':
      return { type: 'reaction', message: message as ReactionMessage };
    case 'button':
      return { type: 'button', message: message as ButtonMessage };
    case 'order':
      return { type: 'order', message: message as OrderMessage };
    case 'system':
      return { type: 'system', message: message as SystemMessage };
    case 'referral':
      return { type: 'referral', message: message as ReferralMessage };
    default:
      return { type: 'unsupported', message: message as UnsupportedMessage };
  }
}
