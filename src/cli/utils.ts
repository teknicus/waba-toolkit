/**
 * Mask sensitive value showing first 3 and last 3 characters.
 * Example: "EAABsbCS1234567890abc" -> "EAA...****...abc"
 */
export function maskValue(value: string): string {
  if (value.length <= 6) {
    return '***';
  }
  const first = value.slice(0, 3);
  const last = value.slice(-3);
  return `${first}...****...${last}`;
}

/**
 * Format error message for display.
 * If error payload is provided, format as JSON.
 */
export function formatError(message: string, payload?: unknown): string {
  let output = `✗ ${message}`;

  if (payload) {
    output += '\n\n' + JSON.stringify(payload, null, 2);
  }

  return output;
}

/**
 * Format success message for display.
 */
export function formatSuccess(message: string): string {
  return `✓ ${message}`;
}

/**
 * Print JSON response to stdout.
 */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Handle and display CLI errors.
 */
export function handleError(error: unknown): never {
  if (error instanceof Error) {
    console.error(formatError(error.message));
  } else {
    console.error(formatError('Unknown error occurred'));
  }
  process.exit(1);
}
