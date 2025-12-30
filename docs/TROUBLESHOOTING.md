# Troubleshooting Guide

Common issues and solutions.

---

## Installation Issues

> **New to the CLI?** Start with the [CLI Guide](CLI.md)

### Command Not Found After Global Install

**Problem:**
```bash
waba-toolkit: command not found
```

**Solutions:**

1. **Check npm global path:**
```bash
npm config get prefix
# Should show: /usr/local or ~/.npm-global
```

2. **Add to PATH:**
```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

3. **Use npx instead:**
```bash
npx waba-toolkit <command>
```

4. **Reinstall:**
```bash
npm uninstall -g waba-toolkit
npm install -g waba-toolkit
```

---

## Configuration Issues

> **See also:** [CLI Configuration Guide](CLI.md#configuration-commands)

### Config Decryption Failed

**Problem:**
```
Failed to decrypt configuration
```

**Causes:**
- Config moved to different machine
- Hostname changed
- MAC address changed

**Solution:**
```bash
# Reconfigure (old config is backed up automatically)
waba-toolkit configure
```

### Missing Access Token

**Problem:**
```
✗ Error: Access token not found
```

**Solutions:**

**Option 1: Configure**
```bash
waba-toolkit configure
```

**Option 2: Environment variable**
```bash
export WABA_TOOLKIT_ACCESS_TOKEN="your-token"
```

**Option 3: Update config**
```bash
waba-toolkit config set access-token "your-token"
```

### Missing Phone Number ID

**Problem:**
```
✗ Error: No phone number ID specified
```

**Solutions:**

**Option 1: Set default**
```bash
waba-toolkit config set-default-phone 1234567890
```

**Option 2: Environment variable**
```bash
export WABA_TOOLKIT_PHONE_NUMBER_ID=1234567890
```

**Option 3: Use flag**
```bash
waba-toolkit send text --bpid 1234567890 --to 123 --message "Hi"
```

---

## Webhook Issues

### Signature Verification Fails

**Problem:**
```typescript
const isValid = client.verifyWebhook(...);
// Returns false
```

**Common causes:**

1. **Using parsed JSON instead of raw body**
```typescript
// ❌ Wrong
client.verifyWebhook(signature, JSON.stringify(req.body))

// ✅ Correct
client.verifyWebhook(signature, req.rawBody)
```

2. **Missing app secret**
```typescript
// ❌ Wrong
const client = new WABAClient({
  accessToken: '...',
});

// ✅ Correct
const client = new WABAClient({
  accessToken: '...',
  appSecret: process.env.META_APP_SECRET, // Required!
});
```

3. **Body was modified**
```typescript
// Make sure to capture raw body BEFORE parsing:
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
```

### Webhook Timeouts

**Problem:** Webhooks timing out (20 second limit)

**Solution:** Respond immediately, process asynchronously

```typescript
app.post('/webhook', async (req, res) => {
  // Verify and respond immediately
  if (!client.verifyWebhook(...)) {
    return res.status(401).send('Invalid');
  }

  res.sendStatus(200); // Respond ASAP

  // Process asynchronously
  processWebhookAsync(req.body).catch(console.error);
});

async function processWebhookAsync(payload) {
  // Heavy processing here...
}
```

---

## Media Download Issues

### Media Not Found (404)

**Problem:**
```typescript
WABAMediaError: Media not found (404)
```

**Causes:**
- Media ID is incorrect
- Media expired (typically 30 days)
- Temporary URL expired

**Solutions:**

1. **Verify media ID:**
```typescript
const mediaId = extractMediaId(message);
console.log('Media ID:', mediaId); // Check format
```

2. **Download promptly:**
Media expires after 30 days. Download soon after receiving webhook.

3. **Retry logic:**
```typescript
import pRetry from 'p-retry';

const media = await pRetry(
  () => client.getMedia(mediaId),
  { retries: 3 }
);
```

### Access Denied (403)

**Problem:**
```typescript
WABAMediaError: Access denied (403)
```

**Solutions:**

1. **Check token permissions:**
   - Token needs `whatsapp_business_messaging` permission
   - Generate new token if needed

2. **Verify WABA ownership:**
   - Media must belong to your WhatsApp Business Account

### Memory Issues

**Problem:** Out of memory when downloading large files

**Solution:** Use streams, not buffers

```typescript
// ❌ High memory (loads entire file)
const { buffer } = await client.getMedia(mediaId, { asBuffer: true });

// ✅ Low memory (streams)
const { stream } = await client.getMedia(mediaId);
Readable.fromWeb(stream).pipe(fs.createWriteStream('./file'));
```

---

## Message Sending Issues

### Re-engagement Required (131047)

**Problem:**
```json
{
  "error": {
    "code": 131047,
    "message": "Re-engagement message"
  }
}
```

**Cause:** More than 24 hours since customer's last message

**Solution:** Use approved template message

```typescript
// Check last message time
const hoursSince = (Date.now() - lastMessageTime) / 1000 / 60 / 60;

if (hoursSince > 24) {
  // Use template
  await client.sendTemplateMessage(to, {
    name: 'approved_template',
    language: { code: 'en' },
  });
} else {
  // Use regular text
  await client.sendTextMessage(to, 'Hello');
}
```

### Invalid Phone Number (100)

**Problem:**
```json
{
  "error": {
    "code": 100,
    "message": "Invalid parameter"
  }
}
```

**Solutions:**

1. **Check format:** Use E.164 format (no + or spaces)
```typescript
// ❌ Wrong
'+ 1 555 0100'
'+1-555-0100'

