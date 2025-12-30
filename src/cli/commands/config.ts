import { loadConfig, updateConfigField } from '../config-manager.js';
import { maskValue, formatSuccess, handleError } from '../utils.js';
import type { Config } from '../config-manager.js';

/**
 * Show current configuration with sensitive values masked.
 */
export function showConfig(): void {
  try {
    const config = loadConfig();

    if (!config) {
      console.log('No configuration found. Run: waba-toolkit configure');
      return;
    }

    console.log('Current Configuration:\n');
    console.log(`Access Token: ${maskValue(config.accessToken)}`);
    console.log(`Default Phone Number ID: ${config.defaultPhoneNumberId || '(not set)'}`);
    console.log(`API Version: ${config.apiVersion || 'v22.0'}`);
    console.log(`WABA ID: ${config.wabaId || '(not set)'}`);
    console.log(`Business ID: ${config.businessId || '(not set)'}`);

    console.log('\nConfig file: ~/.waba-toolkit');
  } catch (error) {
    handleError(error);
  }
}

/**
 * Set default phone number ID.
 */
export function setDefaultPhone(phoneNumberId: string): void {
  try {
    if (!phoneNumberId || phoneNumberId.trim().length === 0) {
      throw new Error('Phone number ID is required');
    }

    updateConfigField('defaultPhoneNumberId', phoneNumberId.trim());
    console.log(formatSuccess(`Default phone number ID set to: ${phoneNumberId.trim()}`));
  } catch (error) {
    handleError(error);
  }
}

/**
 * Set config field value.
 */
export function setConfigField(field: string, value: string): void {
  try {
    if (!value || value.trim().length === 0) {
      throw new Error(`Value for ${field} is required`);
    }

    const validFields: Array<keyof Config> = [
      'accessToken',
      'defaultPhoneNumberId',
      'apiVersion',
      'wabaId',
      'businessId',
    ];

    // Convert kebab-case to camelCase for field name
    const camelField = field.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    if (!validFields.includes(camelField as keyof Config)) {
      throw new Error(
        `Invalid field: ${field}\n\nValid fields: ${validFields.join(', ')}`
      );
    }

    updateConfigField(camelField as keyof Config, value.trim());
    console.log(formatSuccess(`${field} updated successfully`));
  } catch (error) {
    handleError(error);
  }
}
