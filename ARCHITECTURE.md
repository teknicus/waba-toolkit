# waba-toolkit Architecture

A minimal, type-safe npm package for WhatsApp Business API webhook processing and media handling.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module format | ESM + CJS | Modern ESM primary, CJS for compatibility |
| HTTP client | Native fetch | Zero dependencies, Node 20+ native support |
| Auth pattern | Constructor injection | Clean API, token reuse across calls |
| Media return | Stream (default) + Buffer option | Flexibility for different use cases |
| Type detection | Discriminated unions | Type-safe narrowing in TypeScript |
| Node.js | 20+ | Native fetch, modern LTS |
| Validation | Types only | Zero runtime overhead, compile-time safety |
| Helper inputs | WebhookPayload | Consistent API, extract from top-level webhook |

---

## Package Structure

```
waba-toolkit/
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # WABAClient class (includes media download)
│   ├── errors.ts             # Error classes
│   ├── helpers.ts            # Utility helpers
│   ├── verify.ts             # Webhook signature verification
│   ├── api/
│   │   ├── index.ts          # API client exports
│   │   ├── client.ts         # WABAApiClient class
│   │   └── types.ts          # API request/response types
│   ├── webhooks/
│   │   ├── index.ts          # Webhook exports
│   │   ├── classify.ts       # Webhook type classification
│   │   └── messages.ts       # Message type classification
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   ├── client.ts         # Client options types
│   │   ├── media.ts          # Media response types
│   │   ├── webhooks.ts       # Webhook payload types
│   │   └── messages.ts       # Message type definitions
│   └── cli/                  # CLI implementation
│       ├── index.ts          # CLI entry point
│       ├── config-manager.ts # Configuration management
│       └── commands/         # CLI commands
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## Core API Design

> **Note:** Code examples below demonstrate how consumers use the package.
> Function calls like `handleIncomingMessage()` represent your application logic.

### 1. Client Initialization

```typescript
// ESM
import { WABAClient } from 'waba-toolkit';

// CommonJS
const { WABAClient } = require('waba-toolkit');

const client = new WABAClient({
  accessToken: 'your-access-token',
  apiVersion: 'v22.0',  // optional, defaults to 'v22.0'
});
```

### 2. Media Download

```typescript
// Returns ReadableStream (default)
const { stream, mimeType, sha256, fileSize } = await client.getMedia(mediaId);

// Returns ArrayBuffer
const { buffer, mimeType, sha256, fileSize } = await client.getMedia(mediaId, {
  asBuffer: true
});
```

### 3. Webhook Signature Verification

```typescript
import { verifyWebhookSignature } from 'waba-toolkit';

// In your webhook handler (Express, Fastify, etc.)
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.rawBody; // Must be raw Buffer, not parsed JSON

  const isValid = verifyWebhookSignature({
    signature,
    rawBody,
    appSecret: process.env.META_APP_SECRET,
  });

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process verified webhook...
});
```

### 4. Webhook Classification (after verification)

```typescript
import { classifyWebhook } from 'waba-toolkit';

const result = classifyWebhook(webhookPayload);

switch (result.type) {
  case 'message':
    // result.payload is typed as MessageWebhookValue
    handleIncomingMessage(result.payload.messages[0]);
    break;
  case 'status':
    // result.payload is typed as StatusWebhookValue
    updateMessageStatus(result.payload.statuses[0]);
    break;
  case 'call':
    // result.payload is typed as CallWebhookValue
    handleIncomingCall(result.payload.calls[0]);
    break;
  case 'unknown':
    // Unrecognized webhook type - log or ignore
    break;
}
```

### 5. Message Type Classification

```typescript
import { classifyMessage } from 'waba-toolkit';

const message = webhookPayload.entry[0].changes[0].value.messages[0];
const result = classifyMessage(message);

switch (result.type) {
  case 'text':
    processTextMessage(result.message.text.body);
    break;
  case 'image':
  case 'video':
  case 'document':
  case 'sticker':
    // All media types have: id, mime_type, sha256
    downloadMedia(result.message[result.type].id);
    break;
  case 'audio':
    // Audio has id, mime_type, sha256 + optional voice flag
    const isVoiceNote = result.message.audio.voice ?? false;
    processAudio(result.message.audio.id, isVoiceNote);
    break;
  case 'location':
    showOnMap(result.message.location.latitude, result.message.location.longitude);
    break;
  case 'contacts':
    importContacts(result.message.contacts);
    break;
  case 'interactive':
    // Button replies, list replies, flow responses
    handleInteractiveReply(result.message.interactive);
    break;
  case 'reaction':
    updateReaction(result.message.reaction.emoji);
    break;
  // ... other types
}
```

---

## Type Definitions

### Webhook Types (Discriminated Union)

```typescript
export type WebhookClassification =
  | { type: 'message'; payload: MessageWebhookValue }
  | { type: 'status'; payload: StatusWebhookValue }
  | { type: 'call'; payload: CallWebhookValue }
  | { type: 'unknown'; payload: unknown };