// ✅ Correct
'15550100'
```

2. **Verify on WhatsApp:**
Number must have WhatsApp installed

### Rate Limited (368)

**Problem:**
```json
{
  "error": {
    "code": 368,
    "message": "Temporarily blocked"
  }
}
```

**Solutions:**

1. **Reduce send rate:**
```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // Max 10 concurrent

await Promise.all(
  recipients.map(to => limit(() => client.sendTextMessage(to, text)))
);
```

2. **Implement exponential backoff:**
```typescript
import pRetry from 'p-retry';

await pRetry(
  () => client.sendTextMessage(to, text),
  {
    retries: 5,
    factor: 2,
    minTimeout: 1000,
  }
);
```

### Token Expired (190)

**Problem:**
```json
{
  "error": {
    "code": 190,
    "message": "Access token expired"
  }
}
```

**Solution:** Generate new access token

1. Go to **Meta Business Suite** → **Settings**
2. Create new System User token
3. Update config:
```bash
waba-toolkit config set access-token "new-token"
```

---

## Type Errors

### Type Mismatch in Classified Message

**Problem:**
```typescript
const classified = classifyMessage(message);
// TypeScript error: Property 'text' does not exist
console.log(classified.message.text.body);
```

**Solution:** Use type narrowing

```typescript
const classified = classifyMessage(message);

if (classified.type === 'text') {
  // TypeScript now knows: classified.message is TextMessage
  console.log(classified.message.text.body);
}
```

---

## Network Issues

### Connection Timeout

**Problem:**
```
WABANetworkError: Request timeout
```

**Solutions:**

1. **Check internet connection**

2. **Verify Meta API status:**
   https://developers.facebook.com/status/

3. **Retry with exponential backoff:**
```typescript
import pRetry from 'p-retry';

await pRetry(
  () => client.sendTextMessage(to, text),
  {
    retries: 3,
    onFailedAttempt: error => {
      console.log(`Retry ${error.attemptNumber}`);
    }
  }
);
```

---

## CLI Specific Issues

### Permission Denied

**Problem:**
```bash
EACCES: permission denied
```

**Solutions:**

**Option 1: Use npx**
```bash
npx waba-toolkit <command>
```

**Option 2: Fix npm permissions**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g waba-toolkit
```

**Option 3: Use sudo** (not recommended)
```bash
sudo npm install -g waba-toolkit
```

### JSON File Not Found

**Problem:**
```bash
waba-toolkit send template --file template.json
# Error: ENOENT: no such file
```

**Solutions:**

1. **Check file path:**
```bash
ls -la template.json
pwd
```

2. **Use absolute path:**
```bash
waba-toolkit send template --file /full/path/to/template.json
```

3. **Check current directory:**
```bash
waba-toolkit send template --file ./template.json
```

---

## Testing Issues

### Test Webhooks Not Arriving

**Checklist:**

1. **Verify webhook URL is public:**
```bash
curl https://your-domain.com/webhook
```

2. **Check webhook verification:**
```typescript
// GET /webhook handler required
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

3. **Check webhook subscriptions:**
   - Go to **Meta App Dashboard** → **WhatsApp** → **Configuration**
   - Verify webhook fields are subscribed (messages, message_status)

4. **Check logs:**
   - Meta provides webhook delivery logs in App Dashboard

---

## Getting Help

### Include This Information

When opening an issue:

1. **Version:**
```bash
npm list waba-toolkit
```

2. **Error message:**
```bash
# Full error output
```

3. **Code snippet:**
```typescript
// Minimal reproducible example
```

4. **fbtrace_id:** (if Meta API error)
```json
{
  "error": {
    "fbtrace_id": "ABC123..." // Include this
  }
}
```

### Resources

- **GitHub Issues:** https://github.com/your-username/waba-toolkit/issues
- **Meta API Docs:** https://developers.facebook.com/docs/whatsapp
- **Meta Support:** https://business.facebook.com/business/help
- **Meta API Status:** https://developers.facebook.com/status/

---

## Quick Diagnostic

Run this script to check your setup:

```typescript
import { WABAClient, WABAApiClient } from 'waba-toolkit';

async function diagnostic() {
  console.log('=== waba-toolkit Diagnostic ===\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  console.log('   ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? '✓' : '✗');
  console.log('   APP_SECRET:', process.env.META_APP_SECRET ? '✓' : '✗');
  console.log('   PHONE_ID:', process.env.PHONE_NUMBER_ID ? '✓' : '✗');

  // Test media client
  console.log('\n2. WABAClient:');
  try {
    const client = new WABAClient({
      accessToken: process.env.META_ACCESS_TOKEN,
    });
    console.log('   Initialized: ✓');
  } catch (error) {
    console.log('   Initialized: ✗', error.message);
  }

  // Test API client
  console.log('\n3. WABAApiClient:');
  try {
    const apiClient = new WABAApiClient({
      accessToken: process.env.META_ACCESS_TOKEN,
      phoneNumberId: process.env.PHONE_NUMBER_ID,
    });
    console.log('   Initialized: ✓');

    // Test API call
    const phones = await apiClient.listPhoneNumbers(process.env.WABA_ID);
    console.log('   API call: ✓ (' + phones.data.length + ' phones)');
  } catch (error) {
    console.log('   API call: ✗', error.message);
  }

  console.log('\n=== End Diagnostic ===');
}

diagnostic();
```

---

## Next Steps

- [CLI Guide](CLI.md) - CLI usage
- [API Reference](../API_REFERENCE.md) - Complete API documentation
- [GitHub Issues](https://github.com/your-username/waba-toolkit/issues) - Report bugs
