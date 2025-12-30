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

/** Error for configuration issues (missing values, invalid config) */
export class WABAConfigError extends WABAError {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'WABAConfigError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Error for authentication failures */
export class WABAAuthError extends WABAError {
  constructor(message: string, public readonly statusCode: number) {
    super(message, statusCode);
    this.name = 'WABAAuthError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Error for message sending failures */
export class WABASendError extends WABAError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorPayload: unknown
  ) {
    super(message, statusCode, errorPayload);
    this.name = 'WABASendError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
