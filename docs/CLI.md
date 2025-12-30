# CLI Guide

Use waba-toolkit from the command line.

---

## Install

```bash
# Global (recommended)
npm install -g waba-toolkit

# Or use with npx
npx waba-toolkit --help
```

---

## Configure Once

```bash
waba-toolkit configure
```

**Prompts for:**
- Access token (required)
- Default phone number ID (optional)
- API version (optional, default: v22.0)
- WABA ID (optional)
- Business ID (optional)

**Config stored at:** `~/.waba-toolkit` (encrypted, machine-locked)

---

## Commands Overview

| Command | Description |
|---------|-------------|
| `configure` | Interactive setup wizard |
| `config show` | Display current configuration (masked) |
| `config set-default-phone` | Set default phone number ID |
| `config set <field> <value>` | Update config field |
| `register --pin <pin>` | Register phone number |
| `deregister` | Deregister phone number |
| `list-phones --waba-id <id>` | List all phone numbers |
| `send text` | Send text message |
| `send template` | Send template message from JSON |
| `send file` | Send custom message from JSON |

---

## Configuration Commands

### View Current Config

```bash
waba-toolkit config show
```

**Output:**
```
Access Token: EAA...****...abc (masked)
Default Phone Number ID: 1234567890
API Version: v22.0
WABA ID: (not set)
```

### Set Default Phone

```bash
waba-toolkit config set-default-phone 1234567890
```

### Update Config Fields

```bash
waba-toolkit config set access-token EAABsbCS...
waba-toolkit config set api-version v22.0
waba-toolkit config set waba-id 1234567890
waba-toolkit config set business-id 9876543210
```

**Valid fields:**
- `access-token`
- `default-phone-number-id`
- `api-version`
- `waba-id`
- `business-id`

---

## Environment Variables

Override config with environment variables:

```bash
export WABA_TOOLKIT_ACCESS_TOKEN="your-token"
export WABA_TOOLKIT_PHONE_NUMBER_ID="your-phone-id"
export WABA_TOOLKIT_WABA_ID="your-waba-id"
export WABA_TOOLKIT_API_VERSION="v22.0"
export WABA_TOOLKIT_BUSINESS_ID="your-business-id"
```

**Priority:** CLI flags > env vars > config file > defaults

**Use case:** CI/CD pipelines, temporary overrides, multi-environment setups

---

## Phone Management

### Register Phone

```bash
# With default phone from config
waba-toolkit register --pin 123456

# With explicit phone ID
waba-toolkit register --bpid 1234567890 --pin 123456
```

### Deregister Phone

```bash
# With default phone from config
waba-toolkit deregister

# With explicit phone ID
waba-toolkit deregister --bpid 1234567890
```

### List Phone Numbers

```bash
waba-toolkit list-phones --waba-id 1234567890

# Using environment variable
export WABA_TOOLKIT_WABA_ID=1234567890
waba-toolkit list-phones
```

---

## Sending Messages

### Text Message

