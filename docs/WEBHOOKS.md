# Webhook Processing Guide

Process incoming WhatsApp webhooks with type safety.

---

## Overview

**Three steps:**
1. Verify signature (security)
2. Classify webhook type (message/status/call)
3. Extract data + handle

---

## Quick Start

```typescript
import {
  WABAClient,
  classifyWebhook,
  classifyMessage,
  getContactInfo,
  getMessageId,
} from 'waba-toolkit';

const client = new WABAClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  appSecret: process.env.META_APP_SECRET, // Required for verification
});

app.post('/webhook', async (req, res) => {
  // Step 1: Verify
  if (!client.verifyWebhook(req.headers['x-hub-signature-256'], req.rawBody)) {
    return res.status(401).send('Invalid signature');
  }

  // Step 2: Classify
  const webhook = classifyWebhook(req.body);

  // Step 3: Handle
  if (webhook.type === 'message') {
    const message = webhook.payload.messages?.[0];
    if (message) {
      await handleMessage(message);
    }
  }

  res.sendStatus(200);
});
```

---

## Step 1: Verify Signature

**Why:** Prevent spoofed webhooks from malicious actors

> **Troubleshooting signature issues?** See [Troubleshooting: Signature Verification](TROUBLESHOOTING.md#signature-verification-fails)

### Method 1: Via Client (Recommended)

```typescript
const client = new WABAClient({
  accessToken: '...',
  appSecret: process.env.META_APP_SECRET,
});

const isValid = client.verifyWebhook(
  req.headers['x-hub-signature-256'],
  req.rawBody
);
```

### Method 2: Standalone Function

```typescript
import { verifyWebhookSignature } from 'waba-toolkit';

const isValid = verifyWebhookSignature({
  signature: req.headers['x-hub-signature-256'],
  rawBody: req.rawBody, // Must be raw Buffer, NOT parsed JSON
  appSecret: process.env.META_APP_SECRET,
});
```

**Important:**
- Must use raw request body (Buffer/string), not `JSON.parse(req.body)`
- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Returns `false` if signature header is missing

---

## Step 2: Classify Webhook Type

Three webhook types: **message**, **status**, **call**

```typescript
import { classifyWebhook } from 'waba-toolkit';

const webhook = classifyWebhook(req.body);

switch (webhook.type) {
  case 'message':
    // New incoming message
    // webhook.payload: MessageWebhookValue
    break;

  case 'status':
    // Message status update (sent/delivered/read/failed)
    // webhook.payload: StatusWebhookValue
    break;

  case 'call':
    // Incoming/outgoing call event
    // webhook.payload: CallWebhookValue
    break;

  case 'unknown':
    // Unrecognized webhook
    console.warn('Unknown webhook type');
    break;
}
```

---

## Step 3: Handle Messages

### Classify Message Type

15 message types supported:

```typescript
import { classifyMessage } from 'waba-toolkit';

const message = webhook.payload.messages?.[0];
const classified = classifyMessage(message);

switch (classified.type) {
  case 'text':
    console.log('Text:', classified.message.text.body);
    break;

  case 'image':
  case 'video':
  case 'audio':
  case 'document':
  case 'sticker':
    // All have: id, mime_type, sha256
    // See: Media Downloads Guide (MEDIA.md)
    await downloadMedia(classified.message[classified.type].id);
    break;

  case 'location':
    console.log('Location:', classified.message.location.latitude);
    break;

  case 'contacts':
    console.log('Contacts:', classified.message.contacts);
    break;

  case 'interactive':
    // Button reply, list reply, or Flow response
    const reply = classified.message.interactive;
    if (reply.type === 'button_reply') {
      console.log('Button:', reply.button_reply.id);
    }
    break;

  case 'reaction':
    console.log('Reaction:', classified.message.reaction.emoji);
    break;

  case 'order':
    console.log('Order:', classified.message.order.product_items);
    break;

  default:
    console.log('Other message type:', classified.type);
}
```

**All message types:**
`text` | `image` | `video` | `audio` | `document` | `sticker` | `location` | `contacts` | `interactive` | `reaction` | `button` | `order` | `system` | `referral` | `unsupported`

---

## Helper Functions

### Extract Contact Info

```typescript
import { getContactInfo } from 'waba-toolkit';

const contact = getContactInfo(webhookPayload);
if (contact) {
  console.log('From:', contact.waId); // e.g., "14155551234"
  console.log('Name:', contact.profileName); // May be undefined
  console.log('To:', contact.phoneNumberId); // Your business phone
}
```

### Get Message ID

```typescript
import { getMessageId } from 'waba-toolkit';

// From message webhook
const messageId = getMessageId(webhookPayload);
if (messageId) {
  await markAsRead(messageId);
}

// From status webhook
const statusId = getMessageId(statusWebhook);
console.log('Status for:', statusId);
```

### Check for Media

```typescript
import { isMediaMessage, extractMediaId } from 'waba-toolkit';

const message = webhookPayload.entry[0].changes[0].value.messages?.[0];

if (isMediaMessage(message)) {
  const mediaId = extractMediaId(message); // Guaranteed non-undefined
  const media = await client.getMedia(mediaId);
  // See: Media Downloads Guide (MEDIA.md) for handling downloads
}
```

### Parse Timestamp

```typescript
import { getMessageTimestamp } from 'waba-toolkit';

const sentAt = getMessageTimestamp(message);
console.log(sentAt.toISOString()); // Date object
```

---

## Complete Example

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
    // 3. Extract contact info
    const contact = getContactInfo(req.body);
    console.log('From:', contact?.waId);

    // 4. Get message
    const message = webhook.payload.messages?.[0];
    if (!message) return res.sendStatus(200);

    // 5. Get message ID for marking as read
    const messageId = getMessageId(req.body);

    // 6. Classify message type
    const classified = classifyMessage(message);

    switch (classified.type) {
      case 'text':
        await handleTextMessage(classified.message.text.body, contact?.waId);
        break;

      case 'image':
      case 'video':
      case 'document':
        if (isMediaMessage(message)) {
          const mediaId = extractMediaId(message);
          const { stream } = await client.getMedia(mediaId);
          await saveMedia(stream);
        }
        break;

      case 'interactive':
        const reply = classified.message.interactive;
        if (reply.type === 'button_reply') {
          await handleButtonReply(reply.button_reply.id);
        }
        break;
    }

    // 7. Mark as read
    if (messageId) {
      await markAsRead(messageId);
    }
  }

  if (webhook.type === 'status') {
    const status = webhook.payload.statuses?.[0];
    console.log('Status update:', status?.status);
  }

  res.sendStatus(200);
});
```

---

## Status Webhooks

Track message delivery:

```typescript
if (webhook.type === 'status') {
  const status = webhook.payload.statuses?.[0];

  console.log('Message ID:', status.id);
  console.log('Status:', status.status); // sent/delivered/read/failed
  console.log('Timestamp:', status.timestamp);

  if (status.status === 'failed') {
    console.error('Failed:', status.errors);
  }

  if (status.conversation) {
    console.log('Conversation:', status.conversation.id);
    console.log('Expires:', status.conversation.expiration_timestamp);
  }
}
```

**Status values:**
- `sent` - Message sent to WhatsApp server
- `delivered` - Message delivered to recipient's device
- `read` - Recipient opened the message
- `failed` - Delivery failed (check `errors` field)
- `deleted` - Message was deleted

---

## Call Webhooks

Handle incoming/outgoing calls:

```typescript
import { getCallId } from 'waba-toolkit';

