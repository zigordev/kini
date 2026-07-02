import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../events/events.gateway';
import { NotifierService } from '../notifications/notifier.service';
import { TeamsService } from '../teams/teams.service';
import { FutPool } from './entities/fut-pool.entity';
import { FutPoolRepository } from './fut-pool.repository';
import { FutPoolService } from './fut-pool.service';

describe('FutPoolService', () => {
  let service: FutPoolService;
  let repository: jest.Mocked<FutPoolRepository>;
  let events: jest.Mocked<EventsGateway>;
  let notifier: jest.Mocked<NotifierService>;
  let teamsService: jest.Mocked<Pick<TeamsService, 'assertMember'>>;

  const mockPool: FutPool = {
    id: 'pool-123',
    doubles: 2,
    triples: 1,
    elige8: false,
    date: new Date('2024-01-15'),
    active: true,
    cost: 12,
    earning: 50,
    matches: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FutPool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FutPoolService,
        {
          provide: FutPoolRepository,
          useValue: {
            findAll: jest.fn(),
            getStats: jest.fn(),
            createPool: jest.fn(),
            updatePool: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            emitPoolUpdated: jest.fn(),
          },
        },
        {
          provide: NotifierService,
          useValue: {
            notifyPoolCreated: jest.fn(),
            notifyPoolUpdated: jest.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: {
            assertMember: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FutPoolService>(FutPoolService);
    repository = module.get(
      FutPoolRepository,
    ) as jest.Mocked<FutPoolRepository>;
    events = module.get(EventsGateway) as jest.Mocked<EventsGateway>;
    notifier = module.get(NotifierService) as jest.Mocked<NotifierService>;
    teamsService = module.get(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated pools', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc' as const,
      };
      const expected = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          sortBy: 'date',
          sortOrder: 'desc' as const,
        },
      };

      repository.findAll.mockResolvedValue(expected);

      const result = await service.findAll(query);

      expect(result).toEqual(expected);
      expect(repository.findAll).toHaveBeenCalledWith(query);
    });

    it('should assert team membership when scoped by team', async () => {
      const query = {
        teamId: 'team-123',
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc' as const,
      };
      const actor = { id: 'user-123' };
      const expected = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          sortBy: 'date',
          sortOrder: 'desc' as const,
        },
      };

      repository.findAll.mockResolvedValue(expected);

      const result = await service.findAll(query, actor);

      expect(result).toEqual(expected);
      expect(teamsService.assertMember).toHaveBeenCalledWith(
        'team-123',
        'user-123',
      );
      expect(repository.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getStats', () => {
    it('should calculate statistics', async () => {
      const stats = {
        ranking: [],
        balance: 100,
        series: [],
        resultBreakdown: [],
        rankingTotal: {
          successes: 0,
          failures: 0,
          successesPercentage: 0,
          doubleSuccesses: 0,
          doubleFailures: 0,
          doubleSuccessesPercentage: 0,
          tripleSuccesses: 0,
          tripleFailures: 0,
          tripleSuccessesPercentage: 0,
          full15Successes: 0,
          full15Failures: 0,
          full15SuccessesPercentage: 0,
          elige8Successes: 0,
          elige8Failures: 0,
          elige8SuccessesPercentage: 0,
        },
      };

      repository.getStats.mockResolvedValue(stats);

      const result = await service.getStats();

      expect(result).toEqual(stats);
      expect(repository.getStats).toHaveBeenCalled();
    });

    it('should assert team membership when calculating team stats', async () => {
      const stats = {
        ranking: [],
        balance: 100,
        series: [],
        resultBreakdown: [],
        rankingTotal: {
          successes: 0,
          failures: 0,
          successesPercentage: 0,
          doubleSuccesses: 0,
          doubleFailures: 0,
          doubleSuccessesPercentage: 0,
          tripleSuccesses: 0,
          tripleFailures: 0,
          tripleSuccessesPercentage: 0,
          full15Successes: 0,
          full15Failures: 0,
          full15SuccessesPercentage: 0,
          elige8Successes: 0,
          elige8Failures: 0,
          elige8SuccessesPercentage: 0,
        },
      };

      repository.getStats.mockResolvedValue(stats);

      const result = await service.getStats('team-123', { id: 'user-123' });

      expect(result).toEqual(stats);
      expect(teamsService.assertMember).toHaveBeenCalledWith(
        'team-123',
        'user-123',
      );
      expect(repository.getStats).toHaveBeenCalledWith('team-123');
    });
  });

  describe('createPool', () => {
    it('should create pool and emit event', async () => {
      const createDto = {
        doubles: 2,
        triples: 1,
        elige8: false,
        date: '2024-01-15',
        active: true,
        matches: [],
      };

      repository.createPool.mockResolvedValue(mockPool);

      const result = await service.createPool(createDto);

      expect(result).toBeDefined();
      expect(repository.createPool).toHaveBeenCalledWith(createDto);
      expect(events.emitPoolUpdated).toHaveBeenCalledWith({
        poolId: 'pool-123',
        pool: mockPool,
      });
    });

    it('should trigger notification', async () => {
      const createDto = {
        doubles: 2,
        date: '2024-01-15',
        matches: [],
      };
      const actor = { id: 'user-123', name: 'Test User' };

      repository.createPool.mockResolvedValue(mockPool);

      await service.createPool(createDto, actor);

      expect(notifier.notifyPoolCreated).toHaveBeenCalledWith(
        mockPool,
        createDto,
        actor,
      );
    });
  });

  describe('updatePool', () => {
    it('should update pool and emit event', async () => {
      const updateDto = { doubles: 3 };
      const updatedPool = { ...mockPool, doubles: 3 };

      repository.findById.mockResolvedValue(mockPool);
      repository.updatePool.mockResolvedValue(updatedPool);

      const result = await service.updatePool('pool-123', updateDto);

      expect(result.doubles).toBe(3);
      expect(repository.updatePool).toHaveBeenCalledWith('pool-123', updateDto);
      expect(events.emitPoolUpdated).toHaveBeenCalledWith({
        poolId: 'pool-123',
        pool: updatedPool,
      });
    });

    it('should trigger notification with changes', async () => {
      const updateDto = { doubles: 3, elige8: true };
      const actor = { id: 'user-123', name: 'Test User' };
      const updatedPool = { ...mockPool, doubles: 3, elige8: true };

      repository.findById.mockResolvedValue(mockPool);
      repository.updatePool.mockResolvedValue(updatedPool);

      await service.updatePool('pool-123', updateDto, actor);

      expect(notifier.notifyPoolUpdated).toHaveBeenCalledWith(
        updatedPool,
        mockPool,
        updateDto,
        actor,
      );
    });
  });
});
