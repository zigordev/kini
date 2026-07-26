import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../events/events.gateway';
import {
  NotificationPayload,
  NotificationProducer,
} from './notification.producer';

describe('NotificationProducer', () => {
  let producer: NotificationProducer;
  let gateway: jest.Mocked<EventsGateway>;

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
      ],
    }).compile();

    producer = module.get<NotificationProducer>(NotificationProducer);
    gateway = module.get(EventsGateway) as jest.Mocked<EventsGateway>;
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
      await producer.emit(payload);

      expect(gateway.server.emit).toHaveBeenCalledWith('notification', payload);
    });

    it('should broadcast the complete payload without changing recipients', async () => {
      const fullPayload: NotificationPayload = {
        type: 'match',
        title: 'Match Updated',
        body: 'Team A vs Team B',
        teamId: 'team-123',
        poolId: 'pool-123',
        matchId: 'match-456',
        recipientUserIds: ['user-123'],
        actorId: 'user-789',
        actorName: 'Test User',
        details: { custom: 'data' },
      };

      await producer.emit(fullPayload);

      expect(gateway.server.emit).toHaveBeenCalledTimes(1);
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'notification',
        fullPayload,
      );
    });
  });
});
