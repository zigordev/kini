import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { EmailNotificationPublisher } from './email-notification.publisher';
import { NotificationToken } from './notification-token.entity';
import { NotificationController } from './notification.controller';
import { NotificationProducer } from './notification.producer';
import { NotifierService } from './notifier.service';

@Module({
  imports: [
    ConfigModule,
    EventsModule,
    TypeOrmModule.forFeature([NotificationToken]),
  ],
  controllers: [NotificationController],
  providers: [
    EmailNotificationPublisher,
    NotificationProducer,
    NotifierService,
  ],
  exports: [
    EmailNotificationPublisher,
    NotificationProducer,
    NotifierService,
    TypeOrmModule,
  ],
})
export class NotificationModule {}
