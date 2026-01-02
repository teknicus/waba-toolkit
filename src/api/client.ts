import { readFileSync } from 'node:fs';
import type {
  SendTextMessageRequest,
  SendTemplateMessageRequest,
  SendMessageResponse,
  SuccessResponse,
  MessagePayload,
  RegisterPhoneRequest,
  DeregisterPhoneRequest,
  ListPhoneNumbersResponse,
  CreateFlowOptions,
  CreateFlowResponse,
  UpdateFlowJsonResponse,
  PublishFlowResponse,
  ListFlowsResponse,
  ListTemplatesResponse,
  CreateTemplateRequest,
  CreateTemplateResponse,
  DeleteTemplateResponse,
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

  /**
   * Create a new WhatsApp Flow.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param options - Flow creation options
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Flow creation failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async createFlow(wabaId: string, options: CreateFlowOptions): Promise<CreateFlowResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/flows`;

    const formData = new FormData();
    formData.append('name', options.name);

    const categories = options.categories ?? ['OTHER'];
    formData.append('categories', JSON.stringify(categories));

    if (options.endpointUri) {
      formData.append('endpoint_uri', options.endpointUri);
    }

    if (options.cloneFlowId) {
      formData.append('clone_flow_id', options.cloneFlowId);
    }

    return this.makeFormDataRequest<CreateFlowResponse>(url, formData);
  }

  /**
   * Upload or update Flow JSON for an existing flow.
   *
   * @param flowId - Flow ID to update
   * @param filePath - Path to the Flow JSON file
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Flow update failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async updateFlowJson(flowId: string, filePath: string): Promise<UpdateFlowJsonResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${flowId}/assets`;

    // Read the file content
    const fileContent = readFileSync(filePath, 'utf8');
    const blob = new Blob([fileContent], { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', blob, 'flow.json');
    formData.append('name', 'flow.json');
    formData.append('asset_type', 'FLOW_JSON');

    return this.makeFormDataRequest<UpdateFlowJsonResponse>(url, formData);
  }

  /**
   * Publish a flow. This action is irreversible.
   * Once published, the flow and its assets become immutable.
   * To update a published flow, create a new flow with clone_flow_id.
   *
   * @param flowId - Flow ID to publish
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Flow publish failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async publishFlow(flowId: string): Promise<PublishFlowResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${flowId}/publish`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
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
      return (await response.json()) as PublishFlowResponse;
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
   * List all flows for a WhatsApp Business Account.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Request failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async listFlows(wabaId: string): Promise<ListFlowsResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/flows`;

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
      return (await response.json()) as ListFlowsResponse;
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
   * List all message templates for a WhatsApp Business Account.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Request failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async listTemplates(wabaId: string): Promise<ListTemplatesResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/message_templates`;
    return this.makeGetRequest<ListTemplatesResponse>(url);
  }

  /**
   * Create a new message template.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param request - Template creation request
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Template creation failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async createTemplate(wabaId: string, request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/message_templates`;
    return this.makeRequest<CreateTemplateResponse>(url, 'POST', request);
  }

  /**
   * Delete a message template by name.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param templateName - Name of the template to delete
   * @throws {WABAAuthError} - Authentication failure (invalid token)
   * @throws {WABASendError} - Template deletion failure
   * @throws {WABANetworkError} - Network/connection failures
   */
  async deleteTemplate(wabaId: string, templateName: string): Promise<DeleteTemplateResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}`;
    return this.makeDeleteRequest<DeleteTemplateResponse>(url);
  }

  private async makeGetRequest<T>(url: string): Promise<T> {
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

  private async makeDeleteRequest<T>(url: string): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'DELETE',
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

  private async makeFormDataRequest<T>(url: string, formData: FormData): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          // Note: Do NOT set Content-Type header - fetch will set it with boundary for FormData
        },
        body: formData,
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
