# waba-toolkit

Type-safe WhatsApp Business API toolkit with CLI for Node.js 20+

**TL;DR:** Process webhooks, download media, send messages. Zero library dependencies. Fully typed. Works as library or CLI.

---

## What It Does

- **Process Webhooks** → Verify signatures, classify types, extract data
- **Download Media** → Images, videos, documents with automatic URL refresh
- **Send Messages** → Text, templates, media via library or CLI
- **Manage Phones** → Register/deregister business phone numbers
- **Manage Flows** → Create and update WhatsApp Flows via CLI

Zero library dependencies (CLI uses commander + inquirer). ESM + CommonJS. Full TypeScript support.

---

## Install

```bash
npm install waba-toolkit

# Or globally for CLI
npm install -g waba-toolkit
```

---

## Quick Start: Library

### Process a Webhook

```typescript
import { WABAClient, classifyWebhook, classifyMessage } from 'waba-toolkit';

const client = new WABAClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  appSecret: process.env.META_APP_SECRET,
});

app.post('/webhook', async (req, res) => {
  // 1. Verify signature
  if (!client.verifyWebhook(req.headers['x-hub-signature-256'], req.rawBody)) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Classify webhook
  const webhook = classifyWebhook(req.body);

  if (webhook.type === 'message') {
    const message = webhook.payload.messages?.[0];
    const classified = classifyMessage(message);

    if (classified.type === 'text') {
      console.log('Text:', classified.message.text.body);
    }

    // 3. Download media if present
    if (classified.type === 'image') {
      const { stream, mimeType } = await client.getMedia(
        classified.message.image.id
      );
      // Process stream...
    }
  }

  res.sendStatus(200);
});
```

→ **Learn more:** [Webhook Processing Guide](docs/WEBHOOKS.md) | [Media Downloads](docs/MEDIA.md)

### Send a Message

```typescript
import { WABAApiClient } from 'waba-toolkit';

const apiClient = new WABAApiClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  phoneNumberId: '1234567890',
});

const response = await apiClient.sendTextMessage(
  '1234567890',
  'Hello from waba-toolkit!'
);

console.log('Sent:', response.messages[0].id);
```

→ **Learn more:** [Sending Messages Guide](docs/SENDING.md)

---

## Quick Start: CLI

```bash
# Configure once
waba-toolkit configure

# Send a text message
waba-toolkit send text --to 1234567890 --message "Hello World"

# Register a phone number
waba-toolkit register --pin 123456

# List phone numbers
waba-toolkit list-phones --waba-id YOUR_WABA_ID

# List all flows
waba-toolkit list-flows --waba-id YOUR_WABA_ID

# Create a WhatsApp Flow
waba-toolkit create flow --name "My Flow" --categories LEAD_GENERATION

# Upload Flow JSON
waba-toolkit update flow --flow-id 123456789 --file ./my-flow.json

# Publish flow (irreversible)
waba-toolkit publish flow --flow-id 123456789

# List message templates
waba-toolkit list-templates --waba-id YOUR_WABA_ID

# Create a message template
waba-toolkit create template --name my_template --file ./template.json

# Delete a template
waba-toolkit delete template --name old_template
```

→ **Learn more:** [CLI Guide](docs/CLI.md)

---

## Core Features

| Feature | Library | CLI |
|---------|---------|-----|
| Verify webhook signatures | ✅ | - |
| Classify webhooks (message/status/call) | ✅ | - |
| Classify 15 message types | ✅ | - |
| Download media (stream/buffer) | ✅ | - |
| Send text messages | ✅ | ✅ |
| Send template messages | ✅ | ✅ |
| Send custom message payloads | ✅ | ✅ |
| Register/deregister phones | ✅ | ✅ |
| List phone numbers | ✅ | ✅ |
| List WhatsApp Flows | ✅ | ✅ |
| Create WhatsApp Flows | ✅ | ✅ |
| Update Flow JSON | ✅ | ✅ |
| Publish Flows | ✅ | ✅ |
| List message templates | ✅ | ✅ |
| Create message templates | ✅ | ✅ |
| Delete message templates | ✅ | ✅ |
| Encrypted config storage | - | ✅ |

---

## Documentation

| Topic | Guide |
|-------|-------|
| **CLI Commands** | [docs/CLI.md](docs/CLI.md) |
| **Webhook Processing** | [docs/WEBHOOKS.md](docs/WEBHOOKS.md) |
| **Sending Messages** | [docs/SENDING.md](docs/SENDING.md) |
| **Media Downloads** | [docs/MEDIA.md](docs/MEDIA.md) |
| **Complete API Reference** | [API_REFERENCE.md](API_REFERENCE.md) |
| **Architecture & Design** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Troubleshooting** | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |

---

## Key Concepts

### Discriminated Unions

Type-safe webhook and message classification:

```typescript
const webhook = classifyWebhook(payload);

switch (webhook.type) {
  case 'message':
    // webhook.payload is typed as MessageWebhookValue
    break;
  case 'status':
    // webhook.payload is typed as StatusWebhookValue
    break;
  case 'call':
    // webhook.payload is typed as CallWebhookValue
    break;
}
```

### Media Downloads

Two-step flow with automatic URL refresh:

