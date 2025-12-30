# Media Downloads Guide

Download images, videos, documents, and audio files from WhatsApp.

---

## Quick Start

```typescript
import { WABAClient } from 'waba-toolkit';

const client = new WABAClient({
  accessToken: process.env.META_ACCESS_TOKEN,
});

// Stream (default)
const { stream, mimeType, sha256, fileSize } = await client.getMedia(mediaId);

// Save to file
const file = fs.createWriteStream('./download.jpg');
Readable.fromWeb(stream).pipe(file);
```

---

## Initialize Client

```typescript
import { WABAClient } from 'waba-toolkit';

const client = new WABAClient({
  accessToken: string,      // Required: Meta access token
  apiVersion?: string,      // Optional: Default 'v22.0'
  baseUrl?: string,         // Optional: Default 'https://graph.facebook.com'
});
```

---

## How It Works

**Two-step flow:**

1. **GET metadata** → Returns temporary URL + file info
2. **GET file** → Downloads binary content from temporary URL

**Temporary URLs expire in 5 minutes**

`getMedia()` fetches a fresh URL each time automatically.

---

## Stream Media (Default)

Returns a Web `ReadableStream`:

```typescript
const { stream, mimeType, sha256, fileSize, url } = await client.getMedia(
  mediaId
);

console.log('Type:', mimeType);      // e.g., "image/jpeg"
console.log('Size:', fileSize);      // bytes
console.log('Hash:', sha256);        // SHA-256 hash
console.log('URL:', url);            // Temporary URL (5min expiry)
```

### Save to File (Node.js)

```typescript
import fs from 'fs';
import { Readable } from 'stream';

const { stream, mimeType } = await client.getMedia(mediaId);

const file = fs.createWriteStream('./download.jpg');
Readable.fromWeb(stream).pipe(file);

await new Promise((resolve, reject) => {
  file.on('finish', resolve);
  file.on('error', reject);
});
```

### Upload to S3

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });
const { stream, mimeType } = await client.getMedia(mediaId);

await s3.send(
  new PutObjectCommand({
    Bucket: 'my-bucket',
    Key: `media/${mediaId}`,
    Body: Readable.fromWeb(stream),
    ContentType: mimeType,
  })
);
```

### Upload to Cloud Storage (GCP)

```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket('my-bucket');

const { stream, mimeType } = await client.getMedia(mediaId);

const file = bucket.file(`media/${mediaId}`);
const writeStream = file.createWriteStream({
  metadata: { contentType: mimeType },
});

Readable.fromWeb(stream).pipe(writeStream);

await new Promise((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
});
```

---

## Buffer Media

Returns an `ArrayBuffer`:

```typescript
const { buffer, mimeType, sha256, fileSize } = await client.getMedia(mediaId, {
  asBuffer: true,
});

// buffer is ArrayBuffer
console.log('Size:', buffer.byteLength);
```

### Save Buffer to File

```typescript
import fs from 'fs/promises';

const { buffer, mimeType } = await client.getMedia(mediaId, { asBuffer: true });

await fs.writeFile('./download.jpg', Buffer.from(buffer));
```

### Convert to Base64

```typescript
const { buffer } = await client.getMedia(mediaId, { asBuffer: true });

const base64 = Buffer.from(buffer).toString('base64');
const dataUrl = `data:${mimeType};base64,${base64}`;
```

### Process with Sharp

```typescript
import sharp from 'sharp';

const { buffer } = await client.getMedia(mediaId, { asBuffer: true });

const resized = await sharp(Buffer.from(buffer))
  .resize(800, 600)
  .jpeg({ quality: 80 })
  .toBuffer();

await fs.writeFile('./resized.jpg', resized);
```

---

## Extract Media ID from Webhook

> **First time?** See [Webhook Processing Guide](WEBHOOKS.md) to understand webhook handling

### Method 1: Type Guard

```typescript
import { isMediaMessage, extractMediaId } from 'waba-toolkit';

const message = webhook.payload.messages?.[0];

if (isMediaMessage(message)) {
  const mediaId = extractMediaId(message); // Guaranteed non-undefined
  const media = await client.getMedia(mediaId);
}
```

### Method 2: Classify Message

```typescript
import { classifyMessage } from 'waba-toolkit';

