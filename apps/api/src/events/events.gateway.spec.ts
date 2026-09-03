import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
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

  describe('handleConnection', () => {
    it('should log connection', () => {
      const mockClient = { id: 'client-123' };
      const loggerSpy = vi.spyOn(gateway['logger'], 'debug');

      gateway.handleConnection(mockClient);

      expect(loggerSpy).toHaveBeenCalledWith(
        'WebSocket client connected: client-123',
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection', () => {
      const mockClient = { id: 'client-123' };
      const loggerSpy = vi.spyOn(gateway['logger'], 'debug');

      gateway.handleDisconnect(mockClient);

      expect(loggerSpy).toHaveBeenCalledWith(
        'WebSocket client disconnected: client-123',
      );
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

      expect(gateway.server.emit).toHaveBeenCalledWith(
        'match.updated',
        payload,
      );
    });
  });
});
