import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { FutPoolMatch } from '../fut-pool-match/entities/fut-pool-match.entity';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { TeamsModule } from '../teams/teams.module';
import { AvailablePoolsController } from './available-pools.controller';
import { AvailablePoolsService } from './available-pools.service';
import { AvailablePool } from './entities/available-pool.entity';

@Module({
  imports: [
    ConfigModule,
    EventsModule,
    TeamsModule,
    TypeOrmModule.forFeature([AvailablePool, FutPool, FutPoolMatch]),
  ],
  controllers: [AvailablePoolsController],
  providers: [AvailablePoolsService],
  exports: [AvailablePoolsService],
})
export class AvailablePoolsModule {}
