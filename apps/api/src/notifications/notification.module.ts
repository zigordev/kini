import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { EmailNotificationPublisher } from './email-notification.publisher';
import { NotificationProducer } from './notification.producer';
import { NotifierService } from './notifier.service';

@Module({
  imports: [ConfigModule, EventsModule],
  providers: [
    EmailNotificationPublisher,
    NotificationProducer,
    NotifierService,
  ],
  exports: [EmailNotificationPublisher, NotificationProducer, NotifierService],
})
export class NotificationModule {}
