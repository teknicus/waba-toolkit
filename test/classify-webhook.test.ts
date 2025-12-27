import { describe, it, expect } from 'vitest';
import { classifyWebhook } from '../src/webhooks/classify.js';
import type { WebhookPayload } from '../src/types/webhooks.js';
import { loadFixture } from './fixtures.js';

describe('classifyWebhook', () => {
  describe('message webhooks', () => {
    it('classifies text message as message type', () => {
      const fixture = loadFixture('text-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
      expect(result.payload).toHaveProperty('messages');
    });

    it('classifies image message as message type', () => {
      const fixture = loadFixture('image-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies audio message as message type', () => {
      const fixture = loadFixture('audio-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies document message as message type', () => {
      const fixture = loadFixture('document-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies sticker message as message type', () => {
      const fixture = loadFixture('sticker-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies contact message as message type', () => {
      const fixture = loadFixture('contact-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies reaction message as message type', () => {
      const fixture = loadFixture('reaction-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies button reply as message type', () => {
      const fixture = loadFixture('button-reply-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies flow submission as message type', () => {
      const fixture = loadFixture('flow-submission-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });

    it('classifies call permission reply as message type', () => {
      const fixture = loadFixture('call-permission-message');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('message');
    });
  });

  describe('status webhooks', () => {
    it('classifies sent status as status type', () => {
      const fixture = loadFixture('sent-status');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('status');
      expect(result.payload).toHaveProperty('statuses');
    });

    it('classifies delivered status as status type', () => {
      const fixture = loadFixture('delivered-status');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('status');
    });

    it('classifies read status as status type', () => {
      const fixture = loadFixture('read-status');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('status');
    });
  });

  describe('call webhooks', () => {
    it('classifies incoming call as call type', () => {
      const fixture = loadFixture('incoming-call');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('call');
      expect(result.payload).toHaveProperty('calls');
    });

    it('classifies completed call as call type', () => {
      const fixture = loadFixture('completed-call');
      const result = classifyWebhook(fixture.body as WebhookPayload);

      expect(result.type).toBe('call');
    });
  });

  describe('edge cases', () => {
    it('returns unknown for empty payload', () => {
      const result = classifyWebhook({} as WebhookPayload);

      expect(result.type).toBe('unknown');
    });

    it('returns unknown for payload without changes', () => {
      const result = classifyWebhook({
        object: 'whatsapp_business_account',
        entry: [],
      } as WebhookPayload);

      expect(result.type).toBe('unknown');
    });
  });
});
