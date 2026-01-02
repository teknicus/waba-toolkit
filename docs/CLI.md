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
| `list-flows` | List all WhatsApp Flows |
| `create flow` | Create a new WhatsApp Flow |
| `update flow` | Upload Flow JSON to existing flow |
| `publish flow` | Publish a flow (irreversible) |
| `list-templates` | List all message templates |
| `create template` | Create a new message template |
| `delete template` | Delete a message template |

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

## Flow Management

WhatsApp Flows are interactive forms that run inside WhatsApp. Use these commands to create and update flows.

### List Flows

```bash
waba-toolkit list-flows --waba-id 1234567890

# Using environment variable
export WABA_TOOLKIT_WABA_ID=1234567890
waba-toolkit list-flows
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--waba-id <id>` | No | Override WABA ID from config/env |

**Response:**
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "Lead Form",
      "status": "PUBLISHED",
      "categories": ["LEAD_GENERATION"],
      "validation_errors": []
    },
    {
      "id": "987654321",
      "name": "Draft Flow",
      "status": "DRAFT",
      "categories": ["OTHER"],
      "validation_errors": []
    }
  ]
}
```

**Flow statuses:** `DRAFT` | `PUBLISHED` | `DEPRECATED` | `BLOCKED` | `THROTTLED`

---

### Create Flow

```bash
# Basic flow
waba-toolkit create flow --name "My Flow"

# With category
waba-toolkit create flow --name "Lead Gen" --categories LEAD_GENERATION

# Multiple categories
waba-toolkit create flow --name "Multi" --categories LEAD_GENERATION,SURVEY

# With data endpoint
waba-toolkit create flow \
  --name "Dynamic Flow" \
  --categories APPOINTMENT_BOOKING \
  --endpoint-uri https://example.com/flow-data

