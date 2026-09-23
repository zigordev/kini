import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { registry } from '../observability';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeAll(() => {
    process.env.AUTH_CORS_ORIGINS = 'http://localhost:3012,https://example.com';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    gateway.server = {
      emit: vi.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('connected clients', () => {
    const connected = async () =>
      (await registry.getSingleMetric('kini_websocket_clients')?.get())?.values[0]?.value;

    it('counts a client up on connection and down on disconnection', async () => {
      const before = (await connected()) ?? 0;

      gateway.handleConnection();
      gateway.handleConnection();
      expect(await connected()).toBe(before + 2);

      gateway.handleDisconnect();
      expect(await connected()).toBe(before + 1);
    });
  });

  describe('emitPoolUpdated', () => {
    it('should emit pool.updated event', () => {
      const payload = {
        poolId: 'pool-123',
        pool: { id: 'pool-123', doubles: 2, triples: 1 },
      };

      gateway.emitPoolUpdated(payload);

      expect(gateway.server.emit).toHaveBeenCalledWith('pool.updated', payload);
    });
  });

  describe('emitMatchUpdated', () => {
    it('should emit match.updated event', () => {
      const payload = {
        poolId: 'pool-123',
        matchId: 'match-456',
        match: { id: 'match-456', results: ['1', 'X'] },
      };

      gateway.emitMatchUpdated(payload);

      expect(gateway.server.emit).toHaveBeenCalledWith('match.updated', payload);
    });
  });
});
