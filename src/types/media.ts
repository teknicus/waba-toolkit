/**
 * Media metadata returned from WABA API.
 * Field names are normalized from snake_case to camelCase.
 */
export interface MediaMetadata {
  id: string;
  /** Normalized from mime_type */
  mimeType: string;
  sha256: string;
  /** Normalized from file_size (string → number) */
  fileSize: number;
  /** Temporary URL (expires in 5 minutes) */
  url: string;
}

export interface MediaStreamResult extends MediaMetadata {
  stream: ReadableStream<Uint8Array>;
}

export interface MediaBufferResult extends MediaMetadata {
  buffer: ArrayBuffer;
}

/** Raw response from GET /{mediaId} endpoint */
export interface RawMediaResponse {
  messaging_product: string;
  url: string;
  mime_type: string;
  sha256: string;
  file_size: string;
  id: string;
}