if (webhook.type === 'call') {
  const call = webhook.payload.calls?.[0];

  console.log('Call ID:', call.id);
  console.log('From:', call.from);
  console.log('Direction:', call.direction); // USER_INITIATED | BUSINESS_INITIATED

  if (call.event === 'connect') {
    // Call connected - handle SDP
    console.log('SDP:', call.session);
  }

  if (call.status) {
    // Call terminated
    console.log('Status:', call.status); // ['COMPLETED'] | ['FAILED']
    console.log('Duration:', call.duration); // seconds
  }
}
```

---

## Express.js Setup

Get raw body for signature verification:

```typescript
import express from 'express';

const app = express();

// Must get raw body before parsing JSON
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.post('/webhook', async (req, res) => {
  const isValid = client.verifyWebhook(
    req.headers['x-hub-signature-256'],
    req.rawBody
  );
  // ...
});
```

---

## Fastify Setup

```typescript
import Fastify from 'fastify';

const fastify = Fastify();

fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  (req, body, done) => {
    try {
      const json = JSON.parse(body.toString());
      done(null, { parsed: json, raw: body });
    } catch (err) {
      done(err);
    }
  }
);

fastify.post('/webhook', async (request, reply) => {
  const isValid = client.verifyWebhook(
    request.headers['x-hub-signature-256'],
    request.body.raw
  );

  const webhook = classifyWebhook(request.body.parsed);
  // ...
});
```

---

## Webhook Verification Setup (Meta)

1. Go to **App Dashboard** → **WhatsApp** → **Configuration**
2. Set **Callback URL:** `https://your-domain.com/webhook`
3. Set **Verify Token:** Any string (you choose)
4. Add verification handler:

```typescript
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

---

## Troubleshooting

### Signature Verification Fails

**Causes:**
- Using parsed JSON instead of raw body
- Missing `META_APP_SECRET` environment variable
- Body was modified before verification

**Solution:**
```typescript
// ❌ Wrong
const isValid = client.verifyWebhook(signature, JSON.stringify(req.body));

// ✅ Correct
const isValid = client.verifyWebhook(signature, req.rawBody);
```

### Unknown Webhook Type

If you receive `webhook.type === 'unknown'`:

1. Log the full payload: `console.log(JSON.stringify(req.body, null, 2))`
2. Check if it's a new webhook type from Meta
3. Open an issue with the payload (redact sensitive data)

---

## Best Practices

1. **Always verify signatures** - Never skip verification in production
2. **Respond quickly** - Acknowledge within 20 seconds (Meta timeout)
3. **Handle asynchronously** - Process heavy tasks in background
4. **Log unknown types** - Help identify new webhook formats
5. **Mark as read** - Improve user experience

---

## Next Steps

- [Download Media](MEDIA.md) - Handle media files from webhooks
- [Send Messages](SENDING.md) - Reply to messages
- [API Reference](../API_REFERENCE.md) - Complete type documentation
