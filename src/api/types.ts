/**
 * Types for WhatsApp Cloud API outbound messaging
 */

// Template component types
export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link?: string;
    id?: string;
  };
  document?: {
    link?: string;
    id?: string;
    filename?: string;
  };
  video?: {
    link?: string;
    id?: string;
  };
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: TemplateParameter[];
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

// Request types
export interface SendTextMessageRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
  context?: { message_id: string };
}

export interface SendTemplateMessageRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
      policy?: 'deterministic';
    };
    components?: TemplateComponent[];
  };
}

export type MessagePayload = SendTextMessageRequest | SendTemplateMessageRequest | Record<string, unknown>;

// Response types
export interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string; // WAMID
  }>;
}

export interface SuccessResponse {
  success: true;
}

// Registration request types
export interface RegisterPhoneRequest {
  messaging_product: 'whatsapp';
  pin: string;
}

export interface DeregisterPhoneRequest {
  messaging_product: 'whatsapp';
}

// Phone number types
export interface PhoneNumber {
  verified_name: string;
  display_phone_number: string;
  id: string;
  quality_rating: 'GREEN' | 'YELLOW' | 'RED' | 'NA';
}

export interface ListPhoneNumbersResponse {
  data: PhoneNumber[];
}
