import { vi, type Mocked } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../events/events.gateway';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { NotifierService } from '../notifications/notifier.service';
import { TeamsService } from '../teams/teams.service';
import { FutPoolMatch, Result } from './entities/fut-pool-match.entity';
import { FutPoolMatchRepository } from './fut-pool-match.repository';
import { FutPoolMatchService } from './fut-pool-match.service';

describe('FutPoolMatchService', () => {
  let service: FutPoolMatchService;
  let repository: Mocked<FutPoolMatchRepository>;
  let events: Mocked<EventsGateway>;
  let notifier: Mocked<NotifierService>;
  let teams: Mocked<TeamsService>;

  const mockPool: FutPool = {
    id: 'pool-123',
    doubles: 2,
    triples: 1,
  } as FutPool;

  const mockMatch: FutPoolMatch = {
    id: 'match-123',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    poolOrder: 1,
    results: [Result.HOME],
    success: true,
    elige8: false,
    full15: false,
    userId: 'user-123',
    user: { id: 'user-123', name: 'Test User' } as any,
    futPoolId: 'pool-123',
    futPool: mockPool,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FutPoolMatch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FutPoolMatchService,
        {
          provide: FutPoolMatchRepository,
          useValue: {
            findById: vi.fn(),
            isPoolPredictionsComplete: vi.fn(),
            update: vi.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            emitMatchUpdated: vi.fn(),
          },
        },
        {
          provide: NotifierService,
          useValue: {
            notifyMatchUpdated: vi.fn(),
            notifyPoolPredictionsCompleted: vi.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: {
            listActiveMemberUsers: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FutPoolMatchService>(FutPoolMatchService);
    repository = module.get(
      FutPoolMatchRepository,
    ) as Mocked<FutPoolMatchRepository>;
    events = module.get(EventsGateway) as Mocked<EventsGateway>;
    notifier = module.get(NotifierService) as Mocked<NotifierService>;
    teams = module.get(TeamsService) as Mocked<TeamsService>;

    repository.isPoolPredictionsComplete.mockResolvedValue(false);
    teams.listActiveMemberUsers.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should update match and emit event', async () => {
      const updateDto = { success: false };
      const updatedMatch = { ...mockMatch, success: false };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      const result = await service.update('match-123', updateDto);

      expect(result.success).toBe(false);
      expect(repository.update).toHaveBeenCalledWith('match-123', updateDto);
      expect(events.emitMatchUpdated).toHaveBeenCalledWith({
        poolId: 'pool-123',
        matchId: 'match-123',
        match: updatedMatch,
      });
    });

    it('should trigger notification', async () => {
      const updateDto = { success: false };
      const updatedMatch = { ...mockMatch, success: false };
      const actor = { id: 'user-123', name: 'Test User' };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      await service.update('match-123', updateDto, actor);

      expect(notifier.notifyMatchUpdated).toHaveBeenCalledWith(
        updatedMatch,
        mockMatch,
        updateDto,
        actor,
      );
    });

    it('should enforce permission for results change', async () => {
      const updateDto = { results: [Result.DRAW] };
      const actor = { id: 'user-456', name: 'Other User' };

      repository.findById.mockResolvedValue(mockMatch);

      await expect(
        service.update('match-123', updateDto, actor),
      ).rejects.toThrow(
        'No tienes permisos para cambiar los resultados de este partido',
      );
    });

    it('should allow results change for own match', async () => {
      const updateDto = { results: [Result.DRAW] };
      const actor = { id: 'user-123', name: 'Test User' };
      const updatedMatch = { ...mockMatch, results: [Result.DRAW] };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      const result = await service.update('match-123', updateDto, actor);

      expect(result.results).toEqual([Result.DRAW]);
    });

    it('should allow results change when no actor', async () => {
      const updateDto = { results: [Result.DRAW] };
      const updatedMatch = { ...mockMatch, results: [Result.DRAW] };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      const result = await service.update('match-123', updateDto);

      expect(result.results).toEqual([Result.DRAW]);
    });

    it('should detect result changes in notification', async () => {
      const updateDto = { results: [Result.HOME, Result.DRAW] };
      const updatedMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW],
      };
      const actor = { id: 'user-123', name: 'Test User' };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      await service.update('match-123', updateDto, actor);

      expect(notifier.notifyMatchUpdated).toHaveBeenCalled();
    });

    it('should detect success changes in notification', async () => {
      const updateDto = { success: false };
      const updatedMatch = { ...mockMatch, success: false };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      await service.update('match-123', updateDto);

      expect(notifier.notifyMatchUpdated).toHaveBeenCalled();
    });

    it('should detect elige8 changes', async () => {
      const updateDto = { elige8: true };
      const updatedMatch = { ...mockMatch, elige8: true };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      await service.update('match-123', updateDto);

      expect(notifier.notifyMatchUpdated).toHaveBeenCalled();
    });

    it('should detect user assignment changes', async () => {
      const updateDto = { userId: 'user-456' };
      const updatedMatch = {
        ...mockMatch,
        userId: 'user-456',
        user: { id: 'user-456', name: 'New User' } as any,
      };

      repository.findById.mockResolvedValue(mockMatch);
      repository.update.mockResolvedValue(updatedMatch);

      await service.update('match-123', updateDto);

      expect(notifier.notifyMatchUpdated).toHaveBeenCalled();
    });
  });
});
