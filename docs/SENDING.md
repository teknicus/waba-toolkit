# Sending Messages Guide

Send WhatsApp messages programmatically with type safety.

---

## Quick Start

> **Prefer CLI?** See [CLI Guide: Sending Messages](CLI.md#sending-messages)

```typescript
import { WABAApiClient } from 'waba-toolkit';

const client = new WABAApiClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  phoneNumberId: '1234567890', // Your business phone number ID
});

// Send text
const response = await client.sendTextMessage(
  '1234567890',
  'Hello from waba-toolkit!'
);

console.log('Message ID:', response.messages[0].id);
```

---

## Initialize Client

```typescript
import { WABAApiClient } from 'waba-toolkit';

const client = new WABAApiClient({
  accessToken: string,      // Required: Meta access token
  phoneNumberId: string,    // Required: Your business phone number ID
  apiVersion?: string,      // Optional: Default 'v22.0'
  baseUrl?: string,         // Optional: Default 'https://graph.facebook.com'
});
```

---

## Text Messages

### Basic Text

```typescript
await client.sendTextMessage(
  '1234567890',      // Recipient phone number
  'Hello World'      // Message text
);
```

### With URL Preview

```typescript
await client.sendTextMessage(
  '1234567890',
  'Check this out: https://example.com',
  { previewUrl: true }
);
```

### Reply to Message

```typescript
await client.sendTextMessage(
  '1234567890',
  'Got your message!',
  {
    context: {
      message_id: 'wamid.HBgLMTY...', // Original message ID
    },
  }
);
```

---

## Template Messages

Send pre-approved template messages:

```typescript
await client.sendTemplateMessage('1234567890', {
  name: 'hello_world',                    // Template name
  language: { code: 'en_US' },            // Language code
  components: [                           // Optional: Parameters
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'John Doe' },
        { type: 'text', text: 'Order #12345' },
      ],
    },
  ],
});
```

### Template with Header Image

```typescript
await client.sendTemplateMessage('1234567890', {
  name: 'order_confirmation',
  language: { code: 'en' },
  components: [
    {
      type: 'header',
      parameters: [
        {
          type: 'image',
          image: {
            link: 'https://example.com/product.jpg',
          },
        },
      ],
    },
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'John' },
        { type: 'text', text: 'ORD-12345' },
      ],
    },
  ],
});
```

### Template with Buttons

```typescript
await client.sendTemplateMessage('1234567890', {
  name: 'appointment_reminder',
  language: { code: 'en_US' },
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'Tomorrow at 3 PM' },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [
        {
          type: 'text',
          text: 'abc123', // Dynamic URL parameter
        },
      ],
    },
  ],
});
```

---

## Media Messages

### Image

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'image',
  image: {
    link: 'https://example.com/photo.jpg',
    caption: 'Amazing view!',
  },
});
```

### Video

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'video',
  video: {
    link: 'https://example.com/video.mp4',
    caption: 'Check out this video',
  },
});
```

### Document

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'document',
  document: {
    link: 'https://example.com/invoice.pdf',
    caption: 'Your invoice',
    filename: 'invoice-12345.pdf',
  },
});
```

### Audio

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'audio',
  audio: {
    link: 'https://example.com/audio.mp3',
  },
});
```

---

## Interactive Messages

### Buttons

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'interactive',
  interactive: {
    type: 'button',
    body: {
      text: 'Would you like to continue?',
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: 'yes',
            title: 'Yes',
          },
        },
        {
          type: 'reply',
          reply: {
            id: 'no',
            title: 'No',
          },
        },
      ],
    },
  },
});
```

### List

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'interactive',
  interactive: {
    type: 'list',
    header: {
      type: 'text',
      text: 'Menu',
    },
    body: {
      text: 'Choose an option',
    },
    footer: {
      text: 'Powered by waba-toolkit',
    },
    action: {
      button: 'View Options',
      sections: [
        {
          title: 'Main Options',
          rows: [
            {
              id: 'option1',
              title: 'Option 1',
              description: 'Description for option 1',
            },
            {
              id: 'option2',
              title: 'Option 2',
              description: 'Description for option 2',
            },
          ],
        },
      ],
    },
  },
});
```

---

## Location Messages

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'location',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco',
    address: 'California, USA',
  },
});
```

---

## Contact Messages

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'contacts',
  contacts: [
    {
      name: {
        formatted_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
      },
      phones: [
        {
          phone: '+1 555 0100',
          type: 'MOBILE',
        },
      ],
      emails: [
        {
          email: 'john@example.com',
          type: 'WORK',
        },
      ],
    },
  ],
});
```

---

## Reaction Messages

