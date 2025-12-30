# waba-toolkit

Type-safe WhatsApp Business API toolkit with CLI for webhooks, media downloads, signature verification, and message sending.

> **Note:** This is not an official Meta/WhatsApp package, nor is it a full API wrapper. It is a utility toolkit derived from patterns across several production projects that interface directly with the WhatsApp Business API (Cloud API).

## Features

- **CLI Tool** - Send messages, manage phone numbers, and configure settings from the command line
- **Type-Safe** - Full TypeScript support with discriminated unions for webhook and message types
- **Media Downloads** - Stream or buffer media with automatic URL refresh handling
- **Webhook Processing** - Classify and verify webhooks with HMAC-SHA256 signature verification
- **Message Sending** - Send text, template, and custom messages programmatically
- **Phone Management** - Register, deregister, and list phone numbers
- **Zero Dependencies** - Core library has no runtime dependencies (CLI uses Commander + Inquirer)
- **Dual Format** - ESM and CommonJS support

---

## Table of Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
  - [CLI Usage](#cli-usage)
  - [Library Usage](#library-usage)
- [CLI Reference](#cli-reference)
  - [Configuration](#configuration)
  - [Phone Management](#phone-management)
  - [Sending Messages](#sending-messages)
- [API Reference](#api-reference)
  - [WABAClient](#wabaclient)
  - [WABAApiClient](#wabaapiclient)
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

### CLI Usage

```bash
# Configure once (interactive)
waba-toolkit configure

# List phone numbers
waba-toolkit list-phones --waba-id YOUR_WABA_ID

# Send a text message
waba-toolkit send text --to 1234567890 --message "Hello World"

# Register a phone number
waba-toolkit register --pin 123456

# View all commands
waba-toolkit --help
```

### Library Usage

```typescript
import {
  WABAClient,
  WABAApiClient,
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

## CLI Reference

The CLI provides a convenient way to interact with the WhatsApp Business API without writing code.

### Configuration

Config is stored at `~/.waba-toolkit` (encrypted, machine-locked).

**Priority:** CLI flags > environment variables > config file

#### Interactive Setup

```bash
waba-toolkit configure
```

Prompts for:
- Access token (required)
- Default phone number ID (optional)
- API version (optional, default: v22.0)
- WABA ID (optional)
- Business ID (optional)

#### View Configuration

```bash
waba-toolkit config show
```

Shows current configuration with sensitive values masked (e.g., `EAA...****...abc`).

#### Update Configuration

```bash
# Set default phone number ID
waba-toolkit config set-default-phone 1234567890

# Update specific fields
waba-toolkit config set access-token EAABsbCS...
waba-toolkit config set waba-id 1234567890
waba-toolkit config set api-version v22.0
```

Valid fields: `access-token`, `default-phone-number-id`, `api-version`, `waba-id`, `business-id`

#### Environment Variables

```bash
export WABA_TOOLKIT_ACCESS_TOKEN="your-token"
export WABA_TOOLKIT_PHONE_NUMBER_ID="your-phone-number-id"
export WABA_TOOLKIT_WABA_ID="your-waba-id"
export WABA_TOOLKIT_API_VERSION="v22.0"
```

### Phone Management

#### List Phone Numbers

```bash
# List all phone numbers for a WABA
waba-toolkit list-phones --waba-id 1234567890

# Using environment variable
WABA_TOOLKIT_WABA_ID=1234567890 waba-toolkit list-phones
```

Returns JSON with phone numbers, quality ratings, and verified names:

```json
{
  "data": [
    {
      "verified_name": "Your Business",
      "display_phone_number": "+1 555-0100",
      "id": "1234567890",
      "quality_rating": "GREEN"
    }
  ]
}
```

#### Register Phone Number

```bash
# Register with default phone number ID from config
waba-toolkit register --pin 123456

# Register specific phone number
waba-toolkit register --bpid 1234567890 --pin 123456
```

#### Deregister Phone Number

```bash
# Deregister default phone number
waba-toolkit deregister

# Deregister specific phone number
waba-toolkit deregister --bpid 1234567890
```

### Sending Messages

#### Text Message

```bash
# Basic text message
waba-toolkit send text --to 1234567890 --message "Hello World"

# With URL preview
waba-toolkit send text --to 1234567890 --message "Check out https://example.com" --preview-url

# Reply to message
waba-toolkit send text --to 1234567890 --message "Got it!" --reply-to wamid.abc123
```

#### Template Message

```bash
waba-toolkit send template --to 1234567890 --file template.json
```

Template JSON format:

```json
{
  "name": "hello_world",
  "language": {
    "code": "en_US"
  },
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John" }
      ]
    }
  ]
}
```

#### Custom Message (from JSON)

```bash
waba-toolkit send file --payload message.json
```

Example payloads:

**Text:**
```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "text",
  "text": {
    "body": "Hello World"
  }
}
```

**Image:**
```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg"
  }
}
```

**Interactive (List):**
```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": {
      "text": "Choose an option"
    },
    "action": {
      "button": "View Menu",
      "sections": [
        {
          "title": "Options",
          "rows": [
            {
              "id": "1",
              "title": "Option 1",
              "description": "First option"
            }
          ]
        }
      ]
    }
  }
}
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

