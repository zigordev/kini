import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';

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
    this.events.server.emit('notification', payload);
  }
}
