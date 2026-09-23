import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway, userRoom } from '../events/events.gateway';
import { NotificationPayload, NotificationProducer } from './notification.producer';

describe('NotificationProducer', () => {
  let producer: NotificationProducer;
  let roomEmit: ReturnType<typeof vi.fn>;
  let to: ReturnType<typeof vi.fn>;
  let broadcast: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    roomEmit = vi.fn();
    to = vi.fn().mockReturnValue({ emit: roomEmit });
    broadcast = vi.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProducer,
        { provide: EventsGateway, useValue: { server: { to, emit: broadcast } } },
      ],
    }).compile();

    producer = module.get<NotificationProducer>(NotificationProducer);
  });

  it('should be defined', () => {
    expect(producer).toBeDefined();
  });

  describe('emit', () => {
    it("sends the notification to each recipient's own room, once", async () => {
      const payload: NotificationPayload = {
        type: 'pool',
        title: 'Quiniela completada',
        body: 'Las 15 predicciones de la quiniela están completadas',
        teamId: 'team-123',
        poolId: 'pool-123',
        recipientUserIds: ['user-1', 'user-2', 'user-1'],
        details: { teamName: 'Peña' },
      };

      await producer.emit(payload);

      expect(to).toHaveBeenCalledTimes(2);
      expect(to).toHaveBeenCalledWith(userRoom('user-1'));
      expect(to).toHaveBeenCalledWith(userRoom('user-2'));
      expect(roomEmit).toHaveBeenCalledWith('notification', payload);
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('sends nothing when a notification names no recipients', async () => {
      await producer.emit({
        type: 'team',
        title: 'Invitación a equipo',
        body: 'Ana te ha invitado a Peña',
        teamId: 'team-123',
        recipientUserIds: [],
        details: { to: 'invitee@example.com', inviterEmail: 'ana@example.com' },
      });

      expect(to).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });
  });
});