```typescript
// Stream (default)
const { stream, mimeType, sha256, fileSize } = await client.getMedia(mediaId);

// Buffer
const { buffer, mimeType } = await client.getMedia(mediaId, { asBuffer: true });
```

Temporary URLs expire in 5 minutes. `getMedia()` fetches fresh URLs each time.

→ **Learn more:** [Media Downloads Guide](docs/MEDIA.md)

### Helper Functions

Extract common data from webhooks:

```typescript
import { getContactInfo, getMessageId, extractMediaId } from 'waba-toolkit';

// Get sender info
const contact = getContactInfo(webhookPayload);
console.log(contact?.waId, contact?.profileName);

// Get message ID for marking as read
const messageId = getMessageId(webhookPayload);

// Extract media ID from any media message
const mediaId = extractMediaId(message);
```

→ **Learn more:** [Webhook Processing Guide](docs/WEBHOOKS.md)

---

## Error Handling

Typed error classes:

```typescript
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

**Error Types:**
- `WABAError` - Base error
- `WABAMediaError` - Media download failures
- `WABANetworkError` - Network/connection issues
- `WABASignatureError` - Invalid webhook signature
- `WABAConfigError` - Configuration problems
- `WABAAuthError` - Authentication failures
- `WABASendError` - Message sending failures

→ **Learn more:** [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

## Requirements

- **Node.js** 20+ (uses native `fetch`)
- **Meta Access Token** with `whatsapp_business_messaging` permission
- **Meta App Secret** (for webhook signature verification)

---

## Configuration (CLI)

**Option 1: Interactive setup**
```bash
waba-toolkit configure
```

**Option 2: Environment variables**
```bash
export WABA_TOOLKIT_ACCESS_TOKEN="your-token"
export WABA_TOOLKIT_PHONE_NUMBER_ID="your-phone-id"
waba-toolkit send text --to 123 --message "Hello"
```

**Priority:** CLI flags > env vars > config file > defaults

Config is stored at `~/.waba-toolkit` (encrypted, machine-locked).

→ **Learn more:** [CLI Configuration](docs/CLI.md#configuration-commands)

---

## Message Types

Supports all 15 WABA message types:

`text` | `image` | `video` | `audio` | `document` | `sticker` | `location` | `contacts` | `interactive` | `reaction` | `button` | `order` | `system` | `referral` | `unsupported`

Each type is a discriminated union with proper TypeScript narrowing.

---

## Examples

### Verify + Classify Webhook

```typescript
const isValid = client.verifyWebhook(signature, rawBody);
if (!isValid) return res.status(401).send('Invalid signature');

const webhook = classifyWebhook(req.body);
if (webhook.type === 'message') {
  // Handle message
}
```

### Download Media

```typescript
if (isMediaMessage(message)) {
  const mediaId = extractMediaId(message);
  const { stream } = await client.getMedia(mediaId);

  const file = fs.createWriteStream('./download.jpg');
  Readable.fromWeb(stream).pipe(file);
}
```

### Send Template

```typescript
await apiClient.sendTemplateMessage('1234567890', {
  name: 'hello_world',
  language: { code: 'en_US' },
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: 'John' }]
    }
  ]
});
```

### CLI: Send from JSON

```bash
# template.json
{
  "name": "order_confirmation",
  "language": { "code": "en_US" },
  "components": [...]
}

waba-toolkit send template --to 1234567890 --file template.json
```

### CLI: Create, Update & Publish Flow

```bash
# Create flow
waba-toolkit create flow --name "Lead Form" --categories LEAD_GENERATION

# Upload Flow JSON (returns validation errors if invalid)
waba-toolkit update flow --flow-id 123456789 --file ./lead-form.json

# Publish flow (irreversible - makes flow available for use)
waba-toolkit publish flow --flow-id 123456789
```

---

## TypeScript Support

All types exported:

```typescript
import type {
  // Clients
  WABAClientOptions,
  WABAApiClientOptions,

  // Webhooks
  WebhookPayload,
  WebhookClassification,
  MessageWebhookValue,
  StatusWebhookValue,

  // Messages
  IncomingMessage,
  MessageClassification,
  TextMessage,
  ImageMessage,
  MediaMessage,

  // API
  SendMessageResponse,
  TemplateComponent,
  PhoneNumber,

  // Flows
  FlowCategory,
  FlowStatus,
  FlowListItem,
  ListFlowsResponse,
  CreateFlowResponse,
  UpdateFlowJsonResponse,
  FlowValidationError,
  PublishFlowResponse,

  // Templates
  TemplateCategory,
  TemplateStatus,
  TemplateListItem,
  ListTemplatesResponse,
  CreateTemplateRequest,
  CreateTemplateResponse,
  DeleteTemplateResponse,
} from 'waba-toolkit';
```

See [API_REFERENCE.md](API_REFERENCE.md) for complete type documentation.

---

## License

MIT

---

## Links

- **npm:** https://www.npmjs.com/package/waba-toolkit
- **GitHub:** https://github.com/teknicus/waba-toolkit
- **Issues:** https://github.com/teknicus/waba-toolkit/issues
- **WhatsApp Business API Docs:** https://developers.facebook.com/docs/whatsapp/cloud-api
