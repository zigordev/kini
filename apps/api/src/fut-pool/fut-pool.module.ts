import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { NotificationModule } from '../notifications/notification.module';
import { TeamsModule } from '../teams/teams.module';
import { FutPool } from './entities/fut-pool.entity';
import { FutPoolController } from './fut-pool.controller';
import { FutPoolRepository } from './fut-pool.repository';
import { FutPoolService } from './fut-pool.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FutPool]),
    EventsModule,
    NotificationModule,
    TeamsModule,
  ],
  controllers: [FutPoolController],
  providers: [FutPoolService, FutPoolRepository],
  exports: [FutPoolService],
})
export class FutPoolModule {}
