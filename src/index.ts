// Main client
export { WABAClient } from './client.js';

// API client for outbound messaging
export { WABAApiClient } from './api/index.js';
export type {
  WABAApiClientOptions,
  SendTextMessageRequest,
  SendTemplateMessageRequest,
  SendMessageResponse,
  SuccessResponse,
  MessagePayload,
  RegisterPhoneRequest,
  DeregisterPhoneRequest,
  TemplateParameter,
  TemplateComponent,
  PhoneNumber,
  ListPhoneNumbersResponse,
  // Flow types
  FlowCategory,
  CreateFlowOptions,
  CreateFlowResponse,
  FlowValidationError,
  UpdateFlowJsonResponse,
  PublishFlowResponse,
  FlowStatus,
  FlowListItem,
  ListFlowsResponse,
  // Template management types
  TemplateCategory,
  TemplateStatus,
  TemplateComponentDefinition,
  TemplateListItem,
  ListTemplatesResponse,
  CreateTemplateRequest,
  CreateTemplateResponse,
  DeleteTemplateResponse,
} from './api/index.js';

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
  getMessageId,
  getCallId,
} from './helpers.js';
export type { ContactInfo } from './helpers.js';

// Error classes
export {
  WABAError,
  WABAMediaError,
  WABANetworkError,
  WABASignatureError,
  WABAConfigError,
  WABAAuthError,
  WABASendError,
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
