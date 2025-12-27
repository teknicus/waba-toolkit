import type { WABAClientOptions, GetMediaOptions } from './types/client.js';
import type {
  MediaMetadata,
  MediaStreamResult,
  MediaBufferResult,
  RawMediaResponse,
} from './types/media.js';
import { WABAMediaError, WABANetworkError, WABASignatureError } from './errors.js';
import { verifyWebhookSignature } from './verify.js';

const DEFAULT_API_VERSION = 'v22.0';
const DEFAULT_BASE_URL = 'https://graph.facebook.com';

/**
 * Client for WhatsApp Business API media operations.
 */
export class WABAClient {
  private readonly accessToken: string;
  private readonly appSecret?: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;

  constructor(options: WABAClientOptions) {
    this.accessToken = options.accessToken;
    this.appSecret = options.appSecret;
    this.apiVersion = options.apiVersion ?? DEFAULT_API_VERSION;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * Verifies webhook signature using HMAC-SHA256.
   * Requires appSecret to be set in constructor options.
   *
   * @throws {WABASignatureError} If appSecret was not provided in constructor
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhook(signature: string | undefined, rawBody: Buffer | string): boolean {
    if (!this.appSecret) {
      throw new WABASignatureError(
        'appSecret is required for webhook verification. Pass it in WABAClientOptions.'
      );
    }
    return verifyWebhookSignature({ signature, rawBody, appSecret: this.appSecret });
  }

  /**
   * Fetches media by ID from WhatsApp Business API.
   *
   * Step 1: GET /{apiVersion}/{mediaId} → retrieves temporary URL + metadata
   * Step 2: GET {temporaryUrl} → downloads binary content
   *
   * @throws {WABAMediaError} - Media not found (404) or access denied
   * @throws {WABANetworkError} - Network/connection failures
   */
  async getMedia(mediaId: string): Promise<MediaStreamResult>;
  async getMedia(
    mediaId: string,
    options: { asBuffer: true }
  ): Promise<MediaBufferResult>;
  async getMedia(
    mediaId: string,
    options?: GetMediaOptions
  ): Promise<MediaStreamResult | MediaBufferResult>;
  async getMedia(
    mediaId: string,
    options?: GetMediaOptions
  ): Promise<MediaStreamResult | MediaBufferResult> {
    // Step 1: Get media metadata and temporary URL
    const metadata = await this.fetchMediaMetadata(mediaId);

    // Step 2: Download the actual media
    const response = await this.downloadMedia(metadata.url, mediaId);

    if (options?.asBuffer) {
      const buffer = await response.arrayBuffer();
      return {
        ...metadata,
        buffer,
      };
    }

    if (!response.body) {
      throw new WABAMediaError('Response body is null', mediaId);
    }

    return {
      ...metadata,
      stream: response.body,
    };
  }

  private async fetchMediaMetadata(mediaId: string): Promise<MediaMetadata> {
    const url = `${this.baseUrl}/${this.apiVersion}/${mediaId}`;

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
        `Failed to fetch media metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new WABAMediaError(
        `Failed to fetch media metadata: ${response.status} ${errorBody}`,
        mediaId,
        response.status
      );
    }

    const data = (await response.json()) as RawMediaResponse;

    // Normalize snake_case to camelCase
    return {
      id: data.id,
      mimeType: data.mime_type,
      sha256: data.sha256,
      fileSize: parseInt(data.file_size, 10),
      url: data.url,
    };
  }

  private async downloadMedia(url: string, mediaId: string): Promise<Response> {
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
        `Failed to download media: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    if (!response.ok) {
      throw new WABAMediaError(
        `Failed to download media: ${response.status}`,
        mediaId,
        response.status
      );
    }

    return response;
  }
}
