import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  configure,
  showConfig,
  setDefaultPhone,
  setConfigField,
  registerPhone,
  deregisterPhone,
  sendText,
  sendTemplate,
  sendFile,
  listPhones,
  listFlows,
  createFlow,
  updateFlow,
  publishFlow,
  listTemplates,
  createTemplate,
  deleteTemplate,
} from './commands/index.js';

// Get package.json version
// For CJS build, __dirname is available via require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
);

const program = new Command();

program
  .name('waba-toolkit')
  .description('WhatsApp Business API Toolkit - CLI for webhooks, media, and messaging')
  .version(packageJson.version)
  .addHelpText('after', `
Examples:
  $ waba-toolkit configure                    # Set up configuration interactively
  $ waba-toolkit config show                  # View current configuration
  $ waba-toolkit list-phones --waba-id 123    # List phone numbers
  $ waba-toolkit send text --to 1234567890 --message "Hello"
  $ waba-toolkit register --pin 123456
  $ waba-toolkit list-flows --waba-id 123     # List all flows
  $ waba-toolkit create flow --name "My Flow" # Create a new WhatsApp Flow
  $ waba-toolkit update flow --flow-id 123 --file flow.json  # Upload Flow JSON
  $ waba-toolkit publish flow --flow-id 123   # Publish flow (irreversible)
  $ waba-toolkit list-templates --waba-id 123 # List all templates
  $ waba-toolkit create template --name my_tpl --file template.json
  $ waba-toolkit delete template --name old_tpl

Environment Variables:
  WABA_TOOLKIT_ACCESS_TOKEN       Access token for WhatsApp API
  WABA_TOOLKIT_PHONE_NUMBER_ID    Default phone number ID
  WABA_TOOLKIT_WABA_ID            WhatsApp Business Account ID
  WABA_TOOLKIT_API_VERSION        API version (default: v22.0)

Configuration:
  Config is stored at ~/.waba-toolkit (encrypted, machine-locked)
  Priority: CLI flags > environment variables > config file
`);

// Configure command
program
  .command('configure')
  .description('Interactive configuration wizard')
  .addHelpText('after', `
Examples:
  $ waba-toolkit configure

  This will prompt you for:
  - Access token (required)
  - Default phone number ID (optional)
  - API version (optional, default: v22.0)
  - WABA ID (optional)
  - Business ID (optional)
`)
  .action(configure);

// Config commands
const configCommand = program
  .command('config')
  .description('Manage configuration');

configCommand
  .command('show')
  .description('Show current configuration (sensitive values masked)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit config show
`)
  .action(showConfig);

configCommand
  .command('set-default-phone <phone-number-id>')
  .description('Set default phone number ID')
  .addHelpText('after', `
Examples:
  $ waba-toolkit config set-default-phone 1234567890
`)
  .action(setDefaultPhone);

configCommand
  .command('set <field> <value>')
  .description('Update specific configuration value')
  .addHelpText('after', `
Examples:
  $ waba-toolkit config set access-token EAABsbCS...
  $ waba-toolkit config set waba-id 1234567890
  $ waba-toolkit config set default-phone-number-id 9876543210
  $ waba-toolkit config set api-version v22.0
  $ waba-toolkit config set business-id 1122334455

Valid fields:
  access-token              Your Meta access token (required for API calls)
  default-phone-number-id   Default phone number ID for sending messages
  waba-id                   WhatsApp Business Account ID (for flows/templates)
  api-version               Graph API version (default: v22.0)
  business-id               Meta Business Portfolio ID
`)
  .action(setConfigField);

// Register command
program
  .command('register')
  .description('Register phone number with WhatsApp Business API')
  .option('--bpid <phone-number-id>', 'Phone number ID (overrides default)')
  .option('--phone-number-id <id>', 'Phone number ID (alias for --bpid)')
  .requiredOption('--pin <pin>', 'Six-digit PIN for registration')
  .addHelpText('after', `
Examples:
  $ waba-toolkit register --pin 123456
  $ waba-toolkit register --bpid 1234567890 --pin 123456
`)
  .action(async (options) => {
    await registerPhone({
      bpid: options.bpid,
      phoneNumberId: options.phoneNumberId,
      pin: options.pin,
    });
  });

// Deregister command
program
  .command('deregister')
  .description('Deregister phone number from WhatsApp Business API')
  .option('--bpid <phone-number-id>', 'Phone number ID (overrides default)')
  .option('--phone-number-id <id>', 'Phone number ID (alias for --bpid)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit deregister
  $ waba-toolkit deregister --bpid 1234567890
`)
  .action(async (options) => {
    await deregisterPhone({
      bpid: options.bpid,
      phoneNumberId: options.phoneNumberId,
    });
  });