```

> **Note:** Errors are not a separate webhook type. They appear as:
> - `errors[]` array in message webhooks when `type: 'unknown'`
> - `errors[]` array in status webhooks when `status: 'failed'`

### Message Types (Discriminated Union)

```typescript
// Base fields present on all incoming messages
interface IncomingMessageBase {
  from: string;              // sender's phone number
  id: string;                // message ID (use for mark-as-read)
  timestamp: string;         // Unix epoch seconds as string
  type: string;              // message type
  context?: {                // present if reply or forwarded
    from?: string;           // original sender (for replies)
    id?: string;             // original message ID
    forwarded?: boolean;
    frequently_forwarded?: boolean;
  };
}

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
```

### Media Types

> **Note:** The package normalizes WABA's snake_case fields (`mime_type`, `file_size`)
> to camelCase (`mimeType`, `fileSize`) for idiomatic JavaScript/TypeScript usage.

```typescript
export interface MediaMetadata {
  id: string;
  mimeType: string;      // normalized from mime_type
  sha256: string;
  fileSize: number;      // normalized from file_size (string → number)
  url: string;           // Temporary URL (5 min expiry)
}

export interface MediaStreamResult extends MediaMetadata {
  stream: ReadableStream<Uint8Array>;
}

export interface MediaBufferResult extends MediaMetadata {
  buffer: ArrayBuffer;
}

export type MediaResult<T extends { asBuffer?: boolean }> =
  T extends { asBuffer: true } ? MediaBufferResult : MediaStreamResult;
```

---

## Webhook Payload Reference

Based on WABA API documentation, these are the webhook value types:

### Message Webhook Value
```typescript
interface MessageWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name?: string };  // name is optional per WABA docs
    wa_id: string;
  }>;
  messages?: Array<IncomingMessage>;
  errors?: Array<WebhookError>;  // present on error webhooks
}
```

### Status Webhook Value
```typescript
interface StatusWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  statuses: Array<{
    id: string;
    recipient_id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
    timestamp: string;
    conversation?: ConversationObject;
    pricing?: PricingObject;
    errors?: ErrorObject[];
  }>;
}
```

### Call Webhook Value
```typescript
interface CallWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name?: string };
    wa_id: string;
  }>;
  calls: Array<{
    id: string;
    from: string;
    to: string;
    event?: 'connect';                // present on connect webhooks
    direction: 'USER_INITIATED' | 'BUSINESS_INITIATED';
    timestamp: string;
    session?: { sdp_type: string; sdp: string };
    status?: string[];                // e.g. ['COMPLETED'] or ['FAILED'] on terminate
    start_time?: string;              // present on terminate if connected
    end_time?: string;
    duration?: number;                // seconds, present on terminate if connected
    errors?: { code: number; message: string };
  }>;
}
```

---

## Implementation Notes

### Media Download Flow

1. `GET /v22.0/{mediaId}` → Returns temporary URL + metadata
2. `GET {temporary_url}` → Returns binary stream/buffer

The temporary URL expires after **5 minutes**. The client should:
- Not cache URLs
- Retry with fresh URL on 404

### Webhook Entry Structure

All webhooks follow this envelope:
```typescript
{
  object: 'whatsapp_business_account',
  entry: [{
    id: string,           // WABA ID
    changes: [{
      value: { ... },     // Type-specific payload
      field: 'messages' | 'account_update' | 'calls' | ...
    }]
  }]
}
```

Classification is based on:
1. `field` value in changes
2. Presence of `messages`, `statuses`, or `calls` arrays in value

---

## File-by-File Implementation Plan

### 1. `src/types/webhooks.ts`
- Base webhook envelope types
- MessageWebhookValue, StatusWebhookValue, CallWebhookValue interfaces
- WebhookClassification discriminated union

### 2. `src/types/messages.ts`
- All 15 message type interfaces (TextMessage, ImageMessage, etc.)
- MediaObject base interface for image/audio/video/document/sticker
- MessageClassification discriminated union

### 3. `src/types/media.ts`
- MediaMetadata interface
- MediaStreamResult, MediaBufferResult interfaces
- GetMediaOptions type

### 4. `src/types/client.ts`
- WABAClientOptions interface
- API version literals

### 5. `src/client.ts`
- WABAClient class with constructor injection
- getMedia() method with stream/buffer option
- Internal fetch wrapper

### 6. `src/webhooks/classify.ts`
- classifyWebhook() function
- Returns WebhookClassification discriminated union

### 7. `src/webhooks/messages.ts`
- classifyMessage() function
- Returns MessageClassification discriminated union

### 8. `src/index.ts`
- Re-export WABAClient, classifyWebhook, classifyMessage
- Re-export all types

---

## Dependencies

**Library**: None (uses native fetch)

**CLI**:
- `commander` ^12.x (command parsing)
- `inquirer` ^9.x (interactive prompts)

**Development**:
- `typescript` ^5.x
- `tsup` ^8.x (zero-config bundler, uses esbuild under the hood)
- `vitest` ^4.x for testing

---

## package.json Essentials

```json
{
  "name": "waba-toolkit",
  "version": "0.3.1",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "engines": {
    "node": ">=20.0.0"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

## tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'node20',
  sourcemap: true,
});
```

---

## Final Decisions

| Question | Decision |
|----------|----------|
| Error handling | Throw typed errors (WABAError subclasses) |
| Default API version | v22.0 |
| Utility helpers | Include all 4 helpers below |

---

## WABAClient API

### constructor(options)

```typescript
interface WABAClientOptions {
  accessToken: string;       // Meta access token with whatsapp_business_messaging permission
  apiVersion?: string;       // Default: 'v22.0'
  baseUrl?: string;          // Default: 'https://graph.facebook.com'
}

