import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { NotificationModule } from 'src/notifications/notification.module';
import { User } from 'src/users/user.entity';
import { TeamMembership } from './entities/team-membership.entity';
import { Team } from './entities/team.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    NotificationModule,
    TypeOrmModule.forFeature([Team, TeamMembership, FutPool, User]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService, TypeOrmModule],
})
export class TeamsModule {}