> See also: [Sending Messages via Library](SENDING.md#text-messages)

```bash
# Basic text
waba-toolkit send text --to 1234567890 --message "Hello World"

# With URL preview
waba-toolkit send text \
  --to 1234567890 \
  --message "Check this: https://example.com" \
  --preview-url

# Reply to message
waba-toolkit send text \
  --to 1234567890 \
  --message "Got it!" \
  --reply-to wamid.abc123

# With explicit phone number ID
waba-toolkit send text \
  --bpid 9876543210 \
  --to 1234567890 \
  --message "Hello"
```

### Template Message

> See also: [Template Messages via Library](SENDING.md#template-messages)

**Create template.json:**
```json
{
  "name": "order_confirmation",
  "language": { "code": "en_US" },
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John Doe" },
        { "type": "text", "text": "ORD-12345" }
      ]
    }
  ]
}
```

**Send:**
```bash
waba-toolkit send template --to 1234567890 --file template.json

# With explicit phone ID
waba-toolkit send template \
  --bpid 9876543210 \
  --to 1234567890 \
  --file template.json
```

### Custom Message Payload

**Create message.json:**
```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }
}
```

**Send:**
```bash
waba-toolkit send file --payload message.json

# With explicit phone ID
waba-toolkit send file --bpid 9876543210 --payload message.json
```

---

## Global Flags

Available on all commands:

| Flag | Description |
|------|-------------|
| `--bpid <id>` | Override phone number ID |
| `--phone-number-id <id>` | Alias for --bpid |
| `--api-version <version>` | Override API version |
| `--help` | Show command help |
| `--version` | Show package version |

---

## Examples

### First-Time Setup

```bash
# 1. Install
npm install -g waba-toolkit

# 2. Configure
waba-toolkit configure
# Enter: access token, phone ID

# 3. Register phone
waba-toolkit register --pin 123456

# 4. Send test message
waba-toolkit send text --to YOUR_NUMBER --message "Test"
```

### CI/CD Usage

```bash
# No config file needed - use env vars
export WABA_TOOLKIT_ACCESS_TOKEN="${SECRET_TOKEN}"
export WABA_TOOLKIT_PHONE_NUMBER_ID="1234567890"

# Send notification
waba-toolkit send text \
  --to "${RECIPIENT}" \
  --message "Deployment successful"
```

### Multi-Environment

```bash
# Production
export WABA_TOOLKIT_ACCESS_TOKEN="${PROD_TOKEN}"
waba-toolkit send text --to 123 --message "Hello"

# Staging
export WABA_TOOLKIT_ACCESS_TOKEN="${STAGING_TOKEN}"
waba-toolkit send text --to 123 --message "Hello"
```

---

## Message Payload Examples

### Image with Caption

```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "image",
  "image": {
    "link": "https://example.com/photo.jpg",
    "caption": "Amazing photo"
  }
}
```

### Interactive List

```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Choose an option" },
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

### Location

```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "location",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "name": "San Francisco",
    "address": "California, USA"
  }
}
```

---

## Error Handling

### Configuration Errors

```bash
# Missing phone number ID
✗ Error: No phone number ID specified

You must either:
  1. Set a default: waba-toolkit config set-default-phone <id>
  2. Use environment variable: WABA_TOOLKIT_PHONE_NUMBER_ID=<id>
  3. Specify with flag: --bpid <id>
```

### API Errors

API errors are printed as-is with full details:

```json
{
  "error": {
    "message": "(#131047) Re-engagement message",
    "type": "OAuthException",
    "code": 131047,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Message failed to send because more than 24 hours..."
    },
    "fbtrace_id": "A1B2C3D4E5F6G7H8"
  }
}
```

Use `fbtrace_id` when contacting Meta support.

---

## Troubleshooting

### Config Decryption Failed

If you see "Failed to decrypt config":

**Causes:**
- Config moved to different machine
- Hostname changed
- MAC address changed

**Solution:**
```bash
# Reconfigure
waba-toolkit configure
```

Old config is automatically backed up.

### Permission Denied

```bash
# Install globally with sudo if needed
sudo npm install -g waba-toolkit

# Or use npx without install
npx waba-toolkit <command>
```

### Command Not Found

```bash
# Check installation
npm list -g waba-toolkit

# Reinstall
npm install -g waba-toolkit
```

---

## Tips

1. **Use env vars in CI/CD** - Avoid committing config files
2. **Save template JSONs** - Version control reusable templates
3. **Check fbtrace_id** - Include in support tickets
4. **Test with your number first** - Before sending to customers

---

## Next Steps

- [Send Messages (Library)](SENDING.md) - Use API client in code
- [Webhook Processing](WEBHOOKS.md) - Handle incoming webhooks
- [API Reference](../API_REFERENCE.md) - Complete API docs
