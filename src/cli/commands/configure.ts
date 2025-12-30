import inquirer from 'inquirer';
import { saveConfig } from '../config-manager.js';
import { formatSuccess, handleError } from '../utils.js';
import type { Config } from '../config-manager.js';

export async function configure(): Promise<void> {
  try {
    console.log('WhatsApp Business API Toolkit - Configuration\n');

    const answers = await inquirer.prompt<Config>([
      {
        type: 'input',
        name: 'accessToken',
        message: 'Access token (required):',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Access token is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'defaultPhoneNumberId',
        message: 'Default phone number ID (optional):',
      },
      {
        type: 'input',
        name: 'apiVersion',
        message: 'API version (optional):',
        default: 'v22.0',
      },
      {
        type: 'input',
        name: 'wabaId',
        message: 'WhatsApp Business Account ID (optional):',
      },
      {
        type: 'input',
        name: 'businessId',
        message: 'Business Portfolio ID (optional):',
      },
    ]);

    // Remove empty optional fields
    const config: Config = {
      accessToken: answers.accessToken,
    };

    if (answers.defaultPhoneNumberId?.trim()) {
      config.defaultPhoneNumberId = answers.defaultPhoneNumberId.trim();
    }
    if (answers.apiVersion?.trim()) {
      config.apiVersion = answers.apiVersion.trim();
    }
    if (answers.wabaId?.trim()) {
      config.wabaId = answers.wabaId.trim();
    }
    if (answers.businessId?.trim()) {
      config.businessId = answers.businessId.trim();
    }

    saveConfig(config);

    console.log('\n' + formatSuccess('Configuration saved successfully'));
    console.log('\nConfig is encrypted and stored at: ~/.waba-toolkit');
    console.log('The config is machine-locked and cannot be moved between systems.');
  } catch (error) {
    handleError(error);
  }
}