### WABAApiClient

Client for outbound WhatsApp Business API operations (sending messages, phone registration).

#### Constructor

```typescript
const apiClient = new WABAApiClient({
  accessToken: string,      // Required: Meta access token
  phoneNumberId: string,    // Required: Your business phone number ID
  apiVersion?: string,      // Optional: API version (default: 'v22.0')
  baseUrl?: string,         // Optional: Base URL (default: 'https://graph.facebook.com')
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `registerPhone(pin)` | Register phone number with 6-digit PIN |
| `deregisterPhone()` | Deregister phone number |
| `listPhoneNumbers(wabaId)` | List all phone numbers for a WABA |
| `sendTextMessage(to, text, options)` | Send text message |
| `sendTemplateMessage(to, template)` | Send approved template message |
| `sendMessage(payload)` | Send any message type with custom payload |

#### Examples

```typescript
import { WABAApiClient } from 'waba-toolkit';

const apiClient = new WABAApiClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  phoneNumberId: '1234567890',
});

// List phone numbers
const phones = await apiClient.listPhoneNumbers('YOUR_WABA_ID');
console.log(phones.data);

// Register phone
await apiClient.registerPhone('123456');

// Send text message
const response = await apiClient.sendTextMessage(
  '1234567890',
  'Hello from waba-toolkit!',
  { previewUrl: true }
);
console.log('Message ID:', response.messages[0].id);

// Reply to a message
await apiClient.sendTextMessage(
  '1234567890',
  'This is a reply',
  { context: { message_id: 'wamid.abc123' } }
);

// Send template message
await apiClient.sendTemplateMessage('1234567890', {
  name: 'hello_world',
  language: { code: 'en_US' },
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: 'John' }],
    },
  ],
});

// Send custom message (image)
await apiClient.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'image',
  image: {
    link: 'https://example.com/image.jpg',
  },
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
| `WABAConfigError` | Configuration issues (includes `field`) |
| `WABAAuthError` | Authentication failures (includes `statusCode`) |
| `WABASendError` | Message sending failures (includes `statusCode` and `errorPayload`) |

```typescript
import {
  WABAMediaError,
  WABANetworkError,
  WABASendError,
  WABAAuthError,
} from 'waba-toolkit';

// Media download errors
try {
  const media = await client.getMedia(mediaId);
} catch (error) {
  if (error instanceof WABAMediaError) {
    console.error(`Media error for ${error.mediaId}: ${error.code}`);
  } else if (error instanceof WABANetworkError) {
    console.error('Network error:', error.cause);
  }
}

// Message sending errors
try {
  await apiClient.sendTextMessage('1234567890', 'Hello');
} catch (error) {
  if (error instanceof WABAAuthError) {
    console.error(`Auth failed: ${error.statusCode}`);
  } else if (error instanceof WABASendError) {
    console.error(`Send failed: ${error.statusCode}`);
    console.error('Details:', error.errorPayload);
  }
}
```

---

## Types

All types are exported for use in your application:

```typescript
import type {
  // Clients
  WABAClientOptions,
  WABAApiClientOptions,
  GetMediaOptions,

  // Media
  MediaMetadata,
  MediaStreamResult,
  MediaBufferResult,

  // API (Outbound)
  SendTextMessageRequest,
  SendTemplateMessageRequest,
  SendMessageResponse,
  MessagePayload,
  RegisterPhoneRequest,
  DeregisterPhoneRequest,
  TemplateParameter,
  TemplateComponent,
  PhoneNumber,
  ListPhoneNumbersResponse,

  // Webhooks (Inbound)
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
