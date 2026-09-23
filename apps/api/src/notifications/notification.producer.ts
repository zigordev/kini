import { Injectable } from '@nestjs/common';
import { EventsGateway, userRoom } from '../events/events.gateway';

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
  constructor(private readonly events: EventsGateway) {}

  async emit(payload: NotificationPayload): Promise<void> {
    for (const userId of new Set(payload.recipientUserIds)) {
      this.events.server.to(userRoom(userId)).emit('notification', payload);
    }
  }
}