# Clone existing flow
waba-toolkit create flow --name "Clone" --clone-flow-id 123456789
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--name <name>` | Yes | Flow name |
| `--categories <list>` | No | Comma-separated categories (default: OTHER) |
| `--endpoint-uri <url>` | No | Data endpoint URL |
| `--clone-flow-id <id>` | No | Clone from existing flow |
| `--waba-id <id>` | No | Override WABA ID |

**Categories:**

| Category | Use Case |
|----------|----------|
| `SIGN_UP` | User registration |
| `SIGN_IN` | Authentication |
| `APPOINTMENT_BOOKING` | Scheduling |
| `LEAD_GENERATION` | Collecting leads |
| `CONTACT_US` | Contact forms |
| `CUSTOMER_SUPPORT` | Support requests |
| `SURVEY` | Feedback collection |
| `OTHER` | General purpose (default) |

**Response:**
```json
{
  "id": "1234567890"
}
```

### Update Flow JSON

Upload Flow JSON to an existing flow. Returns validation errors if the JSON is invalid.

```bash
waba-toolkit update flow --flow-id 1234567890 --file ./my-flow.json
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--flow-id <id>` | Yes | Flow ID to update |
| `--file <path>` | Yes | Path to Flow JSON file |

**Success Response:**
```json
{
  "success": true,
  "validation_errors": []
}
```

**Validation Errors:**

If the Flow JSON has issues, you'll see detailed errors:

```json
{
  "success": true,
  "validation_errors": [
    {
      "error": "INVALID_PROPERTY_KEY",
      "error_type": "FLOW_JSON_ERROR",
      "message": "Property 'invalid-prop' is not allowed in 'TextHeading'",
      "line_start": 14,
      "line_end": 14,
      "column_start": 13,
      "column_end": 31
    }
  ]
}
```

### Flow JSON Example

**Create `my-flow.json`:**
```json
{
  "version": "7.3",
  "screens": [
    {
      "id": "WELCOME",
      "title": "Welcome",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Hello!"
          },
          {
            "type": "Footer",
            "label": "Complete",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

**Create and update:**
```bash
# Create the flow
waba-toolkit create flow --name "Welcome Flow" --categories OTHER

# Note the returned flow ID, then upload the JSON
waba-toolkit update flow --flow-id <FLOW_ID> --file my-flow.json
```

### Publish Flow

Publish a flow to make it available for use. **This action is irreversible.**

```bash
waba-toolkit publish flow --flow-id 123456789
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--flow-id <id>` | Yes | Flow ID to publish |

**Response:**
```json
{
  "success": true
}
```

**Important:**
- Publishing is **irreversible** - the flow becomes immutable
- To update a published flow, create a new flow with `--clone-flow-id`
- Only flows with valid JSON (no validation errors) can be published

**Complete workflow:**
```bash
# 1. Create flow
waba-toolkit create flow --name "Lead Form" --categories LEAD_GENERATION
# Returns: { "id": "123456789" }

# 2. Upload Flow JSON
waba-toolkit update flow --flow-id 123456789 --file ./lead-form.json
# Check validation_errors is empty

# 3. Publish (irreversible)
waba-toolkit publish flow --flow-id 123456789
```

---

## Template Management

Message templates are pre-approved messages you can send to users. Use these commands to manage templates.

### List Templates

```bash
waba-toolkit list-templates --waba-id 1234567890

# Using environment variable
export WABA_TOOLKIT_WABA_ID=1234567890
waba-toolkit list-templates
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--waba-id <id>` | No | Override WABA ID from config/env |

**Response:**
```json
{
  "data": [
    {
      "name": "hello_world",
      "status": "APPROVED",
      "category": "MARKETING",
      "language": "en_US",
      "id": "1234567890",
      "components": [...]
    }
  ]
}
```

**Template statuses:** `APPROVED` | `PENDING` | `REJECTED` | `IN_APPEAL` | `DISABLED` | `PAUSED`

---

### Create Template

```bash
# Basic template
waba-toolkit create template --name my_template --file ./template.json

# With explicit WABA ID
waba-toolkit create template --name promo_template --file ./promo.json --waba-id 123
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--name <name>` | Yes | Template name (lowercase, underscores only) |
| `--file <path>` | Yes | Path to template JSON file |
| `--waba-id <id>` | No | Override WABA ID |

**Categories:**

| Category | Use Case |
|----------|----------|
| `AUTHENTICATION` | OTP codes, 2FA |
| `MARKETING` | Promotions, newsletters |
| `UTILITY` | Order updates, confirmations |

**Template JSON Example:**

Create `template.json`:
```json
{
  "language": "en_US",
  "category": "MARKETING",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Welcome!"
    },
    {
      "type": "BODY",
      "text": "Hello {{1}}, thank you for signing up!"
    },
    {
      "type": "FOOTER",
      "text": "Reply STOP to unsubscribe"
    }
  ]
}
```

**Response:**
```json
{
  "id": "1234567890",
  "status": "PENDING",
  "category": "MARKETING"
}
```

**Template with Flow button:**

Create a template that launches a WhatsApp Flow:
```json
{
  "language": "en_US",
  "category": "MARKETING",
  "components": [
    {
      "type": "BODY",
      "text": "Click below to complete our survey!"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "FLOW",
          "text": "Take Survey",
          "flow_id": "123456789",
          "navigate_screen": "WELCOME",
          "flow_action": "navigate"
        }
      ]
    }
  ]
}
```

---

### Delete Template

Delete a message template by name. This removes all language versions.

```bash
waba-toolkit delete template --name my_template

# With explicit WABA ID
waba-toolkit delete template --name old_promo --waba-id 1234567890
```

**Options:**

| Flag | Required | Description |
|------|----------|-------------|
| `--name <name>` | Yes | Template name to delete |
| `--waba-id <id>` | No | Override WABA ID |

**Response:**
```json
{
  "success": true
}
```

**Note:** Deleting a template removes **all language versions** of that template.

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
