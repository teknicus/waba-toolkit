import { readFileSync } from 'node:fs';
import { WABAApiClient } from '../../api/client.js';
import { getConfig, resolvePhoneNumberId, resolveAccessToken } from '../config-manager.js';
import { printJson, formatError, handleError } from '../utils.js';
import { WABASendError } from '../../errors.js';
import type { SendTemplateMessageRequest, MessagePayload } from '../../api/types.js';

interface SendTextOptions {
  bpid?: string;
  phoneNumberId?: string;
  to: string;
  message: string;
  previewUrl?: boolean;
  replyTo?: string;
}

interface SendTemplateOptions {
  bpid?: string;
  phoneNumberId?: string;
  to: string;
  file: string;
}

interface SendFileOptions {
  bpid?: string;
  phoneNumberId?: string;
  payload: string;
}

/**
 * Send text message.
 */
export async function sendText(options: SendTextOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const phoneNumberId = resolvePhoneNumberId(options.bpid || options.phoneNumberId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId,
      apiVersion: config.apiVersion,
    });

    const context = options.replyTo ? { message_id: options.replyTo } : undefined;

    const response = await client.sendTextMessage(options.to, options.message, {
      previewUrl: options.previewUrl,
      context,
    });

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Message failed to send', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

/**
 * Send template message from JSON file.
 */
export async function sendTemplate(options: SendTemplateOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const phoneNumberId = resolvePhoneNumberId(options.bpid || options.phoneNumberId);
    const config = getConfig();

    // Read and parse template file
    let templateData: SendTemplateMessageRequest['template'];
    try {
      const fileContent = readFileSync(options.file, 'utf8');
      templateData = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(
        `Failed to read template file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId,
      apiVersion: config.apiVersion,
    });

    const response = await client.sendTemplateMessage(options.to, templateData);
    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Template message failed to send', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

/**
 * Send message from JSON payload file.
 */
export async function sendFile(options: SendFileOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const phoneNumberId = resolvePhoneNumberId(options.bpid || options.phoneNumberId);
    const config = getConfig();

    // Read and parse payload file
    let payload: MessagePayload;
    try {
      const fileContent = readFileSync(options.payload, 'utf8');
      payload = JSON.parse(fileContent);
    } catch (error) {
      throw new Error(
        `Failed to read payload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId,
      apiVersion: config.apiVersion,
    });

    const response = await client.sendMessage(payload);
    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Message failed to send', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}
