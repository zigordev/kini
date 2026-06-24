import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { NotificationToken } from './notification-token.entity';
import { NotificationController } from './notification.controller';

describe('NotificationController', () => {
  let controller: NotificationController;
  let repository: jest.Mocked<Repository<NotificationToken>>;

  const mockToken: NotificationToken = {
    id: 'token-123',
    token: 'ExponentPushToken[xxxxx]',
    platform: 'ios',
    userId: 'user-123',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as NotificationToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: getRepositoryToken(NotificationToken),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    repository = module.get(
      getRepositoryToken(NotificationToken),
    ) as jest.Mocked<Repository<NotificationToken>>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register new token', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const body = { token: 'ExponentPushToken[xxxxx]', platform: 'ios' };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockToken);
      repository.save.mockResolvedValue(mockToken);

      const result = await controller.register(mockRequest, body);

      expect(result).toEqual({ ok: true });
      expect(repository.create).toHaveBeenCalledWith({
        token: 'ExponentPushToken[xxxxx]',
        platform: 'ios',
        userId: 'user-123',
        active: true,
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should update existing token', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const body = { token: 'ExponentPushToken[xxxxx]', platform: 'android' };
      const existingToken = { ...mockToken, userId: 'user-old', active: false };

      repository.findOne.mockResolvedValue(existingToken);
      repository.save.mockResolvedValue({
        ...existingToken,
        userId: 'user-123',
        active: true,
      });

      const result = await controller.register(mockRequest, body);

      expect(result).toEqual({ ok: true });
      expect(repository.save).toHaveBeenCalledWith({
        ...existingToken,
        userId: 'user-123',
        platform: 'android',
        active: true,
      });
    });

    it('should handle token without platform', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const body = { token: 'ExponentPushToken[xxxxx]' };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({
        ...mockToken,
        platform: null,
      } as any);
      repository.save.mockResolvedValue(mockToken);

      const result = await controller.register(mockRequest, body);

      expect(result).toEqual({ ok: true });
    });
  });

  describe('unregister', () => {
    it('should deactivate token', async () => {
      const body = { token: 'ExponentPushToken[xxxxx]' };
      const existingToken = { ...mockToken, active: true };

      repository.findOne.mockResolvedValue(existingToken);
      repository.save.mockResolvedValue({ ...existingToken, active: false });

      const result = await controller.unregister(body);

      expect(result).toEqual({ ok: true });
      expect(repository.save).toHaveBeenCalledWith({
        ...existingToken,
        active: false,
      });
    });

    it('should handle non-existent token', async () => {
      const body = { token: 'ExponentPushToken[xxxxx]' };

      repository.findOne.mockResolvedValue(null);

      const result = await controller.unregister(body);

      expect(result).toEqual({ ok: true });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
