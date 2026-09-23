import { vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationPublisher } from './email-notification.publisher';
import { registry } from '../observability';

describe('EmailNotificationPublisher', () => {
  let publisher: EmailNotificationPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotificationPublisher,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string, fallback?: string) => {
              const values: Record<string, string> = {
                FRONTEND_URL: 'http://localhost:3013',
                NOTIFICATIONS_EMAIL_TOPIC: 'notification.email.requested.v1',
                NOTIFICATIONS_KAFKA_BROKERS: 'platform-redpanda:9092',
              };
              return values[key] ?? fallback;
            }),
          },
        },
      ],
    }).compile();

    publisher = module.get(EmailNotificationPublisher);
  });

  it('should build a Kini team invitation email event', () => {
    const event = publisher.buildTeamInvitationEvent({
      to: 'Invitee@Example.Com',
      teamId: 'team-123',
      teamName: 'My Team',
      inviterEmail: 'owner@example.com',
      inviterName: 'Owner',
      acceptUrl: 'http://localhost:3013/teams/team-123/accept',
      locale: 'en',
    });

    expect(event).toEqual(
      expect.objectContaining({
        idempotencyKey: 'kini:team:team-123:invite:invitee@example.com',
        sourceApp: 'kini',
        channel: 'email',
        templateId: 'kini.team-invitation',
        replyTo: 'owner@example.com',
        recipient: { email: 'invitee@example.com' },
        data: expect.objectContaining({
          teamId: 'team-123',
          teamName: 'My Team',
          inviterEmail: 'owner@example.com',
          inviterName: 'Owner',
          acceptUrl: 'http://localhost:3013/teams/team-123/accept',
          frontendUrl: 'http://localhost:3013',
          locale: 'en',
        }),
        metadata: expect.objectContaining({
          eventType: 'user_invited_to_team',
          teamId: 'team-123',
          locale: 'en',
        }),
      })
    );
    expect(event.messageId).toEqual(expect.any(String));
    expect(event.requestedAt).toEqual(expect.any(String));
  });

  const failed = async (template: string) => {
    const metric = await registry.getSingleMetric('kini_notifications_total')?.get();
    return (
      metric?.values.find(
        (value) => value.labels.template === template && value.labels.outcome === 'failed'
      )?.value ?? 0
    );
  };

  const invitation = () =>
    publisher.buildTeamInvitationEvent({
      to: 'invitee@example.com',
      teamId: 'team-123',
      teamName: 'My Team',
      inviterEmail: 'owner@example.com',
      inviterName: 'Owner',
      acceptUrl: 'http://localhost:3013/teams/team-123/accept',
      locale: 'en',
    });

  it('counts a publish that cannot reach the broker as failed', async () => {
    const before = await failed('kini.team-invitation');
    vi.spyOn(
      publisher as unknown as { getProducer: () => Promise<unknown> },
      'getProducer'
    ).mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(publisher.publishEmail(invitation())).rejects.toThrow('connect ECONNREFUSED');

    expect(await failed('kini.team-invitation')).toBe(before + 1);
  });

  it('counts a publish with no broker configured as failed', async () => {
    const before = await failed('kini.team-invitation');
    (publisher as unknown as { brokers: string[] }).brokers = [];

    await expect(publisher.publishEmail(invitation())).rejects.toThrow(
      'NOTIFICATIONS_KAFKA_BROKERS is required'
    );

    expect(await failed('kini.team-invitation')).toBe(before + 1);
  });
});
