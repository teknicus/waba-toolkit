import type { IncomingMessage } from './messages.js';

/** Top-level webhook payload from Meta */
export interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  /** WABA ID */
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

/** Union of possible webhook value types */
export type WebhookValue =
  | MessageWebhookValue
  | StatusWebhookValue
  | CallWebhookValue;

/** Contact info included in webhooks */
export interface WebhookContact {
  profile: {
    /** Sender's profile name (optional per WABA docs) */
    name?: string;
  };
  wa_id: string;
}

/** Metadata included in all webhook values */
export interface WebhookMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

/** Error object in webhooks */
export interface WebhookError {
  code: number;
  title: string;
  message?: string;
  error_data?: {
    details: string;
  };
}

/** Webhook value for incoming messages */
export interface MessageWebhookValue {
  messaging_product: 'whatsapp';
  metadata: WebhookMetadata;
  contacts?: WebhookContact[];
  messages?: IncomingMessage[];
  errors?: WebhookError[];
}

/** Status update types */
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';

/** Conversation origin types */
export type ConversationOriginType =
  | 'business_initiated'
  | 'user_initiated'
  | 'referral_conversion';

/** Conversation object in status webhooks */
export interface ConversationObject {
  id: string;
  origin: {
    type: ConversationOriginType;
  };
  expiration_timestamp?: string;
}

/** Pricing model types */
export type PricingModel = 'CBP' | 'NBP';

/** Pricing category types */
export type PricingCategory =
  | 'business_initiated'
  | 'user_initiated'
  | 'referral_conversion'
  | 'authentication'
  | 'marketing'
  | 'utility'
  | 'service';

/** Pricing object in status webhooks */
export interface PricingObject {
  billable: boolean;
  pricing_model: PricingModel;
  category: PricingCategory;
}

/** Individual status entry */
export interface StatusEntry {
  id: string;
  recipient_id: string;
  status: MessageStatus;
  timestamp: string;
  conversation?: ConversationObject;
  pricing?: PricingObject;
  errors?: WebhookError[];
}

/** Webhook value for message status updates */
export interface StatusWebhookValue {
  messaging_product: 'whatsapp';
  metadata: WebhookMetadata;
  statuses: StatusEntry[];
}

/** Call entry in call webhooks */
export interface CallEntry {
  id: string;
  from: string;
  to: string;
  /** Present on connect webhooks */
  event?: 'connect';
  direction: 'USER_INITIATED' | 'BUSINESS_INITIATED';
  timestamp: string;
  session?: {
    sdp_type: string;
    sdp: string;
  };
  /** e.g. ['COMPLETED'] or ['FAILED'] on terminate */
  status?: string[];
  /** Present on terminate if connected */
  start_time?: string;
  end_time?: string;
  /** Seconds, present on terminate if connected */
  duration?: number;
  errors?: {
    code: number;
    message: string;
  };
}

/** Webhook value for call events */
export interface CallWebhookValue {
  messaging_product: 'whatsapp';
  metadata: WebhookMetadata;
  contacts?: WebhookContact[];
  calls: CallEntry[];
}

/** Discriminated union for webhook classification results */
export type WebhookClassification =
  | { type: 'message'; payload: MessageWebhookValue }
  | { type: 'status'; payload: StatusWebhookValue }
  | { type: 'call'; payload: CallWebhookValue }
  | { type: 'unknown'; payload: unknown };
