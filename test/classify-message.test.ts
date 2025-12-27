import { describe, it, expect } from 'vitest';
import { classifyMessage } from '../src/webhooks/messages.js';
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

describe('classifyMessage', () => {
  it('classifies text message', () => {
    const message = getMessage('text-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('text');
    if (result.type === 'text') {
      expect(result.message.text.body).toBe('123');
    }
  });

  it('classifies image message', () => {
    const message = getMessage('image-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('image');
    if (result.type === 'image') {
      expect(result.message.image.mime_type).toBe('image/jpeg');
      expect(result.message.image.id).toBeDefined();
    }
  });

  it('classifies voice note as audio', () => {
    const message = getMessage('voice-note-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('audio');
    if (result.type === 'audio') {
      expect(result.message.audio.voice).toBe(true);
      expect(result.message.audio.mime_type).toContain('audio/ogg');
    }
  });

  it('classifies audio message (non-voice)', () => {
    const message = getMessage('audio-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('audio');
    if (result.type === 'audio') {
      expect(result.message.audio.voice).toBe(false);
    }
  });

  it('classifies document message', () => {
    const message = getMessage('document-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('document');
    if (result.type === 'document') {
      expect(result.message.document.filename).toBe('sample-document.pdf');
      expect(result.message.document.mime_type).toBe('application/pdf');
    }
  });

  it('classifies sticker message', () => {
    const message = getMessage('sticker-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('sticker');
    if (result.type === 'sticker') {
      expect(result.message.sticker.mime_type).toBe('image/webp');
      expect(result.message.sticker.animated).toBe(false);
    }
  });

  it('classifies contacts message', () => {
    const message = getMessage('contact-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('contacts');
    if (result.type === 'contacts') {
      expect(result.message.contacts).toHaveLength(1);
      expect(result.message.contacts[0].name.formatted_name).toBe('John Smith');
    }
  });

  it('classifies reaction message', () => {
    const message = getMessage('reaction-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('reaction');
    if (result.type === 'reaction') {
      expect(result.message.reaction.emoji).toBeDefined();
      expect(result.message.reaction.message_id).toBeDefined();
    }
  });

  it('classifies button reply as interactive', () => {
    const message = getMessage('button-reply-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('interactive');
    if (result.type === 'interactive') {
      expect(result.message.interactive.type).toBe('button_reply');
    }
  });

  it('classifies flow submission as interactive', () => {
    const message = getMessage('flow-submission-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('interactive');
    if (result.type === 'interactive') {
      expect(result.message.interactive.type).toBe('nfm_reply');
    }
  });

  it('classifies call permission reply as interactive', () => {
    const message = getMessage('call-permission-message');
    const result = classifyMessage(message);

    expect(result.type).toBe('interactive');
    if (result.type === 'interactive') {
      expect(result.message.interactive.type).toBe('call_permission_reply');
    }
  });

  it('classifies unknown type as unsupported', () => {
    const message = {
      from: '15559876543',
      id: 'wamid.test',
      timestamp: '1234567890',
      type: 'unknown_new_type',
    };
    const result = classifyMessage(message as any);

    expect(result.type).toBe('unsupported');
  });
});
