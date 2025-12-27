// Main client
export { WABAClient } from './client.js';

// Webhook classification
export { classifyWebhook, classifyMessage } from './webhooks/index.js';

// Signature verification
export { verifyWebhookSignature } from './verify.js';
export type { VerifyWebhookSignatureOptions } from './verify.js';

// Utility helpers
export {
  isMediaMessage,
  extractMediaId,
  getContactInfo,
  getMessageTimestamp,
} from './helpers.js';
export type { ContactInfo } from './helpers.js';

// Error classes
export {
  WABAError,
  WABAMediaError,
  WABANetworkError,
  WABASignatureError,
} from './errors.js';

// Types
export type {
  // Client types
  WABAClientOptions,
  GetMediaOptions,
  // Media types
  MediaMetadata,
  MediaStreamResult,
  MediaBufferResult,
  // Webhook types
  WebhookPayload,
  WebhookEntry,
  WebhookChange,
  WebhookValue,
  WebhookContact,
  WebhookMetadata,
  WebhookError,
  MessageWebhookValue,
  StatusWebhookValue,
  CallWebhookValue,
  MessageStatus,
  ConversationObject,
  PricingObject,
  StatusEntry,
  CallEntry,
  WebhookClassification,
  // Message types
  MessageContext,
  IncomingMessageBase,
  TextMessage,
  MediaObject,
  ImageMessage,
  AudioMessage,
  VideoMessage,
  DocumentMessage,
  StickerMessage,
  LocationMessage,
  ContactCard,
  ContactsMessage,
  ButtonReply,
  ListReply,
  InteractiveMessage,
  ReactionMessage,
  ButtonMessage,
  OrderMessage,
  SystemMessage,
  ReferralMessage,
  UnsupportedMessage,
  IncomingMessage,
  MediaMessage,
  MessageClassification,
} from './types/index.js';
