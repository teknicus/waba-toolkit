import { readFileSync } from 'node:fs';
import { WABAApiClient } from '../../api/client.js';
import { getConfig, resolveWabaId, resolveAccessToken } from '../config-manager.js';
import { printJson, formatError, handleError } from '../utils.js';
import { WABASendError } from '../../errors.js';
import type { CreateTemplateRequest } from '../../api/types.js';

interface ListTemplatesOptions {
  wabaId?: string;
}

/**
 * List all message templates for a WhatsApp Business Account.
 */
export async function listTemplates(options: ListTemplatesOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const wabaId = resolveWabaId(options.wabaId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for template operations
      apiVersion: config.apiVersion,
    });

    const response = await client.listTemplates(wabaId);

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to list templates', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

interface CreateTemplateOptions {
  name: string;
  file: string;
  wabaId?: string;
}

/**
 * Create a new message template.
 */
export async function createTemplate(options: CreateTemplateOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const wabaId = resolveWabaId(options.wabaId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for template operations
      apiVersion: config.apiVersion,
    });

    // Read and parse template file
    const fileContent = readFileSync(options.file, 'utf8');
    const templateData = JSON.parse(fileContent) as Omit<CreateTemplateRequest, 'name'>;

    const request: CreateTemplateRequest = {
      name: options.name,
      ...templateData,
    };

    const response = await client.createTemplate(wabaId, request);

    printJson(response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(formatError('Invalid JSON in template file', { message: error.message }));
    } else if (error instanceof WABASendError) {
      console.error(formatError('Failed to create template', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

interface DeleteTemplateOptions {
  name: string;
  wabaId?: string;
}

/**
 * Delete a message template by name.
 */
export async function deleteTemplate(options: DeleteTemplateOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const wabaId = resolveWabaId(options.wabaId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for template operations
      apiVersion: config.apiVersion,
    });

    const response = await client.deleteTemplate(wabaId, options.name);

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to delete template', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}
