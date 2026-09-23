import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import type { FutPoolMatchResponseDto } from '../fut-pool-match/dto/fut-pool-match-response.dto';
import type { FutPoolResponseDto } from '../fut-pool/dto/fut-pool-response.dto';
import { websocketConnected, websocketDisconnected } from '../metrics/domain-metrics';
import { TeamMembership } from '../teams/entities/team-membership.entity';

export const teamRoom = (teamId: string): string => `team:${teamId}`;
export const userRoom = (userId: string): string => `user:${userId}`;

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectRepository(TeamMembership)
    private readonly memberships: Repository<TeamMembership>
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    websocketConnected();
    const userId: unknown = client.data?.userId;
    if (typeof userId !== 'string') {
      client.disconnect(true);
      return;
    }
    const memberships = await this.memberships.find({
      where: { userId, status: 'active' },
      select: { teamId: true },
      loadEagerRelations: false,
    });
    await client.join([
      userRoom(userId),
      ...memberships.map((membership) => teamRoom(membership.teamId)),
    ]);
  }

  handleDisconnect(): void {
    websocketDisconnected();
  }

  emitPoolUpdated(pool: FutPoolResponseDto): void {
    if (!pool.teamId) {
      return;
    }
    this.server.to(teamRoom(pool.teamId)).emit('pool.updated', { poolId: pool.id, pool });
  }

  emitMatchUpdated(teamId: string | null | undefined, match: FutPoolMatchResponseDto): void {
    if (!teamId) {
      return;
    }
    this.server
      .to(teamRoom(teamId))
      .emit('match.updated', { poolId: match.futPoolId, matchId: match.id, match });
  }
}
