import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsGateway } from '../events/events.gateway';
import { NotificationToken } from './notification-token.entity';

export interface NotificationPayload {
  type: 'pool' | 'match' | 'team';
  title: string;
  body: string;
  teamId?: string;
  poolId?: string;
  matchId?: string;
  recipientUserIds: string[];
  actorId?: string;
  actorName?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class NotificationProducer {
  constructor(
    private readonly events: EventsGateway,
    @InjectRepository(NotificationToken)
    private readonly tokens: Repository<NotificationToken>,
  ) {}

  async emit(payload: NotificationPayload): Promise<void> {
    // For web clients: broadcast via WebSocket
    this.events.server.emit('notification', payload);

    // For mobile clients: send native push notifications to active tokens.
    const activeTokens = await this.tokens.find({
      where: { active: true },
      relations: ['user'],
    });
    const recipientIds = new Set(payload.recipientUserIds ?? []);
    const filteredTokens =
      recipientIds.size > 0
        ? activeTokens.filter((token) => recipientIds.has(token.userId))
        : activeTokens;

    if (!filteredTokens.length) {
      return;
    }

    const messages = filteredTokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: {
        type: payload.type,
        teamId: payload.teamId,
        poolId: payload.poolId,
        matchId: payload.matchId,
        actorId: payload.actorId,
        actorName: payload.actorName,
        details: payload.details ?? {},
      },
    }));

    // Expo API allows up to 100 messages per request
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(chunk),
        });
      } catch {
        // Silently continue if push notification fails
      }
    }
  }
}
