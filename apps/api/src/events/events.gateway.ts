import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

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
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: any) {
    this.logger.debug(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.debug(`WebSocket client disconnected: ${client.id}`);
  }

  emitPoolUpdated(payload: { poolId: string; pool: any }) {
    this.server.emit('pool.updated', payload);
  }

  emitMatchUpdated(payload: { poolId: string; matchId: string; match: any }) {
    this.server.emit('match.updated', payload);
  }
}
