import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            listUsers: jest.fn(),
            updateUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listUsers', () => {
    it('should return list of users', async () => {
      const users = [
        {
          id: 'user-1',
          name: 'Alice',
          textColor: '#000',
          backgroundColor: '#FFF',
        },
        {
          id: 'user-2',
          name: 'Bob',
          textColor: '#FFF',
          backgroundColor: '#000',
        },
      ];
      service.listUsers.mockResolvedValue(users);

      const result = await controller.listUsers();

      expect(result).toHaveLength(2);
      expect(service.listUsers).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update authenticated user', async () => {
      const mockRequest = {
        user: { id: 'user-123', name: 'Test User' },
      };

      const updateDto = { name: 'Updated Name' };
      const updatedUser = {
        id: 'user-123',
        name: 'Updated Name',
        email: 'test@example.com',
        avatarUrl: null,
        givenName: null,
        familyName: null,
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
        language: 'en',
        theme: 'light',
        activeTeamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(mockRequest as any, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.updateUser).toHaveBeenCalledWith('user-123', updateDto);
    });
  });
});
