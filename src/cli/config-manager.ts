import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { homedir, hostname, networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { WABAConfigError } from '../errors.js';

export interface Config {
  accessToken: string;
  defaultPhoneNumberId?: string;
  apiVersion?: string;
  wabaId?: string;
  businessId?: string;
}

const CONFIG_FILE = join(homedir(), '.waba-toolkit');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get machine-specific encryption key derived from hostname and MAC address.
 * Falls back to hostname only if MAC address is unavailable.
 */
function getMachineKey(): Buffer {
  const host = hostname();

  // Try to get MAC address from network interfaces
  let macAddress = '';
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const addr of iface) {
      // Skip internal/loopback and interfaces without MAC
      if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
        macAddress = addr.mac;
        break;
      }
    }
    if (macAddress) break;
  }

  // Use hostname + MAC if available, otherwise just hostname
  const keySource = macAddress ? `${host}:${macAddress}` : host;

  // Derive key using SHA-256
  return createHash('sha256').update(keySource).digest();
}

/**
 * Encrypt config data using AES-256-GCM.
 */
function encryptConfig(config: Config): string {
  const key = getMachineKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(config);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Store IV + authTag + encrypted data
  const result = {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted,
  };

  return JSON.stringify(result);
}

/**
 * Decrypt config data using AES-256-GCM.
 * @throws {WABAConfigError} If decryption fails
 */
function decryptConfig(encrypted: string): Config {
  try {
    const { iv, authTag, data } = JSON.parse(encrypted);
    const key = getMachineKey();

    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    throw new WABAConfigError(
      'Failed to decrypt config file. This may happen if:\n' +
      '  - Config was created on a different machine\n' +
      '  - System hostname or network configuration changed\n' +
      '  - Config file is corrupted'
    );
  }
}

/**
 * Create a backup of the config file with ISO 8601 timestamp.
 */
function backupConfig(): void {
  if (!existsSync(CONFIG_FILE)) return;

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupPath = `${CONFIG_FILE}.backup.${timestamp}`;

  try {
    renameSync(CONFIG_FILE, backupPath);
    console.log(`✓ Old config backed up to: ${backupPath}`);
  } catch (error) {
    console.error(`✗ Failed to backup config: ${error}`);
  }
}

/**
 * Load config from file with decryption.
 * @returns Config object or null if file doesn't exist or decryption fails
 */
export function loadConfig(): Config | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  try {
    const encrypted = readFileSync(CONFIG_FILE, 'utf8');
    return decryptConfig(encrypted);
  } catch (error) {
    if (error instanceof WABAConfigError) {
      // Decryption failed - backup the old config
      console.error(`✗ ${error.message}\n`);
      backupConfig();
      return null;
    }
    throw error;
  }
}

/**
 * Save config to file with encryption.
 */
export function saveConfig(config: Config): void {
  try {
    const encrypted = encryptConfig(config);
    writeFileSync(CONFIG_FILE, encrypted, { mode: 0o600 }); // Readable only by owner
  } catch (error) {
    throw new WABAConfigError(
      `Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update specific config field.
 */
export function updateConfigField(field: keyof Config, value: string): void {
  const config = loadConfig() || ({ accessToken: '' } as Config);
  config[field] = value as never;
  saveConfig(config);
}

/**
 * Get merged config from environment variables, config file, and defaults.
 * Priority: env vars > config file > defaults
 */
export function getConfig(): Partial<Config> {
  const fileConfig: Partial<Config> = loadConfig() || {};

  return {
    accessToken: process.env.WABA_TOOLKIT_ACCESS_TOKEN || fileConfig.accessToken,
    defaultPhoneNumberId:
      process.env.WABA_TOOLKIT_PHONE_NUMBER_ID || fileConfig.defaultPhoneNumberId,
    apiVersion: process.env.WABA_TOOLKIT_API_VERSION || fileConfig.apiVersion || 'v22.0',
    wabaId: process.env.WABA_TOOLKIT_WABA_ID || fileConfig.wabaId,
    businessId: process.env.WABA_TOOLKIT_BUSINESS_ID || fileConfig.businessId,
  };
}

/**
 * Resolve phone number ID from flag, env var, or config file.
 * @throws {WABAConfigError} If phone number ID not found
 */
export function resolvePhoneNumberId(flagValue?: string): string {
  const phoneNumberId =
    flagValue ||
    process.env.WABA_TOOLKIT_PHONE_NUMBER_ID ||
    loadConfig()?.defaultPhoneNumberId;

  if (!phoneNumberId) {
    throw new WABAConfigError(
      'No phone number ID specified\n\n' +
      'You must either:\n' +
      '  1. Set a default: waba-toolkit config set-default-phone <phone-number-id>\n' +
      '  2. Use environment variable: WABA_TOOLKIT_PHONE_NUMBER_ID=<id>\n' +
      '  3. Specify with flag: --bpid <phone-number-id>',
      'phoneNumberId'
    );
  }

  return phoneNumberId;
}

/**
 * Resolve WABA ID from flag, env var, or config file.
 * @throws {WABAConfigError} If WABA ID not found
 */
export function resolveWabaId(flagValue?: string): string {
  const wabaId =
    flagValue ||
    process.env.WABA_TOOLKIT_WABA_ID ||
    loadConfig()?.wabaId;

  if (!wabaId) {
    throw new WABAConfigError(
      'No WABA ID specified\n\n' +
      'You must either:\n' +
      '  1. Set in config: waba-toolkit config set waba-id <id>\n' +
      '  2. Use environment variable: WABA_TOOLKIT_WABA_ID=<id>\n' +
      '  3. Specify with flag: --waba-id <id>',
      'wabaId'
    );
  }

  return wabaId;
}

/**
 * Resolve access token from env var or config file.
 * @throws {WABAConfigError} If access token not found
 */
export function resolveAccessToken(): string {
  const accessToken =
    process.env.WABA_TOOLKIT_ACCESS_TOKEN ||
    loadConfig()?.accessToken;

  if (!accessToken) {
    throw new WABAConfigError(
      'Access token not found\n\n' +
      'You must either:\n' +
      '  1. Run: waba-toolkit configure\n' +
      '  2. Use environment variable: WABA_TOOLKIT_ACCESS_TOKEN=<token>\n' +
      '  3. Update config: waba-toolkit config set access-token <token>',
      'accessToken'
    );
  }

  return accessToken;
}
