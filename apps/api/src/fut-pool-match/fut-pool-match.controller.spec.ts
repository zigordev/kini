import { Test, TestingModule } from '@nestjs/testing';
import { Result } from './entities/fut-pool-match.entity';
import { FutPoolMatchController } from './fut-pool-match.controller';
import { FutPoolMatchService } from './fut-pool-match.service';

describe('FutPoolMatchController', () => {
  let controller: FutPoolMatchController;
  let service: jest.Mocked<FutPoolMatchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FutPoolMatchController],
      providers: [
        {
          provide: FutPoolMatchService,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FutPoolMatchController>(FutPoolMatchController);
    service = module.get(
      FutPoolMatchService,
    ) as jest.Mocked<FutPoolMatchService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update', () => {
    it('should update match with actor', async () => {
      const matchId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = { results: [Result.HOME, Result.DRAW], success: true };
      const mockRequest = {
        user: { id: 'user-123', name: 'Test User' },
      };
      const expectedMatch = {
        id: matchId,
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        poolOrder: 1,
        results: [Result.HOME, Result.DRAW],
        officialResults: [],
        success: true,
        elige8: false,
        full15: false,
        user: {
          id: 'user-123',
          name: 'Test User',
          textColor: '#000',
          backgroundColor: '#FFF',
        },
        userId: 'user-123',
        futPoolId: 'pool-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.update.mockResolvedValue(expectedMatch);

      const result = await controller.update(matchId, updateDto, mockRequest);

      expect(result).toEqual(expectedMatch);
      expect(service.update).toHaveBeenCalledWith(matchId, updateDto, {
        id: 'user-123',
        name: 'Test User',
      });
    });

    it('should update match without actor', async () => {
      const matchId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = { success: false };
      const mockRequest = {};

      service.update.mockResolvedValue({} as any);

      await controller.update(matchId, updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(
        matchId,
        updateDto,
        undefined,
      );
    });
  });
});
