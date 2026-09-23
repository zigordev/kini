import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Socket } from 'socket.io';
import type { FutPoolMatchResponseDto } from '../fut-pool-match/dto/fut-pool-match-response.dto';
import type { FutPoolResponseDto } from '../fut-pool/dto/fut-pool-response.dto';
import { registry } from '../observability';
import { TeamMembership } from '../teams/entities/team-membership.entity';
import { EventsGateway, teamRoom, userRoom } from './events.gateway';

const pool = (teamId: string | null): FutPoolResponseDto =>
  ({
    id: 'pool-123',
    teamId,
    doubles: 2,
    triples: 1,
    matches: [
      {
        id: 'match-456',
        user: { id: 'user-1', name: 'Ana', textColor: '#fff', backgroundColor: '#000' },
      },
    ],
  }) as unknown as FutPoolResponseDto;

const match = {
  id: 'match-456',
  futPoolId: 'pool-123',
  results: ['1', 'X'],
  user: { id: 'user-1', name: 'Ana', textColor: '#fff', backgroundColor: '#000' },
} as unknown as FutPoolMatchResponseDto;

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let memberships: { find: ReturnType<typeof vi.fn> };
  let roomEmit: ReturnType<typeof vi.fn>;
  let to: ReturnType<typeof vi.fn>;
  let broadcast: ReturnType<typeof vi.fn>;

  const client = (userId?: unknown) =>
    ({
      data: userId === undefined ? {} : { userId },
      join: vi.fn(),
      disconnect: vi.fn(),
    }) as unknown as Socket & {
      join: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
    };

  beforeEach(async () => {
    memberships = {
      find: vi.fn().mockResolvedValue([{ teamId: 'team-a' }, { teamId: 'team-b' }]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: getRepositoryToken(TeamMembership), useValue: memberships },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    roomEmit = vi.fn();
    to = vi.fn().mockReturnValue({ emit: roomEmit });
    broadcast = vi.fn();
    gateway.server = { to, emit: broadcast } as any;
  });

  describe('connections', () => {
    const connected = async () =>
      (await registry.getSingleMetric('kini_websocket_clients')?.get())?.values[0]?.value;

    it("joins the user's own room and a room for each active team", async () => {
      const socket = client('user-1');

      await gateway.handleConnection(socket);

      expect(memberships.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'active' },
        select: { teamId: true },
        loadEagerRelations: false,
      });
      expect(socket.join).toHaveBeenCalledWith([
        userRoom('user-1'),
        teamRoom('team-a'),
        teamRoom('team-b'),
      ]);
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('drops a socket that reached the gateway without a user', async () => {
      const socket = client();

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalledWith(true);
      expect(socket.join).not.toHaveBeenCalled();
      expect(memberships.find).not.toHaveBeenCalled();
    });

    it('counts a client up on connection and down on disconnection', async () => {
      const before = (await connected()) ?? 0;

      await gateway.handleConnection(client('user-1'));
      await gateway.handleConnection(client('user-2'));
      expect(await connected()).toBe(before + 2);

      gateway.handleDisconnect();
      expect(await connected()).toBe(before + 1);
    });
  });

  describe('emitPoolUpdated', () => {
    it("sends the pool to its team's room only", () => {
      gateway.emitPoolUpdated(pool('team-a'));

      expect(to).toHaveBeenCalledWith(teamRoom('team-a'));
      expect(roomEmit).toHaveBeenCalledWith('pool.updated', {
        poolId: 'pool-123',
        pool: pool('team-a'),
      });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('sends nothing for a pool that belongs to no team', () => {
      gateway.emitPoolUpdated(pool(null));

      expect(to).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });
  });

  describe('emitMatchUpdated', () => {
    it("sends the match to its pool's team room only", () => {
      gateway.emitMatchUpdated('team-a', match);

      expect(to).toHaveBeenCalledWith(teamRoom('team-a'));
      expect(roomEmit).toHaveBeenCalledWith('match.updated', {
        poolId: 'pool-123',
        matchId: 'match-456',
        match,
      });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('sends nothing when the pool has no team', () => {
      gateway.emitMatchUpdated(undefined, match);

      expect(to).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });
  });
});
