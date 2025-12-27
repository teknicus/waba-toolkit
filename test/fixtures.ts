import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, 'fixtures');

export interface Fixture {
  headers: {
    'content-type': string;
    'x-hub-signature-256': string;
  };
  body: unknown;
}

export function loadFixture(name: string): Fixture {
  const path = join(FIXTURES_DIR, `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function loadAllFixtures(): Map<string, Fixture> {
  const fixtures = new Map<string, Fixture>();
  const names = [
    'text-message',
    'image-message',
    'voice-note-message',
    'audio-message',
    'document-message',
    'sticker-message',
    'contact-message',
    'reaction-message',
    'button-reply-message',
    'flow-submission-message',
    'call-permission-message',
    'incoming-call',
    'completed-call',
    'sent-status',
    'delivered-status',
    'read-status',
  ];

  for (const name of names) {
    fixtures.set(name, loadFixture(name));
  }

  return fixtures;
}

// Test app secret used to generate fixture signatures
export const TEST_APP_SECRET = 'test_app_secret_for_webhook_verification';
