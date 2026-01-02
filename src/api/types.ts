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

// Flow types
export type FlowCategory =
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'APPOINTMENT_BOOKING'
  | 'LEAD_GENERATION'
  | 'CONTACT_US'
  | 'CUSTOMER_SUPPORT'
  | 'SURVEY'
  | 'OTHER';

export interface CreateFlowOptions {
  name: string;
  categories?: FlowCategory[];
  endpointUri?: string;
  cloneFlowId?: string;
}

export interface CreateFlowResponse {
  id: string;
}

export interface FlowValidationError {
  error: string;
  error_type: string;
  message: string;
  line_start: number;
  line_end: number;
  column_start: number;
  column_end: number;
}

export interface UpdateFlowJsonResponse {
  success: boolean;
  validation_errors: FlowValidationError[];
}

export interface PublishFlowResponse {
  success: boolean;
}

export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'BLOCKED' | 'THROTTLED';

export interface FlowListItem {
  id: string;
  name: string;
  status: FlowStatus;
  categories: FlowCategory[];
  validation_errors: FlowValidationError[];
}

export interface ListFlowsResponse {
  data: FlowListItem[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

// Template management types
export type TemplateCategory =
  | 'AUTHENTICATION'
  | 'MARKETING'
  | 'UTILITY';

export type TemplateStatus =
  | 'APPROVED'
  | 'IN_APPEAL'
  | 'PENDING'
  | 'REJECTED'
  | 'PENDING_DELETION'
  | 'DELETED'
  | 'DISABLED'
  | 'PAUSED'
  | 'LIMIT_EXCEEDED';

export interface TemplateComponentDefinition {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  text?: string;
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
    phone_number?: string;
    [key: string]: unknown;
  }>;
  example?: {
    header_text?: string[];
    header_handle?: string[];
    body_text?: string[][];
  };
  [key: string]: unknown;
}

export interface TemplateListItem {
  id: string;
  name: string;
  language: string;
  status: TemplateStatus;
  category: TemplateCategory;
  previous_category?: TemplateCategory;
  components: TemplateComponentDefinition[];
}

export interface ListTemplatesResponse {
  data: TemplateListItem[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface CreateTemplateRequest {
  name: string;
  language: string;
  category: TemplateCategory;
  components: TemplateComponentDefinition[];
  allow_category_change?: boolean;
}

export interface CreateTemplateResponse {
  id: string;
  status: TemplateStatus;
  category: TemplateCategory;
}

export interface DeleteTemplateResponse {
  success: boolean;
}
