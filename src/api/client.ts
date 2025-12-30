import type {
  SendTextMessageRequest,
  SendTemplateMessageRequest,
  SendMessageResponse,
  SuccessResponse,
  MessagePayload,
  RegisterPhoneRequest,
  DeregisterPhoneRequest,
  ListPhoneNumbersResponse,
} from './types.js';
import { WABANetworkError, WABASendError, WABAAuthError } from '../errors.js';

const DEFAULT_API_VERSION = 'v22.0';
const DEFAULT_BASE_URL = 'https://graph.facebook.com';

export interface WABAApiClientOptions {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  baseUrl?: string;
}

/**
 * Client for WhatsApp Business API outbound operations (sending messages, phone registration).
 */
export class WABAApiClient {
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;

  constructor(options: WABAApiClientOptions) {
    this.accessToken = options.accessToken;
    this.phoneNumberId = options.phoneNumberId;
    this.apiVersion = options.apiVersion ?? DEFAULT_API_VERSION;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * Register phone number with WhatsApp Business API.
   *
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Registration failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async registerPhone(pin: string): Promise<SuccessResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/register`;
    const payload: RegisterPhoneRequest = {
      messaging_product: 'whatsapp',
      pin,
    };

    return this.makeRequest<SuccessResponse>(url, 'POST', payload);
  }

  /**
   * Deregister phone number from WhatsApp Business API.
   *
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Deregistration failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async deregisterPhone(): Promise<SuccessResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/deregister`;
    const payload: DeregisterPhoneRequest = {
      messaging_product: 'whatsapp',
    };

    return this.makeRequest<SuccessResponse>(url, 'POST', payload);
  }

  /**
   * List all phone numbers in a WhatsApp Business Account.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Request failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async listPhoneNumbers(wabaId: string): Promise<ListPhoneNumbersResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/phone_numbers`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      throw new WABANetworkError(
        `Failed to make request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    // Success response
    if (response.ok) {
      return (await response.json()) as ListPhoneNumbersResponse;
    }

    // Error handling
    const errorBody = await response.json().catch(() => null);

    // Authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      throw new WABAAuthError(
        `Authentication failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    // All other errors
    throw new WABASendError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  /**
   * Send text message.
   *
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Message sending failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async sendTextMessage(
    to: string,
    text: string,
    options?: { previewUrl?: boolean; context?: { message_id: string } }
  ): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const payload: SendTextMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: options?.previewUrl ?? false,
      },
    };

    if (options?.context) {
      payload.context = options.context;
    }

    return this.makeRequest<SendMessageResponse>(url, 'POST', payload);
  }

  /**
   * Send template message.
   *
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Message sending failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async sendTemplateMessage(
    to: string,
    template: SendTemplateMessageRequest['template']
  ): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const payload: SendTemplateMessageRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template,
    };

    return this.makeRequest<SendMessageResponse>(url, 'POST', payload);
  }

  /**
   * Send generic message (accepts full message payload).
   * Useful for sending any message type (image, video, document, interactive, etc.).
   *
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Message sending failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async sendMessage(payload: MessagePayload): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    return this.makeRequest<SendMessageResponse>(url, 'POST', payload);
  }

  private async makeRequest<T>(url: string, method: string, body: unknown): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new WABANetworkError(
        `Failed to make request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    // Success response
    if (response.ok) {
      return (await response.json()) as T;
    }

    // Error handling
    const errorBody = await response.json().catch(() => null);

    // Authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      throw new WABAAuthError(
        `Authentication failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    // All other errors
    throw new WABASendError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }
}
