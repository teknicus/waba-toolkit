export interface WABAClientOptions {
  /** Meta access token with whatsapp_business_messaging permission */
  accessToken: string;
  /** Meta App Secret for webhook signature verification */
  appSecret?: string;
  /** API version (default: 'v22.0') */
  apiVersion?: string;
  /** Base URL (default: 'https://graph.facebook.com') */
  baseUrl?: string;
}

export interface GetMediaOptions {
  /** Return ArrayBuffer instead of ReadableStream (default: false) */
  asBuffer?: boolean;
}