const client = new WABAClient({ accessToken: 'your-token' });
```

### getMedia(mediaId, options?)

Downloads media from WhatsApp's servers using the two-step Meta API flow.

```typescript
/**
 * Fetches media by ID from WhatsApp Business API.
 *
 * Step 1: GET /{apiVersion}/{mediaId} → retrieves temporary URL + metadata
 * Step 2: GET {temporaryUrl} → downloads binary content
 *
 * @throws {WABAMediaError} - Media not found (404) or access denied
 * @throws {WABANetworkError} - Network/connection failures
 */
async getMedia(
  mediaId: string,
  options?: GetMediaOptions
): Promise<MediaStreamResult | MediaBufferResult>;

interface GetMediaOptions {
  asBuffer?: boolean;  // Default: false (returns stream)
}

interface MediaStreamResult {
  stream: ReadableStream<Uint8Array>;
  mimeType: string;
  sha256: string;
  fileSize: number;
  url: string;         // Temporary URL (expires in 5 min, for reference only)
}

interface MediaBufferResult {
  buffer: ArrayBuffer;
  mimeType: string;
  sha256: string;
  fileSize: number;
  url: string;
}
```

**Behavior notes:**
- Fetches a fresh temporary URL on every call (no caching)
- Temporary URL expires after 5 minutes
- On 404, throws `WABAMediaError` - caller can retry (see Retry Patterns)
- `mimeType` comes from Meta's metadata, not content-type header

---

## Utility Helpers

**Design Principle**: All helpers accept `WebhookPayload` as input for consistency. This provides a uniform API where users pass the top-level webhook object to any helper function.

### getContactInfo(webhook)
```typescript
/**
 * Extracts sender info from webhook payload.
 * Returns null if not a message/call webhook or contacts not present.
 */
function getContactInfo(webhook: WebhookPayload): {
  waId: string;
  profileName: string | undefined;
  phoneNumberId: string;
} | null;

// Usage
const contact = getContactInfo(webhookPayload);
if (contact) {
  await saveToDatabase(contact.waId, contact.profileName);
}
```

### getMessageId(webhook)
```typescript
/**
 * Extracts message ID from message or status webhook.
 * Returns null if not a message/status webhook or ID not present.
 */
function getMessageId(webhook: WebhookPayload): string | null;

// Usage
const messageId = getMessageId(webhookPayload);
if (messageId) {
  await markAsRead(messageId);
}
```

### getCallId(webhook)
```typescript
/**
 * Extracts call ID from call webhook.
 * Returns null if not a call webhook or ID not present.
 */
