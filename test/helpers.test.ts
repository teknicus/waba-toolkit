import { describe, it, expect } from 'vitest';
import {
  isMediaMessage,
  extractMediaId,
  getContactInfo,
  getMessageTimestamp,
} from '../src/helpers.js';
import { classifyWebhook } from '../src/webhooks/classify.js';
import type { WebhookPayload, MessageWebhookValue } from '../src/types/webhooks.js';
import { loadFixture } from './fixtures.js';

function getMessage(fixtureName: string) {
  const fixture = loadFixture(fixtureName);
  const webhook = classifyWebhook(fixture.body as WebhookPayload);
  if (webhook.type !== 'message') {
    throw new Error(`Expected message webhook, got ${webhook.type}`);
  }
  const messages = (webhook.payload as MessageWebhookValue).messages;
  if (!messages || messages.length === 0) {
    throw new Error('No messages in webhook');
  }
  return messages[0];
}

describe('isMediaMessage', () => {
  it('returns true for image message', () => {
    const message = getMessage('image-message');
    expect(isMediaMessage(message)).toBe(true);
  });

  it('returns true for audio message', () => {
    const message = getMessage('audio-message');
    expect(isMediaMessage(message)).toBe(true);
  });

  it('returns true for voice note message', () => {
    const message = getMessage('voice-note-message');
    expect(isMediaMessage(message)).toBe(true);
  });

  it('returns true for document message', () => {
    const message = getMessage('document-message');
    expect(isMediaMessage(message)).toBe(true);
  });

  it('returns true for sticker message', () => {
    const message = getMessage('sticker-message');
    expect(isMediaMessage(message)).toBe(true);
  });

  it('returns false for text message', () => {
    const message = getMessage('text-message');
    expect(isMediaMessage(message)).toBe(false);
  });

  it('returns false for contact message', () => {
    const message = getMessage('contact-message');
    expect(isMediaMessage(message)).toBe(false);
  });

  it('returns false for reaction message', () => {
    const message = getMessage('reaction-message');
    expect(isMediaMessage(message)).toBe(false);
  });

  it('returns false for interactive message', () => {
    const message = getMessage('button-reply-message');
    expect(isMediaMessage(message)).toBe(false);
  });
});

describe('extractMediaId', () => {
  it('extracts id from image message', () => {
    const message = getMessage('image-message');
    const mediaId = extractMediaId(message);

    expect(mediaId).toBeDefined();
    expect(typeof mediaId).toBe('string');
  });

  it('extracts id from audio message', () => {
    const message = getMessage('audio-message');
    const mediaId = extractMediaId(message);

    expect(mediaId).toBeDefined();
  });

  it('extracts id from document message', () => {
    const message = getMessage('document-message');
    const mediaId = extractMediaId(message);

    expect(mediaId).toBeDefined();
  });

  it('extracts id from sticker message', () => {
    const message = getMessage('sticker-message');
    const mediaId = extractMediaId(message);

    expect(mediaId).toBeDefined();
  });

  it('returns undefined for text message', () => {
    const message = getMessage('text-message');
    const mediaId = extractMediaId(message);

    expect(mediaId).toBeUndefined();
  });

  it('returns undefined for reaction message', () => {
    const message = getMessage('reaction-message');
    const mediaId = extractMediaId(message);

    expect(mediaId).toBeUndefined();
  });
});

describe('getContactInfo', () => {
  it('extracts contact info from message webhook', () => {
    const fixture = loadFixture('text-message');
    const contactInfo = getContactInfo(fixture.body as WebhookPayload);

    expect(contactInfo).toBeDefined();
    expect(contactInfo!.waId).toBe('15559876543');
    expect(contactInfo!.profileName).toBe('Test User');
    expect(contactInfo!.phoneNumberId).toBe('123456789012345');
  });

  it('extracts contact info from image message', () => {
    const fixture = loadFixture('image-message');
    const contactInfo = getContactInfo(fixture.body as WebhookPayload);

    expect(contactInfo).toBeDefined();
    expect(contactInfo!.waId).toBe('15559876543');
  });

  it('returns undefined for status webhook', () => {
    const fixture = loadFixture('sent-status');
    const contactInfo = getContactInfo(fixture.body as WebhookPayload);

    // Status webhooks don't have contacts array
    expect(contactInfo).toBeUndefined();
  });

  it('returns undefined for empty payload', () => {
    const contactInfo = getContactInfo({} as WebhookPayload);

    expect(contactInfo).toBeUndefined();
  });
});

describe('getMessageTimestamp', () => {
  it('parses timestamp from message', () => {
    const message = getMessage('text-message');
    const timestamp = getMessageTimestamp(message);

    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });

  it('returns correct Date for known timestamp', () => {
    const message = {
      from: '15559876543',
      id: 'wamid.test',
      timestamp: '1704067200', // 2024-01-01 00:00:00 UTC
      type: 'text',
      text: { body: 'test' },
    };

    const timestamp = getMessageTimestamp(message as any);

    expect(timestamp.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('handles different message types', () => {
    const imageMessage = getMessage('image-message');
    const documentMessage = getMessage('document-message');

    const imageTimestamp = getMessageTimestamp(imageMessage);
    const documentTimestamp = getMessageTimestamp(documentMessage);

    expect(imageTimestamp).toBeInstanceOf(Date);
    expect(documentTimestamp).toBeInstanceOf(Date);
  });
});
