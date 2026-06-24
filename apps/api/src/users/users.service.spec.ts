import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

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
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User)) as jest.Mocked<
      Repository<User>
    >;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should find user by Google ID', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByGoogleId('google-123');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findOrCreateGoogleUser', () => {
    const profileData = {
      googleId: 'google-123',
      email: 'Test@Example.Com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      givenName: 'Test',
      familyName: 'User',
    };

    it('should create new user if not exists', async () => {
      repository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser };
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(newUser);

      const result = await service.findOrCreateGoogleUser(profileData);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: [{ googleId: 'google-123' }, { email: 'test@example.com' }],
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.email).toBe('test@example.com'); // Lowercase
    });

    it('should update existing user by Google ID', async () => {
      const existingUser = { ...mockUser };
      repository.findOne.mockResolvedValue(existingUser);
      repository.save.mockResolvedValue(existingUser);

      await service.findOrCreateGoogleUser(profileData);

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: 'google-123',
          email: 'test@example.com',
        }),
      );
    });

    it('should set default colors for new users', async () => {
      repository.findOne.mockResolvedValue(null);
      const newUser = {} as User;
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue({
        ...newUser,
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
      } as User);

      await service.findOrCreateGoogleUser(profileData);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          textColor: '#000000',
          backgroundColor: '#FFFFFF',
        }),
      );
    });

    it('should lowercase email', async () => {
      repository.findOne.mockResolvedValue(null);
      const newUser = {} as User;
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(mockUser);

      await service.findOrCreateGoogleUser(profileData);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        }),
      );
    });

    it('should handle null optional fields', async () => {
      repository.findOne.mockResolvedValue(null);
      const newUser = {} as User;
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(mockUser);

      await service.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        givenName: null,
        familyName: null,
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: null,
          givenName: null,
          familyName: null,
        }),
      );
    });
  });

  describe('listUsers', () => {
    it('should return users with specific fields', async () => {
      const users = [
        {
          id: 'user-1',
          name: 'Alice',
          textColor: '#000000',
          backgroundColor: '#FFFFFF',
        },
        {
          id: 'user-2',
          name: 'Bob',
          textColor: '#FFFFFF',
          backgroundColor: '#000000',
        },
      ];

      repository.find.mockResolvedValue(users as User[]);

      const result = await service.listUsers();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'textColor', 'backgroundColor'],
        order: { name: 'ASC' },
      });
    });

    it('should order by name ASC', async () => {
      repository.find.mockResolvedValue([]);

      await service.listUsers();

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'ASC' },
        }),
      );
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUser('user-123', { name: 'New Name' }),
      ).rejects.toThrow('User not found');
    });

    it('should only update provided fields', async () => {
      const existingUser = { ...mockUser };
      repository.findOne.mockResolvedValue(existingUser);
      repository.save.mockResolvedValue({ ...existingUser, language: 'es' });

      await service.updateUser('user-123', { language: 'es' });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'es',
        }),
      );
    });
  });
});
