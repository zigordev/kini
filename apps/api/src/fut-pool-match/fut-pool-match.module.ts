import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { NotificationModule } from '../notifications/notification.module';
import { TeamsModule } from '../teams/teams.module';
import { FutPoolMatch } from './entities/fut-pool-match.entity';
import { FutPoolMatchController } from './fut-pool-match.controller';
import { FutPoolMatchRepository } from './fut-pool-match.repository';
import { FutPoolMatchService } from './fut-pool-match.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FutPoolMatch]),
    EventsModule,
    NotificationModule,
    TeamsModule,
  ],
  controllers: [FutPoolMatchController],
  providers: [FutPoolMatchService, FutPoolMatchRepository],
  exports: [FutPoolMatchService],
})
export class FutPoolMatchModule {}
