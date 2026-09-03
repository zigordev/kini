import { vi, type Mocked } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FutPoolController } from './fut-pool.controller';
import { FutPoolService } from './fut-pool.service';

describe('FutPoolController', () => {
  let controller: FutPoolController;
  let service: Mocked<FutPoolService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FutPoolController],
      providers: [
        {
          provide: FutPoolService,
          useValue: {
            findAll: vi.fn(),
            getStats: vi.fn(),
            createPool: vi.fn(),
            updatePool: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FutPoolController>(FutPoolController);
    service = module.get(FutPoolService) as Mocked<FutPoolService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFutPools', () => {
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

      service.findAll.mockResolvedValue(expected);

      const mockRequest = {};

      const result = await controller.getFutPools(query, mockRequest);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(query, undefined);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
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

      service.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();

      expect(result).toEqual(stats);
    });
  });

  describe('createPool', () => {
    it('should create pool with actor', async () => {
      const payload = {
        doubles: 2,
        date: '2024-01-15',
        matches: [],
      };
      const mockRequest = {
        user: { id: 'user-123', name: 'Test User' },
      };
      const expectedPool = {
        id: 'pool-123',
        doubles: 2,
        triples: 0,
        elige8: false,
        date: new Date('2024-01-15'),
        active: true,
        status: 'programmed' as const,
        cost: 3,
        earning: null,
        matches: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.createPool.mockResolvedValue(expectedPool);

      const result = await controller.createPool(payload, mockRequest);

      expect(result).toEqual(expectedPool);
      expect(service.createPool).toHaveBeenCalledWith(payload, {
        id: 'user-123',
        name: 'Test User',
      });
    });

    it('should create pool without actor', async () => {
      const payload = {
        doubles: 2,
        date: '2024-01-15',
        matches: [],
      };
      const mockRequest = {};

      service.createPool.mockResolvedValue({} as any);

      await controller.createPool(payload, mockRequest);

      expect(service.createPool).toHaveBeenCalledWith(payload, undefined);
    });
  });

  describe('updatePool', () => {
    it('should update pool with actor', async () => {
      const payload = { doubles: 3 };
      const mockRequest = {
        user: { id: 'user-123', name: 'Test User' },
      };
      const expectedPool = {
        id: 'pool-123',
        doubles: 3,
        triples: 0,
        elige8: false,
        date: new Date('2024-01-15'),
        active: true,
        status: 'programmed' as const,
        cost: 6,
        earning: null,
        matches: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.updatePool.mockResolvedValue(expectedPool);

      const result = await controller.updatePool(
        'pool-123',
        payload,
        mockRequest,
      );

      expect(result).toEqual(expectedPool);
      expect(service.updatePool).toHaveBeenCalledWith('pool-123', payload, {
        id: 'user-123',
        name: 'Test User',
      });
    });
  });
});