const message = webhook.payload.messages?.[0];
const classified = classifyMessage(message);

switch (classified.type) {
  case 'image':
    const imageId = classified.message.image.id;
    await downloadMedia(imageId);
    break;

  case 'video':
    const videoId = classified.message.video.id;
    await downloadMedia(videoId);
    break;

  case 'document':
    const docId = classified.message.document.id;
    await downloadMedia(docId);
    break;

  case 'audio':
    const audioId = classified.message.audio.id;
    await downloadMedia(audioId);
    break;

  case 'sticker':
    const stickerId = classified.message.sticker.id;
    await downloadMedia(stickerId);
    break;
}
```

---

## Media Types

| Type | MIME Types | Notes |
|------|------------|-------|
| **Image** | image/jpeg, image/png, image/webp | Max 5MB |
| **Video** | video/mp4, video/3gpp | Max 16MB |
| **Audio** | audio/aac, audio/mp4, audio/mpeg, audio/amr, audio/ogg | Voice flag available |
| **Document** | application/pdf, text/plain, application/vnd.ms-*, etc. | Max 100MB |
| **Sticker** | image/webp | Animated stickers supported |

---

## Complete Example: Webhook Handler

```typescript
import {
  WABAClient,
  classifyWebhook,
  classifyMessage,
  isMediaMessage,
  extractMediaId,
} from 'waba-toolkit';
import fs from 'fs';
import { Readable } from 'stream';

const client = new WABAClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  appSecret: process.env.META_APP_SECRET,
});

app.post('/webhook', async (req, res) => {
  // Verify signature
  if (!client.verifyWebhook(req.headers['x-hub-signature-256'], req.rawBody)) {
    return res.status(401).send('Invalid signature');
  }

  const webhook = classifyWebhook(req.body);

  if (webhook.type === 'message') {
    const message = webhook.payload.messages?.[0];
    if (!message) return res.sendStatus(200);

    if (isMediaMessage(message)) {
      const mediaId = extractMediaId(message);
      const classified = classifyMessage(message);

      try {
        const { stream, mimeType } = await client.getMedia(mediaId);

        // Determine file extension
        const ext = mimeType.split('/')[1];
        const filename = `${mediaId}.${ext}`;

        // Save to disk
        const file = fs.createWriteStream(`./uploads/${filename}`);
        Readable.fromWeb(stream).pipe(file);

        await new Promise((resolve, reject) => {
          file.on('finish', resolve);
          file.on('error', reject);
        });

        console.log(`Saved ${classified.type} to ${filename}`);
      } catch (error) {
        console.error('Media download failed:', error);
      }
    }
  }

  res.sendStatus(200);
});
```

---

## Error Handling

> **Need help?** See [Troubleshooting: Media Download Issues](TROUBLESHOOTING.md#media-download-issues)

```typescript
import { WABAMediaError, WABANetworkError } from 'waba-toolkit';

try {
  const media = await client.getMedia(mediaId);
} catch (error) {
  if (error instanceof WABAMediaError) {
    console.error(`Media error for ${error.mediaId}`);
    console.error(`HTTP ${error.code}`);

    if (error.code === 404) {
      // Media not found or expired
      console.error('Media no longer available');
    } else if (error.code === 403) {
      // Access denied
      console.error('Check access token permissions');
    }
  } else if (error instanceof WABANetworkError) {
    console.error('Network error:', error.cause);
    // Retry logic here
  }
}
```

---

## Retry Pattern

Temporary URLs expire in 5 minutes. `getMedia()` fetches fresh URLs, so retry is safe:

```typescript
async function downloadWithRetry(mediaId: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.getMedia(mediaId);
    } catch (error) {
      if (error instanceof WABAMediaError && error.code === 404) {
        // URL expired, retry with fresh URL
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }
      throw error;
    }
  }
}
```

Or use `p-retry`:

```typescript
import pRetry from 'p-retry';

const media = await pRetry(() => client.getMedia(mediaId), {
  retries: 3,
  onFailedAttempt: (error) => {
    console.log(`Attempt ${error.attemptNumber} failed`);
  },
});
```

---

## Voice Notes

Audio messages with `voice: true` are voice notes:

```typescript
const classified = classifyMessage(message);