React to a message:

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'reaction',
  reaction: {
    message_id: 'wamid.HBgLMTY...', // Message to react to
    emoji: '👍',
  },
});
```

Remove reaction:

```typescript
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'reaction',
  reaction: {
    message_id: 'wamid.HBgLMTY...',
    emoji: '', // Empty emoji removes reaction
  },
});
```

---

## Error Handling

```typescript
import { WABAAuthError, WABASendError } from 'waba-toolkit';

try {
  await client.sendTextMessage('1234567890', 'Hello');
} catch (error) {
  if (error instanceof WABAAuthError) {
    console.error('Authentication failed:', error.statusCode);
    // Check your access token
  } else if (error instanceof WABASendError) {
    console.error('Send failed:', error.statusCode);
    console.error('Details:', error.errorPayload);
    // Check error code and message
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 100 | Invalid parameter | Check phone number format |
| 131047 | Re-engagement message | Need approved template (>24hrs) |
| 131053 | Recipient not on WhatsApp | Verify phone number |
| 190 | Access token expired | Refresh token |
| 368 | Temporarily blocked | Reduce send rate |

> **More help?** See [Troubleshooting: Message Sending Issues](TROUBLESHOOTING.md#message-sending-issues)

---

## Response Format

All send methods return:

```typescript
{
  messaging_product: 'whatsapp',
  contacts: [
    {
      input: '1234567890',      // Phone as you provided
      wa_id: '1234567890',      // WhatsApp ID (normalized)
    },
  ],
  messages: [
    {
      id: 'wamid.HBgLMTY...', // Message ID (WAMID)
    },
  ],
}
```

Use the message ID to track delivery status.

---

## Phone Management

### Register Phone

```typescript
await client.registerPhone('123456'); // 6-digit PIN
```

### Deregister Phone

```typescript
await client.deregisterPhone();
```

### List Phone Numbers

```typescript
const phones = await client.listPhoneNumbers('YOUR_WABA_ID');

phones.data.forEach((phone) => {
  console.log('ID:', phone.id);
  console.log('Display:', phone.display_phone_number);
  console.log('Quality:', phone.quality_rating);
  console.log('Name:', phone.verified_name);
});
```

---

## Best Practices

### 1. Template Messages for First Contact

Send templates if >24 hours since last customer message:

```typescript
async function sendMessage(to: string, text: string) {
  const lastMessageTime = await getLastMessageTime(to);
  const hoursSince = (Date.now() - lastMessageTime) / 1000 / 60 / 60;

  if (hoursSince > 24) {
    // Use template
    await client.sendTemplateMessage(to, {
      name: 're_engagement',
      language: { code: 'en' },
    });
  } else {
    // Use text
    await client.sendTextMessage(to, text);
  }
}
```

### 2. Rate Limiting

Respect Meta's rate limits:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // Max 10 concurrent requests

const recipients = ['123', '456', '789'];
const promises = recipients.map((to) =>
  limit(() => client.sendTextMessage(to, 'Hello'))
);

await Promise.all(promises);
```

### 3. Store Message IDs

Track delivery status:

```typescript
const response = await client.sendTextMessage(to, text);
const messageId = response.messages[0].id;

await db.saveMessage({
  messageId,
  recipient: to,
  text,
  sentAt: new Date(),
  status: 'sent',
});
```

### 4. Handle Retries

Retry on transient errors:

```typescript
import pRetry from 'p-retry';

await pRetry(
  () => client.sendTextMessage(to, text),
  {
    retries: 3,
    onFailedAttempt: (error) => {
      console.log(`Attempt ${error.attemptNumber} failed`);
    },
  }
);
```

---

## Examples

### Send OTP Template

```typescript
await client.sendTemplateMessage(phoneNumber, {
  name: 'otp_template',
  language: { code: 'en' },
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: otpCode },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [
        { type: 'text', text: otpCode }, // Autofill code
      ],
    },
  ],
});
```

### Send Order Confirmation

```typescript
await client.sendTemplateMessage(customerId, {
  name: 'order_confirmation',
  language: { code: 'en' },
  components: [
    {
      type: 'header',
      parameters: [
        {
          type: 'image',
          image: { link: productImageUrl },
        },
      ],
    },
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: orderId },
        { type: 'text', text: deliveryDate },
      ],
    },
  ],
});
```

### Send Delivery Update with Location

```typescript
// Send text
await client.sendTextMessage(
  customerId,
  'Your order is out for delivery!'
);

// Send driver location
await client.sendMessage({
  messaging_product: 'whatsapp',
  to: customerId,
  type: 'location',
  location: {
    latitude: driverLat,
    longitude: driverLng,
    name: 'Driver Location',
  },
});
```

---

## Next Steps

- [Webhook Processing](WEBHOOKS.md) - Handle incoming messages
- [CLI Guide](CLI.md) - Use CLI to send messages
- [API Reference](../API_REFERENCE.md) - Complete type documentation
