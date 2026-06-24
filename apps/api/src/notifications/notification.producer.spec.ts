import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsGateway } from '../events/events.gateway';
import { User } from '../users/user.entity';
import { NotificationToken } from './notification-token.entity';
import {
  NotificationPayload,
  NotificationProducer,
} from './notification.producer';

// Mock fetch globally
global.fetch = jest.fn();

describe('NotificationProducer', () => {
  let producer: NotificationProducer;
  let repository: jest.Mocked<Repository<NotificationToken>>;
  let gateway: jest.Mocked<EventsGateway>;

  const mockUser: User = {
    id: 'user-123',
    notificationsEnabled: true,
  } as User;

  const mockToken: NotificationToken = {
    id: 'token-1',
    token: 'ExponentPushToken[xxxxx]',
    active: true,
    user: mockUser,
    userId: 'user-123',
  } as NotificationToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProducer,
        {
          provide: EventsGateway,
          useValue: {
            server: {
              emit: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(NotificationToken),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    producer = module.get<NotificationProducer>(NotificationProducer);
    repository = module.get(
      getRepositoryToken(NotificationToken),
    ) as jest.Mocked<Repository<NotificationToken>>;
    gateway = module.get(EventsGateway) as jest.Mocked<EventsGateway>;

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(producer).toBeDefined();
  });

  describe('emit', () => {
    const payload: NotificationPayload = {
      type: 'pool',
      title: 'Test Notification',
      body: 'Test body',
      poolId: 'pool-123',
      recipientUserIds: [],
    };

    it('should broadcast via WebSocket', async () => {
      repository.find.mockResolvedValue([]);

      await producer.emit(payload);

      expect(gateway.server.emit).toHaveBeenCalledWith('notification', payload);
    });

    it('should send push notifications to active tokens', async () => {
      repository.find.mockResolvedValue([mockToken]);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await producer.emit(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );
    });

    it('should send push notifications to every active token', async () => {
      const disabledUser = { ...mockUser, notificationsEnabled: false };
      const disabledToken = { ...mockToken, user: disabledUser };

      repository.find.mockResolvedValue([mockToken, disabledToken]);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await producer.emit(payload);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toHaveLength(2);
      expect(body[0].to).toBe('ExponentPushToken[xxxxx]');
      expect(body[1].to).toBe('ExponentPushToken[xxxxx]');
    });

    it('should chunk messages (max 100 per request)', async () => {
      const tokens = Array.from({ length: 250 }, (_, i) => ({
        ...mockToken,
        id: `token-${i}`,
        token: `ExponentPushToken[${i}]`,
      }));

      repository.find.mockResolvedValue(tokens);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await producer.emit(payload);

      expect(global.fetch).toHaveBeenCalledTimes(3); // 250 / 100 = 3 chunks
    });

    it('should handle fetch failures gracefully', async () => {
      repository.find.mockResolvedValue([mockToken]);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(producer.emit(payload)).resolves.toBeUndefined();
    });

    it('should skip push if no enabled tokens', async () => {
      repository.find.mockResolvedValue([]);

      await producer.emit(payload);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should include all notification data in push message', async () => {
      const fullPayload: NotificationPayload = {
        type: 'match',
        title: 'Match Updated',
        body: 'Team A vs Team B',
        poolId: 'pool-123',
        matchId: 'match-456',
        recipientUserIds: [],
        actorId: 'user-789',
        actorName: 'Test User',
        details: { custom: 'data' },
      };

      repository.find.mockResolvedValue([mockToken]);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await producer.emit(fullPayload);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body[0]).toEqual({
        to: 'ExponentPushToken[xxxxx]',
        sound: 'default',
        title: 'Match Updated',
        body: 'Team A vs Team B',
        data: {
          type: 'match',
          poolId: 'pool-123',
          matchId: 'match-456',
          actorId: 'user-789',
          actorName: 'Test User',
          details: { custom: 'data' },
        },
      });
    });

    it('should handle payload without optional fields', async () => {
      const minimalPayload: NotificationPayload = {
        type: 'pool',
        title: 'Title',
        body: 'Body',
        recipientUserIds: [],
      };

      repository.find.mockResolvedValue([mockToken]);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await producer.emit(minimalPayload);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body[0].data).toEqual({
        type: 'pool',
        poolId: undefined,
        matchId: undefined,
        actorId: undefined,
        actorName: undefined,
        details: {},
      });
    });
  });
});
