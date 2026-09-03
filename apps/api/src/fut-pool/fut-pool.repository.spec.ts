import { vi, type Mocked } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FutPoolMatch,
  Result,
} from '../fut-pool-match/entities/fut-pool-match.entity';
import { User } from '../users/user.entity';
import { FutPool } from './entities/fut-pool.entity';
import { FutPoolRepository } from './fut-pool.repository';

describe('FutPoolRepository', () => {
  let repository: FutPoolRepository;
  let typeormRepository: Mocked<Repository<FutPool>>;

  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    textColor: '#000',
    backgroundColor: '#FFF',
  } as User;

  const mockMatch: FutPoolMatch = {
    id: 'match-1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    poolOrder: 1,
    results: [Result.HOME],
    success: true,
    elige8: false,
    full15: false,
    user: mockUser,
  } as FutPoolMatch;

  const mockPool: FutPool = {
    id: 'pool-123',
    doubles: 2,
    triples: 0,
    elige8: false,
    date: new Date('2024-01-15'),
    active: true,
    cost: 3,
    earning: 10,
    matches: [mockMatch],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FutPool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FutPoolRepository,
        {
          provide: getRepositoryToken(FutPool),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
            findAndCount: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            manager: {
              getRepository: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<FutPoolRepository>(FutPoolRepository);
    typeormRepository = module.get(getRepositoryToken(FutPool)) as Mocked<
      Repository<FutPool>
    >;
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should paginate and sort correctly', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc' as const,
      };

      typeormRepository.findAndCount.mockResolvedValue([[mockPool], 1]);

      const result = await repository.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        sortBy: 'date',
        sortOrder: 'desc',
      });
    });

    it('should calculate totalPages correctly', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'asc' as const,
      };

      typeormRepository.findAndCount.mockResolvedValue([[], 25]);

      const result = await repository.findAll(query);

      expect(result.meta.totalPages).toBe(3); // ceil(25/10)
    });
  });

  describe('getStats', () => {
    it('should calculate balance correctly', async () => {
      const pools = [
        { ...mockPool, cost: 10, earning: 50 },
        { ...mockPool, cost: 5, earning: 20 },
      ];

      typeormRepository.find.mockResolvedValue(pools);

      const result = await repository.getStats();

      expect(result.balance).toBe(55); // (50 + 20) - (10 + 5)
    });

    it('should calculate series correctly', async () => {
      const match1 = { ...mockMatch, success: true, full15: false };
      const match2 = { ...mockMatch, success: false, full15: false };
      const pool = { ...mockPool, matches: [match1, match2] };

      typeormRepository.find.mockResolvedValue([pool]);

      const result = await repository.getStats();

      expect(result.series).toHaveLength(1);
      expect(result.series[0].successes).toBe(1);
    });

    it('should handle double/triple matches', async () => {
      const doubleMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW],
        success: true,
        full15: false,
      };
      const tripleMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW, Result.AWAY],
        success: true,
        full15: false,
      };
      const pool = { ...mockPool, matches: [doubleMatch, tripleMatch] };

      typeormRepository.find.mockResolvedValue([pool]);

      const result = await repository.getStats();

      expect(result.rankingTotal.doubleSuccesses).toBe(1);
      expect(result.rankingTotal.tripleSuccesses).toBe(1);
    });

    it('should handle E8 matches', async () => {
      const elige8Match = {
        ...mockMatch,
        elige8: true,
        success: true,
        full15: false,
      };
      const pool = { ...mockPool, matches: [elige8Match] };

      typeormRepository.find.mockResolvedValue([pool]);

      const result = await repository.getStats();

      expect(result.rankingTotal.elige8Successes).toBe(1);
    });

    it('should handle full15 matches', async () => {
      const full15Match = { ...mockMatch, full15: true, success: true };
      const pool = { ...mockPool, matches: [full15Match] };

      typeormRepository.find.mockResolvedValue([pool]);

      const result = await repository.getStats();

      expect(result.rankingTotal.full15Successes).toBe(1);
    });

    it('should calculate percentages correctly', async () => {
      const successMatch = { ...mockMatch, success: true, full15: false };
      const failMatch = { ...mockMatch, success: false, full15: false };
      const pool = { ...mockPool, matches: [successMatch, failMatch] };

      typeormRepository.find.mockResolvedValue([pool]);

      const result = await repository.getStats();

      expect(result.rankingTotal.successesPercentage).toBe(50); // 1/2 * 100
    });
  });

  describe('findById', () => {
    it('should find pool by ID', async () => {
      typeormRepository.findOne.mockResolvedValue(mockPool);

      const result = await repository.findById('pool-123');

      expect(result).toEqual(mockPool);
    });
  });

  describe('updatePool', () => {
    it('should update pool', async () => {
      const updateDto = { doubles: 3 };
      const updatedPool = { ...mockPool, doubles: 3 };

      typeormRepository.findOne.mockResolvedValue(mockPool);
      typeormRepository.save.mockResolvedValue(updatedPool);

      const result = await repository.updatePool('pool-123', updateDto);

      expect(result.doubles).toBe(3);
    });

    it('should throw NotFoundException when pool not found', async () => {
      typeormRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.updatePool('pool-123', { doubles: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate doubles against existing results', async () => {
      const doubleMatch1 = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW],
        full15: false,
      };
      const doubleMatch2 = {
        ...mockMatch,
        results: [Result.HOME, Result.AWAY],
        full15: false,
      };
      const pool = {
        ...mockPool,
        doubles: 3,
        matches: [doubleMatch1, doubleMatch2],
      };

      typeormRepository.findOne.mockResolvedValue(pool);

      await expect(
        repository.updatePool('pool-123', { doubles: 1 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        repository.updatePool('pool-123', { doubles: 1 }),
      ).rejects.toThrow(/already 2 matches with double results/);
    });

    it('should validate triples against existing results', async () => {
      const tripleMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW, Result.AWAY],
        full15: false,
      };
      const pool = { ...mockPool, triples: 2, matches: [tripleMatch] };

      typeormRepository.findOne.mockResolvedValue(pool);

      await expect(
        repository.updatePool('pool-123', { triples: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle date conversion', async () => {
      const updateDto = { date: '2024-02-01' };
      const updatedPool = { ...mockPool, date: new Date('2024-02-01') };

      typeormRepository.findOne.mockResolvedValue(mockPool);
      typeormRepository.save.mockResolvedValue(updatedPool);

      const result = await repository.updatePool('pool-123', updateDto as any);

      expect(result.date).toEqual(new Date('2024-02-01'));
    });
  });

  describe('createPool', () => {
    it('should create pool with correct cost calculation', async () => {
      const payload = {
        doubles: 2,
        triples: 1,
        date: '2024-01-15',
        matches: [],
      };
      const expectedCost = 0.75 * Math.pow(2, 2) * Math.pow(3, 1); // 0.75 * 4 * 3 = 9

      typeormRepository.create.mockReturnValue(mockPool);
      typeormRepository.save.mockResolvedValue(mockPool);
      typeormRepository.findOne.mockResolvedValue(mockPool);

      await repository.createPool(payload);

      expect(typeormRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cost: expectedCost,
        }),
      );
    });

    it('should create matches', async () => {
      const payload = {
        doubles: 2,
        date: '2024-01-15',
        matches: [
          {
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            order: 1,
            userId: 'user-123',
          },
          {
            homeTeam: 'Team C',
            awayTeam: 'Team D',
            order: 2,
            userId: 'user-123',
          },
        ],
      };

      const matchRepository = {
        save: vi.fn().mockResolvedValue({}),
      };
      const userRepository = {
        findOne: vi.fn().mockResolvedValue(mockUser),
      };

      typeormRepository.create.mockReturnValue(mockPool);
      typeormRepository.save.mockResolvedValue(mockPool);
      typeormRepository.findOne.mockResolvedValue(mockPool);
      typeormRepository.manager.getRepository = vi
        .fn()
        .mockImplementation((entity) => {
          if (entity === FutPoolMatch) return matchRepository;
          if (entity === User) return userRepository;
          return null;
        });

      await repository.createPool(payload);

      expect(matchRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should set last match as full15', async () => {
      const payload = {
        doubles: 2,
        date: '2024-01-15',
        matches: [
          {
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            order: 1,
            userId: 'user-123',
          },
          {
            homeTeam: 'Team C',
            awayTeam: 'Team D',
            order: 2,
            userId: 'user-123',
          },
        ],
      };

      const matchRepository = {
        save: vi.fn().mockResolvedValue({}),
      };
      const userRepository = {
        findOne: vi.fn().mockResolvedValue(mockUser),
      };

      typeormRepository.create.mockReturnValue(mockPool);
      typeormRepository.save.mockResolvedValue(mockPool);
      typeormRepository.findOne.mockResolvedValue(mockPool);
      typeormRepository.manager.getRepository = vi
        .fn()
        .mockImplementation((entity) => {
          if (entity === FutPoolMatch) return matchRepository;
          if (entity === User) return userRepository;
          return null;
        });

      await repository.createPool(payload);

      const lastCall = matchRepository.save.mock.calls[1][0];
      expect(lastCall.full15).toBe(true);
    });

    it('should validate match data', async () => {
      const payload = {
        doubles: 2,
        date: '2024-01-15',
        matches: [
          { homeTeam: '', awayTeam: 'Team B', order: 1, userId: 'user-123' },
        ],
      };

      typeormRepository.create.mockReturnValue(mockPool);
      typeormRepository.save.mockResolvedValue(mockPool);

      await expect(repository.createPool(payload)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