if (classified.type === 'audio') {
  const audio = classified.message.audio;

  console.log('Media ID:', audio.id);
  console.log('MIME Type:', audio.mime_type);
  console.log('Is Voice Note:', audio.voice ?? false);

  const { stream } = await client.getMedia(audio.id);
  // Process voice note...
}
```

---

## File Size Limits

WhatsApp enforces these limits:

| Type | Max Size |
|------|----------|
| Image | 5 MB |
| Video | 16 MB |
| Audio | 16 MB |
| Document | 100 MB |
| Sticker | 100 KB |

Files exceeding limits won't be delivered.

---

## Security: Verify SHA-256

Compare hash to detect tampering:

```typescript
import crypto from 'crypto';

const { buffer, sha256 } = await client.getMedia(mediaId, { asBuffer: true });

const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');

if (hash === sha256) {
  console.log('✓ Hash verified');
} else {
  console.error('✗ Hash mismatch - file may be corrupted');
}
```

---

## Performance Tips

### 1. Stream for Large Files

Use streams for videos/documents to avoid memory issues:

```typescript
// ✅ Stream (low memory)
const { stream } = await client.getMedia(mediaId);
Readable.fromWeb(stream).pipe(destination);

// ❌ Buffer (high memory for large files)
const { buffer } = await client.getMedia(mediaId, { asBuffer: true });
```

### 2. Process Concurrently

Download multiple media files in parallel:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent downloads

const mediaIds = ['id1', 'id2', 'id3', ...];
const downloads = mediaIds.map((id) =>
  limit(() => client.getMedia(id))
);

const results = await Promise.all(downloads);
```

### 3. Cache Media

Store media to avoid re-downloading:

```typescript
async function getCachedMedia(mediaId: string) {
  const cached = await redis.get(`media:${mediaId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const media = await client.getMedia(mediaId, { asBuffer: true });
  await redis.setex(`media:${mediaId}`, 3600, JSON.stringify(media));

  return media;
}
```

---

## Examples

### Download Image and Resize

```typescript
import sharp from 'sharp';

const { buffer } = await client.getMedia(imageId, { asBuffer: true });

const thumbnail = await sharp(Buffer.from(buffer))
  .resize(200, 200, { fit: 'cover' })
  .jpeg({ quality: 80 })
  .toBuffer();

await fs.writeFile('./thumbnail.jpg', thumbnail);
```

### Extract Text from Document (OCR)

```typescript
import Tesseract from 'tesseract.js';

const { buffer } = await client.getMedia(imageId, { asBuffer: true });

const { data: { text } } = await Tesseract.recognize(
  Buffer.from(buffer),
  'eng'
);

console.log('Extracted text:', text);
```

### Transcode Audio

```typescript
import ffmpeg from 'fluent-ffmpeg';

const { stream } = await client.getMedia(audioId);

ffmpeg(Readable.fromWeb(stream))
  .toFormat('mp3')
  .audioBitrate(128)
  .save('./output.mp3');
```

---

## Troubleshooting

### Media Download Fails (404)

**Causes:**
- Media ID is incorrect
- Media expired (typically after 30 days)
- Temporary URL expired (after 5 minutes)

**Solution:**
- Verify media ID from webhook
- Download media promptly after receiving webhook
- Implement retry logic

### Memory Issues with Large Files

**Solution:** Use streams instead of buffers

```typescript
// ❌ High memory
const { buffer } = await client.getMedia(videoId, { asBuffer: true });

// ✅ Low memory
const { stream } = await client.getMedia(videoId);
Readable.fromWeb(stream).pipe(file);
```

### Access Denied (403)

**Causes:**
- Access token lacks permissions
- Token expired
- Media belongs to different WABA

**Solution:**
- Check token has `whatsapp_business_messaging` permission
- Refresh expired token
- Verify media is from your business account

---

## Next Steps

- [Webhook Processing](WEBHOOKS.md) - Extract media IDs from webhooks
- [Sending Messages](SENDING.md) - Send media messages
- [API Reference](../API_REFERENCE.md) - Complete type documentation
