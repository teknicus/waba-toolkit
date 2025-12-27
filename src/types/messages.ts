/** Context object for replies and forwarded messages */
export interface MessageContext {
  /** Original sender (for replies) */
  from?: string;
  /** Original message ID */
  id?: string;
  forwarded?: boolean;
  frequently_forwarded?: boolean;
  /** Present for product enquiry messages */
  referred_product?: {
    catalog_id: string;
    product_retailer_id: string;
  };
}

/** Identity object for security notifications */
export interface MessageIdentity {
  /** State of acknowledgment for latest user_identity_changed system notification */
  acknowledged: boolean;
  /** Timestamp when the WhatsApp Business API detected the user potentially changed */
  created_timestamp: string;
  /** Identifier for the latest user_identity_changed system notification */
  hash: string;
}

/** Base fields present on all incoming messages */
export interface IncomingMessageBase {
  /** Sender's phone number */
  from: string;
  /** Message ID (use for mark-as-read) */
  id: string;
  /** Unix epoch seconds as string */
  timestamp: string;
  /** Message type */
  type: string;
  /** Present if reply or forwarded */
  context?: MessageContext;
  /** Present if show_security_notifications is enabled in application settings */
  identity?: MessageIdentity;
}

/** Text message */
export interface TextMessage extends IncomingMessageBase {
  type: 'text';
  text: {
    body: string;
  };
}

/** Media object base (shared by image, audio, video, document, sticker) */
export interface MediaObject {
  id: string;
  mime_type: string;
  sha256: string;
  caption?: string;
}

/** Image message */
export interface ImageMessage extends IncomingMessageBase {
  type: 'image';
  image: MediaObject;
}

/** Audio message */
export interface AudioMessage extends IncomingMessageBase {
  type: 'audio';
  audio: MediaObject & {
    /** True if voice note */
    voice?: boolean;
  };
}

/** Video message */
export interface VideoMessage extends IncomingMessageBase {
  type: 'video';
  video: MediaObject;
}

/** Document message */
export interface DocumentMessage extends IncomingMessageBase {
  type: 'document';
  document: MediaObject & {
    filename?: string;
  };
}

/** Sticker message */
export interface StickerMessage extends IncomingMessageBase {
  type: 'sticker';
  sticker: MediaObject & {
    animated?: boolean;
  };
}

/** Location message */
export interface LocationMessage extends IncomingMessageBase {
  type: 'location';
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

/** Contact in contacts message */
export interface ContactCard {
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
  };
  phones?: Array<{
    phone?: string;
    type?: string;
    wa_id?: string;
  }>;
  emails?: Array<{
    email?: string;
    type?: string;
  }>;
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: string;
  }>;
  org?: {
    company?: string;
    department?: string;
    title?: string;
  };
  urls?: Array<{
    url?: string;
    type?: string;
  }>;
  birthday?: string;
}

/** Contacts message */
export interface ContactsMessage extends IncomingMessageBase {
  type: 'contacts';
  contacts: ContactCard[];
}

/** Button reply object */
export interface ButtonReply {
  id: string;
  title: string;
}

/** List reply object */
export interface ListReply {
  id: string;
  title: string;
  description?: string;
}

/** Flow (NFM) reply object */
export interface NfmReply {
  /** JSON string containing the flow response data */
  response_json: string;
  /** Optional body text */
  body?: string;
  /** Flow name */
  name?: string;
  /** Flow token for tracking/correlation */
  flow_token?: string;
}

/** Interactive message (button/list replies, flow responses) */
export interface InteractiveMessage extends IncomingMessageBase {
  type: 'interactive';
  interactive: {
    type: 'button_reply' | 'list_reply' | 'nfm_reply';
    button_reply?: ButtonReply;
    list_reply?: ListReply;
    nfm_reply?: NfmReply;
  };
}

/** Reaction message */
export interface ReactionMessage extends IncomingMessageBase {
  type: 'reaction';
  reaction: {
    message_id: string;
    emoji: string;
  };
}

/** Button message (quick reply button click) */
export interface ButtonMessage extends IncomingMessageBase {
  type: 'button';
  button: {
    text: string;
    payload: string;
  };
}

/** Order message */
export interface OrderMessage extends IncomingMessageBase {
  type: 'order';
  order: {
    catalog_id: string;
    product_items: Array<{
      product_retailer_id: string;
      quantity: number;
      item_price: number;
      currency: string;
    }>;
    text?: string;
  };
}

/** System message (number change, identity change) */
export interface SystemMessage extends IncomingMessageBase {
  type: 'system';
  system: {
    body: string;
    type: 'user_changed_number' | 'user_identity_changed';
    new_wa_id?: string;
    identity?: string;
    user?: string;
  };
}

/** Referral message (click-to-WhatsApp ads) */
export interface ReferralMessage extends IncomingMessageBase {
  type: 'referral';
  referral: {
    source_url: string;
    source_type: string;
    source_id: string;
    headline?: string;
    body?: string;
    media_type?: string;
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
  };
}

/** Unsupported/unknown message type */
export interface UnsupportedMessage extends IncomingMessageBase {
  type: 'unsupported' | 'unknown';
  errors?: Array<{
    code: number;
    title: string;
    details?: string;
  }>;
}

/** Union of all incoming message types */
export type IncomingMessage =
  | TextMessage
  | ImageMessage
  | AudioMessage
  | VideoMessage
  | DocumentMessage
  | StickerMessage
  | LocationMessage
  | ContactsMessage
  | InteractiveMessage
  | ReactionMessage
  | ButtonMessage
  | OrderMessage
  | SystemMessage
  | ReferralMessage
  | UnsupportedMessage;

/** Union of media message types */
export type MediaMessage =
  | ImageMessage
  | AudioMessage
  | VideoMessage
  | DocumentMessage
  | StickerMessage;

/** Discriminated union for message classification results */
export type MessageClassification =
  | { type: 'text'; message: TextMessage }
  | { type: 'image'; message: ImageMessage }
  | { type: 'video'; message: VideoMessage }
  | { type: 'audio'; message: AudioMessage }
  | { type: 'document'; message: DocumentMessage }
  | { type: 'sticker'; message: StickerMessage }
  | { type: 'location'; message: LocationMessage }
  | { type: 'contacts'; message: ContactsMessage }
  | { type: 'interactive'; message: InteractiveMessage }
  | { type: 'reaction'; message: ReactionMessage }
  | { type: 'button'; message: ButtonMessage }
  | { type: 'order'; message: OrderMessage }
  | { type: 'system'; message: SystemMessage }
  | { type: 'referral'; message: ReferralMessage }
  | { type: 'unsupported'; message: UnsupportedMessage };
