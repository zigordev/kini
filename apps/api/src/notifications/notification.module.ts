import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { NotificationToken } from './notification-token.entity';
import { NotificationController } from './notification.controller';
import { NotificationProducer } from './notification.producer';
import { NotifierService } from './notifier.service';

@Module({
  imports: [EventsModule, TypeOrmModule.forFeature([NotificationToken])],
  controllers: [NotificationController],
  providers: [NotificationProducer, NotifierService],
  exports: [NotificationProducer, NotifierService, TypeOrmModule],
})
export class NotificationModule {}
