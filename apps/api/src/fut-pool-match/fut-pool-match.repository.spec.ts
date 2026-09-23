import { vi, type Mocked, type Mock } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { registry } from '../observability';
import { User } from '../users/user.entity';
import { FutPoolMatch, Result } from './entities/fut-pool-match.entity';
import { FutPoolMatchRepository } from './fut-pool-match.repository';

const matchOutcomes = async (outcome: string): Promise<number> => {
  const line = `kini_match_results_total{outcome="${outcome}"}`;
  const text = await registry.metrics();
  const row = text.split('\n').find((entry) => entry.startsWith(`${line} `));
  return row ? Number(row.slice(line.length + 1)) : 0;
};

describe('FutPoolMatchRepository', () => {
  let repository: FutPoolMatchRepository;
  let typeormRepository: Mocked<Repository<FutPoolMatch>>;

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
    success: null,
    elige8: false,
    full15: false,
    userId: 'user-123',
    futPoolId: 'pool-123',
    futPool: mockPool,
  } as FutPoolMatch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FutPoolMatchRepository,
        {
          provide: getRepositoryToken(FutPoolMatch),
          useValue: {
            findOne: vi.fn(),
            save: vi.fn(),
            count: vi.fn(),
            createQueryBuilder: vi.fn(),
            manager: {
              findOne: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<FutPoolMatchRepository>(FutPoolMatchRepository);
    typeormRepository = module.get(getRepositoryToken(FutPoolMatch)) as Mocked<
      Repository<FutPoolMatch>
    >;
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find match by ID', async () => {
      typeormRepository.findOne.mockResolvedValue(mockMatch);

      const result = await repository.findById('match-123');

      expect(result).toEqual(mockMatch);
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        relations: { futPool: true, user: true },
      });
    });

    it('should return null when match not found', async () => {
      typeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update match', async () => {
      const updateDto = { success: true };
      const updatedMatch = { ...mockMatch, success: true };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await repository.update('match-123', updateDto);

      expect(result.success).toBe(true);
      expect(typeormRepository.save).toHaveBeenCalled();
    });

    it('should handle user assignment', async () => {
      const updateDto = { userId: 'user-456' };
      const user = { id: 'user-456', name: 'New User' } as User;
      const updatedMatch = { ...mockMatch, userId: 'user-456', user };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      (typeormRepository.manager.findOne as Mock).mockResolvedValue(user);
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await repository.update('match-123', updateDto);

      expect(result.userId).toBe('user-456');
      expect(result.user).toEqual(user);
    });

    it('should handle user removal', async () => {
      const updateDto = { userId: null };
      const updatedMatch = { ...mockMatch, userId: null, user: null };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await repository.update('match-123', updateDto);

      expect(result.userId).toBeNull();
      expect(result.user).toBeNull();
    });
  });

  describe('elige8 limit enforcement', () => {
    it('should enforce elige8 limit (max 8)', async () => {
      const updateDto = { elige8: true };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(8); // Already 8 E8 matches

      await expect(repository.update('match-123', updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should allow elige8 when under limit', async () => {
      const updateDto = { elige8: true };
      const updatedMatch = { ...mockMatch, elige8: true };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(7); // Only 7 existing
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await repository.update('match-123', updateDto);

      expect(result.elige8).toBe(true);
    });
  });

  describe('double limit enforcement', () => {
    it('should enforce double limit', async () => {
      const updateDto = { results: [Result.HOME, Result.DRAW] };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(0);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(2), // Already 2 doubles
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await expect(repository.update('match-123', updateDto)).rejects.toThrow(BadRequestException);
      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        /maximum number of double matches/
      );
    });

    it('should not count full15 matches in double limit', async () => {
      const full15Match = { ...mockMatch, full15: true };
      const updateDto = { results: [Result.HOME, Result.DRAW] };
      const updatedMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW],
      };

      typeormRepository.findOne.mockResolvedValue(full15Match);
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await repository.update('match-123', updateDto);

      expect(qb.andWhere).toHaveBeenCalledWith('futPoolMatch.full15 = false');
    });
  });

  describe('triple limit enforcement', () => {
    it('should enforce triple limit', async () => {
      const updateDto = { results: [Result.HOME, Result.DRAW, Result.AWAY] };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(0);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(1), // Already 1 triple, limit is 1
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await expect(repository.update('match-123', updateDto)).rejects.toThrow(BadRequestException);
      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        /maximum number of triple matches/
      );
    });

    it('should not count full15 matches in triple limit', async () => {
      const full15Match = { ...mockMatch, full15: true };
      const updateDto = { results: [Result.HOME, Result.DRAW, Result.AWAY] };
      const updatedMatch = {
        ...mockMatch,
        results: [Result.HOME, Result.DRAW, Result.AWAY],
      };

      typeormRepository.findOne.mockResolvedValue(full15Match);
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await repository.update('match-123', updateDto);

      expect(qb.andWhere).toHaveBeenCalledWith('futPoolMatch.full15 = false');
    });
  });

  describe('match verdict counters', () => {
    const scoreable = (officialResults: Result[]): FutPoolMatch =>
      ({
        ...mockMatch,
        results: [Result.HOME],
        officialResults,
        success: null,
      }) as FutPoolMatch;

    const acceptEveryLimit = (): void => {
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.createQueryBuilder.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      } as any);
    };

    it('counts a first verdict as a hit and never counts the same match twice', async () => {
      const match = scoreable([Result.HOME]);
      typeormRepository.findOne.mockResolvedValue(match);
      typeormRepository.save.mockResolvedValue(match);
      acceptEveryLimit();
      const hit = await matchOutcomes('hit');

      await repository.update('match-123', { results: [Result.HOME] });

      expect(match.success).toBe(true);
      expect(await matchOutcomes('hit')).toBe(hit + 1);

      await repository.update('match-123', { results: [Result.HOME] });

      expect(await matchOutcomes('hit')).toBe(hit + 1);
    });

    it('counts a first verdict as a miss when the official result differs', async () => {
      const match = scoreable([Result.DRAW]);
      typeormRepository.findOne.mockResolvedValue(match);
      typeormRepository.save.mockResolvedValue(match);
      acceptEveryLimit();
      const hit = await matchOutcomes('hit');
      const miss = await matchOutcomes('miss');

      await repository.update('match-123', { results: [Result.HOME] });

      expect(match.success).toBe(false);
      expect(await matchOutcomes('miss')).toBe(miss + 1);
      expect(await matchOutcomes('hit')).toBe(hit);
    });

    it('counts nothing while no official result has arrived', async () => {
      const match = scoreable([]);
      typeormRepository.findOne.mockResolvedValue(match);
      typeormRepository.save.mockResolvedValue(match);
      acceptEveryLimit();
      const hit = await matchOutcomes('hit');
      const miss = await matchOutcomes('miss');

      await repository.update('match-123', { results: [Result.HOME] });

      expect(match.success).toBeNull();
      expect(await matchOutcomes('hit')).toBe(hit);
      expect(await matchOutcomes('miss')).toBe(miss);
    });
  });
});
