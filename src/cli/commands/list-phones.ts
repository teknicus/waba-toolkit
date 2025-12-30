import { WABAApiClient } from '../../api/client.js';
import { getConfig, resolveWabaId, resolveAccessToken } from '../config-manager.js';
import { printJson, formatError, handleError } from '../utils.js';
import { WABASendError } from '../../errors.js';

interface ListPhonesOptions {
  wabaId?: string;
}

/**
 * List all phone numbers for a WhatsApp Business Account.
 */
export async function listPhones(options: ListPhonesOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const wabaId = resolveWabaId(options.wabaId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for listPhoneNumbers
      apiVersion: config.apiVersion,
    });

    const response = await client.listPhoneNumbers(wabaId);
    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to list phone numbers', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}