function getCallId(webhook: WebhookPayload): string | null;

// Usage
const callId = getCallId(webhookPayload);
if (callId) {
  await logCall(callId);
}
```

### extractMediaId(message)
```typescript
/**
 * Extracts media ID from any media message type.
 * Returns undefined if message has no media.
 *
 * Note: This helper operates on individual message objects,
 * not the webhook payload. Extract message first using
 * webhook.entry[0].changes[0].value.messages[0]
 */
function extractMediaId(message: IncomingMessage): string | undefined;

// Usage
const message = webhookPayload.entry[0].changes[0].value.messages?.[0];
if (message) {
  const mediaId = extractMediaId(message);
  if (mediaId) {
    const media = await client.getMedia(mediaId);
  }
}
```

### isMediaMessage(message)
```typescript
/**
 * Type guard: returns true if message contains downloadable media.
 * Narrows type to messages with image/audio/video/document/sticker.
 *
 * Note: This helper operates on individual message objects.
 */
function isMediaMessage(message: IncomingMessage): message is MediaMessage;

// Usage
const message = webhookPayload.entry[0].changes[0].value.messages?.[0];
if (message && isMediaMessage(message)) {
  const mediaId = extractMediaId(message); // guaranteed non-undefined
}
```

### getMessageTimestamp(message)
```typescript
/**
 * Parses message timestamp to Date object.
 * WhatsApp timestamps are Unix epoch seconds as strings.
 *
 * Note: This helper operates on individual message objects.
 */
function getMessageTimestamp(message: IncomingMessage): Date;

// Usage
const message = webhookPayload.entry[0].changes[0].value.messages?.[0];
if (message) {
  const sentAt = getMessageTimestamp(message);
  await logMessage({ receivedAt: sentAt, messageId: message.id });
}
```

---

## Error Types

```typescript
export class WABAError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WABAError';
  }
}

export class WABAMediaError extends WABAError {
  constructor(
    message: string,
    public readonly mediaId: string,
    code?: number
  ) {
    super(message, code);
    this.name = 'WABAMediaError';
  }
}

export class WABANetworkError extends WABAError {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'WABANetworkError';
  }
}
```

---

## Webhook Signature Verification

Meta requires verifying the `X-Hub-Signature-256` header on all webhook requests. This prevents spoofed webhooks from malicious actors.

```typescript
/**
 * Verifies webhook signature using HMAC-SHA256.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyWebhookSignature(options: {
  signature: string | undefined;  // X-Hub-Signature-256 header
  rawBody: Buffer | string;       // Raw request body (NOT parsed JSON)
  appSecret: string;              // Meta App Secret
}): boolean;
```

**Implementation notes:**
- Must use raw body bytes, not `JSON.stringify(req.body)` (whitespace differs)
- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Returns `false` if signature header is missing

---

## Retry Patterns (Documentation)

Media URLs expire after **5 minutes**. The `getMedia()` function fetches a fresh URL on each call, so retry is straightforward:

```typescript
import { WABAClient, WABAMediaError } from 'waba-toolkit';

const client = new WABAClient({ accessToken: '...' });

async function downloadWithRetry(mediaId: string, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.getMedia(mediaId);
    } catch (e) {
      if (e instanceof WABAMediaError && e.code === 404 && attempt < maxRetries) {
        // URL expired or media not ready, retry with fresh URL
        continue;
      }
      throw e;
    }
  }
}
```

**Why not built-in retry?**
- Retry strategies are application-specific (backoff, max attempts, timeout)
- Many projects already use retry libraries (`p-retry`, `async-retry`)
- Keeps the package minimal and unopinionated

---

## Exported Types

All types are exported for user extensions:

```typescript
// Client types
export type { WABAClientOptions } from './types/client';

// Media types
export type {
  MediaMetadata,
  MediaStreamResult,
  MediaBufferResult,
  GetMediaOptions,
} from './types/media';

// Webhook types
export type {
  WebhookPayload,
  WebhookEntry,
  WebhookChange,
  MessageWebhookValue,
  StatusWebhookValue,
  CallWebhookValue,
  WebhookClassification,
} from './types/webhooks';

// Message types
export type {
  IncomingMessage,
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
  MediaMessage,  // Union of all media types
  MessageClassification,
} from './types/messages';

// Error types
export { WABAError, WABAMediaError, WABANetworkError } from './errors';
```

