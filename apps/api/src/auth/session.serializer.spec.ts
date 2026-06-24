import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { SessionSerializer } from './session.serializer';

describe('SessionSerializer', () => {
  let serializer: SessionSerializer;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: 'user-123',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    givenName: 'Test',
    familyName: 'User',
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    notificationsEnabled: true,
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionSerializer,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    serializer = module.get<SessionSerializer>(SessionSerializer);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(serializer).toBeDefined();
  });

  describe('serializeUser', () => {
    it('should serialize user to ID', (done) => {
      serializer.serializeUser(mockUser, (err, payload) => {
        expect(err).toBeNull();
        expect(payload).toBe('user-123');
        done();
      });
    });
  });

  describe('deserializeUser', () => {
    it('should deserialize ID to user', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      await new Promise<void>((resolve) => {
        serializer.deserializeUser('user-123', (err, user) => {
          expect(err).toBeNull();
          expect(user).toEqual(mockUser);
          expect(usersService.findById).toHaveBeenCalledWith('user-123');
          resolve();
        });
      });
    });

    it('should handle missing user', async () => {
      usersService.findById.mockResolvedValue(null);

      await new Promise<void>((resolve) => {
        serializer.deserializeUser('user-123', (err, user) => {
          expect(err).toBeNull();
          expect(user).toBeNull();
          resolve();
        });
      });
    });

    it('should handle errors from UsersService', async () => {
      const error = new Error('Database error');
      usersService.findById.mockRejectedValue(error);

      await new Promise<void>((resolve) => {
        serializer.deserializeUser('user-123', (err, user) => {
          expect(err).toBe(error);
          expect(user).toBeUndefined();
          resolve();
        });
      });
    });
  });
});