// List phone numbers command
program
  .command('list-phones')
  .description('List all phone numbers for a WhatsApp Business Account')
  .option('--waba-id <id>', 'WhatsApp Business Account ID (overrides default)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit list-phones --waba-id 1234567890
  $ WABA_TOOLKIT_WABA_ID=1234567890 waba-toolkit list-phones

Output:
  Returns JSON with phone numbers, quality ratings, and verified names
`)
  .action(async (options) => {
    await listPhones({
      wabaId: options.wabaId,
    });
  });

// Send commands
const sendCommand = program
  .command('send')
  .description('Send messages via WhatsApp Business API');

sendCommand
  .command('text')
  .description('Send text message')
  .option('--bpid <phone-number-id>', 'Phone number ID (overrides default)')
  .option('--phone-number-id <id>', 'Phone number ID (alias for --bpid)')
  .requiredOption('--to <recipient>', 'Recipient phone number')
  .requiredOption('--message <text>', 'Message text')
  .option('--preview-url', 'Enable URL preview')
  .option('--reply-to <message-id>', 'Reply to specific message ID')
  .addHelpText('after', `
Examples:
  $ waba-toolkit send text --to 1234567890 --message "Hello World"
  $ waba-toolkit send text --to 1234567890 --message "Check this out: https://example.com" --preview-url
  $ waba-toolkit send text --to 1234567890 --message "Reply" --reply-to wamid.abc123
`)
  .action(async (options) => {
    await sendText({
      bpid: options.bpid,
      phoneNumberId: options.phoneNumberId,
      to: options.to,
      message: options.message,
      previewUrl: options.previewUrl,
      replyTo: options.replyTo,
    });
  });

sendCommand
  .command('template')
  .description('Send template message from JSON file')
  .option('--bpid <phone-number-id>', 'Phone number ID (overrides default)')
  .option('--phone-number-id <id>', 'Phone number ID (alias for --bpid)')
  .requiredOption('--to <recipient>', 'Recipient phone number')
  .requiredOption('--file <path>', 'Path to template JSON file')
  .addHelpText('after', `
Examples:
  $ waba-toolkit send template --to 1234567890 --file template.json

Template JSON format:
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
`)
  .action(async (options) => {
    await sendTemplate({
      bpid: options.bpid,
      phoneNumberId: options.phoneNumberId,
      to: options.to,
      file: options.file,
    });
  });

sendCommand
  .command('file')
  .description('Send message from JSON payload file')
  .option('--bpid <phone-number-id>', 'Phone number ID (overrides default)')
  .option('--phone-number-id <id>', 'Phone number ID (alias for --bpid)')
  .requiredOption('--payload <path>', 'Path to message payload JSON file')
  .addHelpText('after', `
Examples:
  $ waba-toolkit send file --payload message.json

Payload JSON format (text message):
  {
    "messaging_product": "whatsapp",
    "to": "1234567890",
    "type": "text",
    "text": {
      "body": "Hello World"
    }
  }

Payload JSON format (image message):
  {
    "messaging_product": "whatsapp",
    "to": "1234567890",
    "type": "image",
    "image": {
      "link": "https://example.com/image.jpg"
    }
  }
`)
  .action(async (options) => {
    await sendFile({
      bpid: options.bpid,
      phoneNumberId: options.phoneNumberId,
      payload: options.payload,
    });
  });

// List flows command
program
  .command('list-flows')
  .description('List all WhatsApp Flows for a WABA')
  .option('--waba-id <id>', 'WhatsApp Business Account ID (overrides default)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit list-flows --waba-id 1234567890
  $ WABA_TOOLKIT_WABA_ID=1234567890 waba-toolkit list-flows

Output:
  Returns JSON with flow details including name, status, categories, and validation errors.
`)
  .action(async (options) => {
    await listFlows({
      wabaId: options.wabaId,
    });
  });

// Create commands
const createCommand = program
  .command('create')
  .description('Create WhatsApp Business API resources');

