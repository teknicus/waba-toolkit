import { WABAApiClient } from '../../api/client.js';
import { getConfig, resolvePhoneNumberId, resolveAccessToken } from '../config-manager.js';
import { printJson, formatError, handleError } from '../utils.js';
import { WABASendError } from '../../errors.js';

interface RegisterOptions {
  bpid?: string;
  phoneNumberId?: string;
  pin: string;
}

interface DeregisterOptions {
  bpid?: string;
  phoneNumberId?: string;
}

/**
 * Register phone number with WhatsApp Business API.
 */
export async function registerPhone(options: RegisterOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const phoneNumberId = resolvePhoneNumberId(options.bpid || options.phoneNumberId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId,
      apiVersion: config.apiVersion,
    });

    const response = await client.registerPhone(options.pin);
    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Phone registration failed', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

/**
 * Deregister phone number from WhatsApp Business API.
 */
export async function deregisterPhone(options: DeregisterOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const phoneNumberId = resolvePhoneNumberId(options.bpid || options.phoneNumberId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId,
      apiVersion: config.apiVersion,
    });

    const response = await client.deregisterPhone();
    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Phone deregistration failed', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}
