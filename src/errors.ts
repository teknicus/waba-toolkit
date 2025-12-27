/** Base error class for all WABA errors */
export class WABAError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WABAError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Error for media-related failures (404, access denied) */
export class WABAMediaError extends WABAError {
  constructor(
    message: string,
    public readonly mediaId: string,
    code?: number
  ) {
    super(message, code);
    this.name = 'WABAMediaError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Error for network/connection failures */
export class WABANetworkError extends WABAError {
  override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'WABANetworkError';
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Error for invalid webhook signatures */
export class WABASignatureError extends WABAError {
  constructor(message: string = 'Invalid webhook signature') {
    super(message);
    this.name = 'WABASignatureError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
