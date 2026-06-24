import { Test, TestingModule } from '@nestjs/testing';
import {
  FutPoolMatch,
  Result,
} from '../fut-pool-match/entities/fut-pool-match.entity';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { NotificationProducer } from './notification.producer';
import { NotifierService } from './notifier.service';

describe('NotifierService', () => {
  let service: NotifierService;
  let producer: jest.Mocked<NotificationProducer>;

  const mockPool: FutPool = {
    id: 'pool-123',
    doubles: 2,
    triples: 1,
    elige8: false,
  } as FutPool;

  const mockMatch: FutPoolMatch = {
    id: 'match-123',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    futPool: { id: 'pool-123' } as FutPool,
  } as FutPoolMatch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifierService,
        {
          provide: NotificationProducer,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotifierService>(NotifierService);
    producer = module.get(
      NotificationProducer,
    ) as jest.Mocked<NotificationProducer>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyPoolCreated', () => {
    it('should emit pool creation notification', async () => {
      const payload = {
        doubles: 2,
        triples: 1,
        date: '2024-01-15',
        matches: [],
      };

      await service.notifyPoolCreated(mockPool, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pool',
          title: 'Nueva quiniela disponible',
          body: 'Se ha creado una nueva quiniela',
          poolId: 'pool-123',
          recipientUserIds: [],
        }),
      );
    });

    it('should include actor name', async () => {
      const payload = { doubles: 2, date: '2024-01-15', matches: [] };
      const actor = { id: 'user-123', name: 'Test User' };

      await service.notifyPoolCreated(mockPool, payload, actor);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Test User ha creado una nueva quiniela',
          actorId: 'user-123',
          actorName: 'Test User',
        }),
      );
    });
  });

  describe('notifyPoolUpdated', () => {
    it('should emit pool update notification', async () => {
      const oldPool = { ...mockPool };
      const payload = { doubles: 3 };

      await service.notifyPoolUpdated(mockPool, oldPool, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pool',
          title: 'Quiniela actualizada',
          poolId: 'pool-123',
        }),
      );
    });

    it('should describe doubles changes', async () => {
      const oldPool = { ...mockPool, doubles: 2 };
      const payload = { doubles: 3 };
      const updatedPool = { ...mockPool, doubles: 3 };

      await service.notifyPoolUpdated(updatedPool, oldPool, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('dobles a 3'),
        }),
      );
    });

    it('should describe elige8 changes', async () => {
      const oldPool = { ...mockPool, elige8: false };
      const payload = { elige8: true };
      const updatedPool = { ...mockPool, elige8: true };

      await service.notifyPoolUpdated(updatedPool, oldPool, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('elige8 a activado'),
        }),
      );
    });
  });

  describe('notifyMatchUpdated', () => {
    it('should emit match update notification', async () => {
      const oldMatch = { ...mockMatch };
      const payload = { success: true };

      await service.notifyMatchUpdated(mockMatch, oldMatch, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'match',
          title: 'Partido actualizado',
          poolId: 'pool-123',
          matchId: 'match-123',
        }),
      );
    });

    it('should describe results changes', async () => {
      const oldMatch = { ...mockMatch, results: [Result.HOME] };
      const payload = { results: [Result.HOME, Result.DRAW] };
      const updatedMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW],
      };

      await service.notifyMatchUpdated(updatedMatch, oldMatch, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('resultados a [1, X]'),
        }),
      );
    });

    it('should describe success changes', async () => {
      const oldMatch = { ...mockMatch, success: false };
      const payload = { success: true };
      const updatedMatch = { ...mockMatch, success: true };

      await service.notifyMatchUpdated(updatedMatch, oldMatch, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('éxito a sí'),
        }),
      );
    });

    it('should describe elige8 changes', async () => {
      const oldMatch = { ...mockMatch, elige8: false };
      const payload = { elige8: true };
      const updatedMatch = { ...mockMatch, elige8: true };

      await service.notifyMatchUpdated(updatedMatch, oldMatch, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('elige8 a activado'),
        }),
      );
    });

    it('should describe user assignment changes', async () => {
      const oldMatch = {
        ...mockMatch,
        user: { id: 'user-1', name: 'Old User' } as any,
      };
      const payload = { userId: 'user-2' };
      const updatedMatch = {
        ...mockMatch,
        user: { id: 'user-2', name: 'New User' } as any,
      };

      await service.notifyMatchUpdated(updatedMatch, oldMatch, payload);

      expect(producer.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('usuario de Old User a New User'),
        }),
      );
    });
  });
});
