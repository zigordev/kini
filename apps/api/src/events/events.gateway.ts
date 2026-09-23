import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { websocketConnected, websocketDisconnected } from '../metrics/domain-metrics';

const corsOrigins = (process.env.AUTH_CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection() {
    websocketConnected();
  }

  handleDisconnect() {
    websocketDisconnected();
  }

  emitPoolUpdated(payload: { poolId: string; pool: any }) {
    this.server.emit('pool.updated', payload);
  }

  emitMatchUpdated(payload: { poolId: string; matchId: string; match: any }) {
    this.server.emit('match.updated', payload);
  }
}