createCommand
  .command('flow')
  .description('Create a new WhatsApp Flow')
  .requiredOption('--name <name>', 'Name of the flow')
  .option('--categories <categories>', 'Comma-separated list of categories (default: OTHER)')
  .option('--endpoint-uri <uri>', 'Endpoint URI for the flow')
  .option('--clone-flow-id <id>', 'Clone from existing flow ID')
  .option('--waba-id <id>', 'WhatsApp Business Account ID (overrides default)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit create flow --name "My Flow"
  $ waba-toolkit create flow --name "Lead Gen Flow" --categories LEAD_GENERATION
  $ waba-toolkit create flow --name "Multi-Category" --categories LEAD_GENERATION,SURVEY
  $ waba-toolkit create flow --name "Clone" --clone-flow-id 123456789

Categories:
  SIGN_UP, SIGN_IN, APPOINTMENT_BOOKING, LEAD_GENERATION,
  CONTACT_US, CUSTOMER_SUPPORT, SURVEY, OTHER
`)
  .action(async (options) => {
    await createFlow({
      name: options.name,
      categories: options.categories,
      endpointUri: options.endpointUri,
      cloneFlowId: options.cloneFlowId,
      wabaId: options.wabaId,
    });
  });

// Update commands
const updateCommand = program
  .command('update')
  .description('Update WhatsApp Business API resources');

updateCommand
  .command('flow')
  .description('Upload or update Flow JSON for an existing flow')
  .requiredOption('--flow-id <id>', 'Flow ID to update')
  .requiredOption('--file <path>', 'Path to the Flow JSON file')
  .addHelpText('after', `
Examples:
  $ waba-toolkit update flow --flow-id 123456789 --file ./my-flow.json

Output:
  Returns JSON with success status and any validation errors from the Flow JSON.
  Validation errors include line/column numbers to help locate issues.
`)
  .action(async (options) => {
    await updateFlow({
      flowId: options.flowId,
      file: options.file,
    });
  });

// Publish commands
const publishCommand = program
  .command('publish')
  .description('Publish WhatsApp Business API resources');

publishCommand
  .command('flow')
  .description('Publish a flow (irreversible)')
  .requiredOption('--flow-id <id>', 'Flow ID to publish')
  .addHelpText('after', `
Examples:
  $ waba-toolkit publish flow --flow-id 123456789

WARNING: Publishing a flow is IRREVERSIBLE.
Once published, the flow and its assets become immutable.
To update a published flow, create a new flow with --clone-flow-id.
`)
  .action(async (options) => {
    await publishFlow({
      flowId: options.flowId,
    });
  });

// List templates command
program
  .command('list-templates')
  .description('List all message templates for a WABA')
  .option('--waba-id <id>', 'WhatsApp Business Account ID (overrides default)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit list-templates --waba-id 1234567890
  $ WABA_TOOLKIT_WABA_ID=1234567890 waba-toolkit list-templates

Output:
  Returns JSON with template details including name, status, category, and components.
`)
  .action(async (options) => {
    await listTemplates({
      wabaId: options.wabaId,
    });
  });

// Add template commands to create
createCommand
  .command('template')
  .description('Create a new message template')
  .requiredOption('--name <name>', 'Template name (lowercase, underscores, no spaces)')
  .requiredOption('--file <path>', 'Path to template JSON file')
  .option('--waba-id <id>', 'WhatsApp Business Account ID (overrides default)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit create template --name my_template --file ./template.json
  $ waba-toolkit create template --name order_update --file ./order-template.json --waba-id 123

Template JSON format:
  {
    "language": "en_US",
    "category": "MARKETING",
    "components": [
      {
        "type": "BODY",
        "text": "Hello {{1}}, your order {{2}} is ready!"
      }
    ]
  }

Categories:
  AUTHENTICATION, MARKETING, UTILITY
`)
  .action(async (options) => {
    await createTemplate({
      name: options.name,
      file: options.file,
      wabaId: options.wabaId,
    });
  });

// Delete commands
const deleteCommand = program
  .command('delete')
  .description('Delete WhatsApp Business API resources');

deleteCommand
  .command('template')
  .description('Delete a message template by name')
  .requiredOption('--name <name>', 'Template name to delete')
  .option('--waba-id <id>', 'WhatsApp Business Account ID (overrides default)')
  .addHelpText('after', `
Examples:
  $ waba-toolkit delete template --name my_template
  $ waba-toolkit delete template --name old_promo --waba-id 1234567890

Note: Deleting a template removes all language versions of that template.
`)
  .action(async (options) => {
    await deleteTemplate({
      name: options.name,
      wabaId: options.wabaId,
    });
  });

// Parse command line arguments
program.parse();
