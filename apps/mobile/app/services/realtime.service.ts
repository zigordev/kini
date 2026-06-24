import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

type MatchUpdatedPayload = {
  poolId: string;
  matchId: string;
  match: any;
};

type PoolUpdatedPayload = {
  poolId: string;
  pool: any;
};

type NotificationPayload = {
  type: 'pool' | 'match';
  title: string;
  body: string;
  poolId?: string;
  matchId?: string;
  recipientUserIds: string[];
  actorId?: string;
  actorName?: string;
  details?: Record<string, unknown>;
};

class RealtimeClient {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return this.socket;
    this.socket = io(API_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });
    return this.socket;
  }

  onPoolUpdated(handler: (payload: PoolUpdatedPayload) => void) {
    this.connect().on('pool.updated', handler);
  }

  offPoolUpdated(handler: (payload: PoolUpdatedPayload) => void) {
    this.socket?.off('pool.updated', handler);
  }

  onMatchUpdated(handler: (payload: MatchUpdatedPayload) => void) {
    this.connect().on('match.updated', handler);
  }

  offMatchUpdated(handler: (payload: MatchUpdatedPayload) => void) {
    this.socket?.off('match.updated', handler);
  }

  onNotification(handler: (payload: NotificationPayload) => void) {
    this.connect().on('notification', handler);
  }

  offNotification(handler: (payload: NotificationPayload) => void) {
    this.socket?.off('notification', handler);
  }
}

const realtime = new RealtimeClient();
export default realtime;
