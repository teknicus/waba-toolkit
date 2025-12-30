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
  $ waba-toolkit config set api-version v22.0

Valid fields:
  - access-token
  - default-phone-number-id
  - api-version
  - waba-id
  - business-id
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

// Parse command line arguments
program.parse();
