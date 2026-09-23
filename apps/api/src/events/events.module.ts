import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMembership } from '../teams/entities/team-membership.entity';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMembership])],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
