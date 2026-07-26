import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

export interface EmailNotificationEvent {
  messageId: string;
  idempotencyKey: string;
  sourceApp: string;
  channel: 'email';
  templateId: string;
  replyTo?: string;
  recipient: {
    email: string;
  };
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  requestedAt: string;
}

@Injectable()
export class EmailNotificationPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(EmailNotificationPublisher.name);
  private readonly topic: string;
  private readonly brokers: string[];
  private producer: Producer | null = null;
  private connectPromise: Promise<Producer> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.topic = this.configService.get<string>(
      'NOTIFICATIONS_EMAIL_TOPIC',
      'notification.email.requested.v1',
    );
    this.brokers = (
      this.configService.get<string>('NOTIFICATIONS_KAFKA_BROKERS', '') || ''
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  buildTeamInvitationEvent(data: {
    to: string;
    teamId: string;
    teamName: string;
    inviterEmail: string;
    inviterName?: string;
    acceptUrl: string;
    locale?: string;
  }): EmailNotificationEvent {
    const normalizedEmail = data.to.trim().toLowerCase();
    const messageId = randomUUID();

    return {
      messageId,
      idempotencyKey: `kini:team:${data.teamId}:invite:${normalizedEmail}`,
      sourceApp: 'kini',
      channel: 'email',
      templateId: 'kini.team-invitation',
      replyTo: data.inviterEmail,
      recipient: {
        email: normalizedEmail,
      },
      data: {
        teamId: data.teamId,
        teamName: data.teamName,
        inviterEmail: data.inviterEmail,
        inviterName: data.inviterName,
        acceptUrl: data.acceptUrl,
        frontendUrl: this.frontendUrl(),
        locale: data.locale,
      },
      metadata: {
        eventType: 'user_invited_to_team',
        teamId: data.teamId,
        locale: data.locale,
      },
      requestedAt: new Date().toISOString(),
    };
  }

  async publishEmail(event: EmailNotificationEvent): Promise<void> {
    if (this.brokers.length === 0) {
      throw new Error('NOTIFICATIONS_KAFKA_BROKERS is required');
    }

    const producer = await this.getProducer();
    try {
      await producer.send({
        topic: this.topic,
        messages: [
          {
            key: event.idempotencyKey,
            value: JSON.stringify(event),
            headers: {
              sourceApp: event.sourceApp,
              templateId: event.templateId,
              channel: event.channel,
            },
          },
        ],
      });
      this.logger.log(
        `Queued email notification ${event.templateId} for ${event.recipient.email}`,
      );
    } catch (error) {
      this.resetProducerState(producer);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.producer) {
      return;
    }

    await this.producer.disconnect().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to disconnect Kafka producer: ${message}`);
    });
  }

  private frontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3013'
    ).replace(/\/$/, '');
  }

  private async getProducer(): Promise<Producer> {
    if (this.producer) {
      return this.producer;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const kafka = new Kafka({
      clientId: this.configService.get<string>('OTEL_SERVICE_NAME', 'kini-api'),
      brokers: this.brokers,
    });

    const producer = kafka.producer({
      idempotent: true,
      allowAutoTopicCreation: true,
    });

    this.connectPromise = producer
      .connect()
      .then(() => {
        this.producer = producer;
        this.logger.log(
          `Kafka producer connected to ${this.brokers.join(', ')}`,
        );
        return producer;
      })
      .catch((error) => {
        this.resetProducerState(producer);
        throw error;
      });

    return this.connectPromise;
  }

  private resetProducerState(producer: Producer): void {
    if (this.producer === producer) {
      this.producer = null;
    }
    this.connectPromise = null;
    void producer.disconnect().catch(() => undefined);
  }
}
