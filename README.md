# waba-toolkit

Type-safe, zero-dependency WhatsApp Business API toolkit for webhooks, media downloads, and signature verification.

> **Note:** This is not an official Meta/WhatsApp package, nor is it a full API wrapper. It is a utility toolkit derived from patterns across several production projects that interface directly with the WhatsApp Business API (Cloud API).

---

## Table of Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [WABAClient](#wabaclient)
  - [Webhook Functions](#webhook-functions)
  - [Helper Functions](#helper-functions)
  - [Error Classes](#error-classes)
- [Types](#types)
- [License](#license)

---

## Installation

```bash
npm install waba-toolkit
```

---

## Requirements

- Node.js 20+
- A valid Meta access token with `whatsapp_business_messaging` permission

---

## Quick Start

```typescript
import {
  WABAClient,
  classifyWebhook,
  classifyMessage,
  getContactInfo,
  getMessageId,
  isMediaMessage,
  extractMediaId,
} from 'waba-toolkit';

// Initialize client
const client = new WABAClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  appSecret: process.env.META_APP_SECRET,  // Required for webhook verification
});

// In your webhook handler
app.post('/webhook', async (req, res) => {
  // 1. Verify signature
  const isValid = client.verifyWebhook(
    req.headers['x-hub-signature-256'],
    req.rawBody
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Classify webhook type
  const webhook = classifyWebhook(req.body);

  if (webhook.type === 'message') {
    // 3. Extract contact info
    const contact = getContactInfo(req.body);
    if (contact) {
      console.log('From:', contact.waId, contact.profileName);
    }

    // 4. Get message ID for marking as read
    const messageId = getMessageId(req.body);

    const message = webhook.payload.messages?.[0];
    if (!message) return res.sendStatus(200);

    // 5. Classify message type
    const classified = classifyMessage(message);

    if (classified.type === 'text') {
      console.log('Text:', classified.message.text.body);
    }

    // 6. Handle media messages
    if (isMediaMessage(message)) {
      const mediaId = extractMediaId(message);
      const { stream, mimeType } = await client.getMedia(mediaId);
      // Process stream...
    }

    // 7. Mark as read
    if (messageId) {
      await markAsRead(messageId);
    }
  }

  res.sendStatus(200);
});
```

---

## API Reference

### WABAClient

Client for downloading media from WhatsApp Business API.

#### Constructor

```typescript
const client = new WABAClient({
  accessToken: string,      // Required: Meta access token
  appSecret?: string,       // Optional: Meta App Secret (required for verifyWebhook)
  apiVersion?: string,      // Optional: API version (default: 'v22.0')
  baseUrl?: string,         // Optional: Base URL (default: 'https://graph.facebook.com')
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `verifyWebhook(signature, rawBody)` | Verifies webhook signature (requires `appSecret`) |
| `getMedia(mediaId)` | Downloads media, returns `ReadableStream` |
| `getMedia(mediaId, { asBuffer: true })` | Downloads media, returns `ArrayBuffer` |

```typescript
// Verify webhook signature
const isValid = client.verifyWebhook(
  req.headers['x-hub-signature-256'],
  req.rawBody
);

// Stream (default)
const { stream, mimeType, sha256, fileSize, url } = await client.getMedia(mediaId);

// Buffer
const { buffer, mimeType, sha256, fileSize, url } = await client.getMedia(mediaId, {
  asBuffer: true,
});
```

---

### Webhook Functions

| Function | Description |
|----------|-------------|
| `verifyWebhookSignature(options)` | Verifies `X-Hub-Signature-256` header using HMAC-SHA256 |
| `classifyWebhook(payload)` | Returns discriminated union: `message` \| `status` \| `call` \| `unknown` |
| `classifyMessage(message)` | Returns discriminated union for 15 message types |

#### verifyWebhookSignature

Two options for verifying webhook signatures:

```typescript
// Option 1: Via client method (recommended)
const client = new WABAClient({
  accessToken: '...',
  appSecret: process.env.META_APP_SECRET,
});
const isValid = client.verifyWebhook(
  req.headers['x-hub-signature-256'],
  req.rawBody
);

// Option 2: Standalone function
import { verifyWebhookSignature } from 'waba-toolkit';

const isValid = verifyWebhookSignature({
  signature: req.headers['x-hub-signature-256'],  // X-Hub-Signature-256 header
  rawBody: req.rawBody,                            // Raw body as Buffer or string
  appSecret: process.env.META_APP_SECRET,          // Meta App Secret (required)
});
```

#### classifyWebhook

```typescript
const result = classifyWebhook(webhookPayload);

switch (result.type) {
  case 'message':
    // result.payload: MessageWebhookValue
    break;
  case 'status':
    // result.payload: StatusWebhookValue
    break;
  case 'call':
    // result.payload: CallWebhookValue
    break;
  case 'unknown':
    // Unrecognized webhook
    break;
}
```

#### classifyMessage

```typescript
const result = classifyMessage(message);

switch (result.type) {
  case 'text':
    console.log(result.message.text.body);
    break;
  case 'image':
  case 'video':
  case 'audio':
  case 'document':
  case 'sticker':
    console.log(result.message[result.type].id);
    break;
  case 'location':
    console.log(result.message.location.latitude);
    break;
  case 'contacts':
    console.log(result.message.contacts[0].name);
    break;
  case 'interactive':
    console.log(result.message.interactive.type);
    break;
  case 'reaction':
    console.log(result.message.reaction.emoji);
    break;
  // Additional cases: button, order, system, referral, ...
}
```

---

### Helper Functions

#### Webhook-level Helpers

These helpers accept `WebhookPayload` and extract data from the top-level webhook structure:

| Function | Description | Returns |
|----------|-------------|---------|
| `getContactInfo(webhook)` | Extracts sender's `waId`, `profileName`, and `phoneNumberId` | `ContactInfo \| null` |
| `getMessageId(webhook)` | Extracts message ID from message or status webhooks | `string \| null` |
| `getCallId(webhook)` | Extracts call ID from call webhooks | `string \| null` |

```typescript
import { getContactInfo, getMessageId, getCallId } from 'waba-toolkit';

// Get sender info from message/call webhooks
const contact = getContactInfo(webhookPayload);
if (contact) {
  console.log(contact.waId);          // e.g., '14155551234'
  console.log(contact.profileName);   // e.g., 'John Doe' (may be undefined)
  console.log(contact.phoneNumberId); // Your business phone number ID
}

// Get message ID from message webhooks
const messageId = getMessageId(webhookPayload);
if (messageId) {
  await markAsRead(messageId);
}

// Get message ID from status webhooks
const statusMessageId = getMessageId(statusWebhook);
if (statusMessageId) {
  console.log('Status update for message:', statusMessageId);
}

// Get call ID from call webhooks
const callId = getCallId(webhookPayload);
if (callId) {
  await logCall(callId);
}
```

#### Message-level Helpers

These helpers operate on individual message objects:

| Function | Description | Returns |
|----------|-------------|---------|
| `isMediaMessage(message)` | Type guard: returns `true` if message has downloadable media | `boolean` |
| `extractMediaId(message)` | Extracts media ID from image/audio/video/document/sticker messages | `string \| undefined` |
| `getMessageTimestamp(message)` | Parses timestamp string to `Date` object | `Date` |

```typescript
import {
  isMediaMessage,
  extractMediaId,
  getMessageTimestamp,
} from 'waba-toolkit';

// Extract message from webhook first
const message = webhookPayload.entry[0].changes[0].value.messages?.[0];
if (!message) return;

// Check if message has media
if (isMediaMessage(message)) {
  const mediaId = extractMediaId(message);  // guaranteed non-undefined
  const media = await client.getMedia(mediaId);
}

// Parse timestamp
const sentAt = getMessageTimestamp(message);
console.log(sentAt.toISOString());
```

---

### Error Classes

| Class | Description |
|-------|-------------|
| `WABAError` | Base error class |
| `WABAMediaError` | Media download failures (includes `mediaId` and `code`) |
| `WABANetworkError` | Network/connection failures (includes `cause`) |
| `WABASignatureError` | Invalid webhook signature |

```typescript
import { WABAMediaError, WABANetworkError } from 'waba-toolkit';

try {
  const media = await client.getMedia(mediaId);
} catch (error) {
  if (error instanceof WABAMediaError) {
    console.error(`Media error for ${error.mediaId}: ${error.code}`);
  } else if (error instanceof WABANetworkError) {
    console.error('Network error:', error.cause);
  }
}
```

---

## Types

All types are exported for use in your application:

```typescript
import type {
  // Client
  WABAClientOptions,
  GetMediaOptions,

  // Media
  MediaMetadata,
  MediaStreamResult,
  MediaBufferResult,

  // Webhooks
  WebhookPayload,
  WebhookClassification,
  MessageWebhookValue,
  StatusWebhookValue,
  CallWebhookValue,

  // Messages
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
  MediaMessage,
  // ... and more
} from 'waba-toolkit';
```

---

## License

MIT
