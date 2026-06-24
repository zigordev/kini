import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { User } from '../users/user.entity';
import { FutPoolMatch, Result } from './entities/fut-pool-match.entity';
import { FutPoolMatchRepository } from './fut-pool-match.repository';

describe('FutPoolMatchRepository', () => {
  let repository: FutPoolMatchRepository;
  let typeormRepository: jest.Mocked<Repository<FutPoolMatch>>;

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
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              findOne: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<FutPoolMatchRepository>(FutPoolMatchRepository);
    typeormRepository = module.get(
      getRepositoryToken(FutPoolMatch),
    ) as jest.Mocked<Repository<FutPoolMatch>>;
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
        relations: { futPool: true },
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
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
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
      (typeormRepository.manager.findOne as jest.Mock).mockResolvedValue(user);
      typeormRepository.count.mockResolvedValue(0);
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
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
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
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
      typeormRepository.count.mockResolvedValue(8); // Already 8 elige8 matches

      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow elige8 when under limit', async () => {
      const updateDto = { elige8: true };
      const updatedMatch = { ...mockMatch, elige8: true };

      typeormRepository.findOne.mockResolvedValue(mockMatch);
      typeormRepository.count.mockResolvedValue(7); // Only 7 existing
      typeormRepository.save.mockResolvedValue(updatedMatch);

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
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
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2), // Already 2 doubles
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        /maximum number of double matches/,
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
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
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
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Already 1 triple, limit is 1
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(repository.update('match-123', updateDto)).rejects.toThrow(
        /maximum number of triple matches/,
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
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      typeormRepository.createQueryBuilder.mockReturnValue(qb as any);

      await repository.update('match-123', updateDto);

      expect(qb.andWhere).toHaveBeenCalledWith('futPoolMatch.full15 = false');
    });
  });
});
