import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/events/events.gateway';
import { CreateFutPoolDto } from 'src/fut-pool/dto/create-fut-pool.dto';
import { FutPoolQueryDto } from 'src/fut-pool/dto/fut-pool-query.dto';
import {
  FutPoolPaginatedResponseDto,
  FutPoolResponseDto,
} from 'src/fut-pool/dto/fut-pool-response.dto';
import { convertMatchToResponseDto } from 'src/fut-pool/dto/match-conversion.util';
import { StatsDto } from 'src/fut-pool/dto/stats.dto';
import { UpdateFutPoolDto } from 'src/fut-pool/dto/update-fut-pool.dto';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { FutPoolRepository } from 'src/fut-pool/fut-pool.repository';
import { NotifierService } from 'src/notifications/notifier.service';
import { TeamsService } from 'src/teams/teams.service';

@Injectable()
export class FutPoolService {
  constructor(
    private readonly futPoolRepository: FutPoolRepository,
    private readonly events: EventsGateway,
    private readonly notifier: NotifierService,
    private readonly teamsService: TeamsService,
  ) {}

  async findAll(
    query: FutPoolQueryDto,
    actor?: { id: string },
  ): Promise<FutPoolPaginatedResponseDto> {
    if (query.teamId && actor?.id) {
      await this.teamsService.assertMember(query.teamId, actor.id);
    }
    return this.futPoolRepository.findAll(query);
  }

  async getStats(teamId?: string, actor?: { id: string }): Promise<StatsDto> {
    if (teamId && actor?.id) {
      await this.teamsService.assertMember(teamId, actor.id);
    }
    return this.futPoolRepository.getStats(teamId);
  }

  async createPool(
    payload: CreateFutPoolDto,
    actor?: { id: string; name?: string },
  ): Promise<FutPoolResponseDto> {
    if (payload.teamId && actor?.id) {
      await this.teamsService.assertMember(payload.teamId, actor.id);
    }
    const created = await this.futPoolRepository.createPool(payload);
    this.events.emitPoolUpdated({ poolId: created.id, pool: created });
    await this.notifier.notifyPoolCreated(created, payload, actor);
    return this.toResponseDto(created);
  }

  async updatePool(
    poolId: string,
    payload: UpdateFutPoolDto,
    actor?: { id: string; name?: string },
  ): Promise<FutPoolResponseDto> {
    const oldPool = await this.futPoolRepository.findById(poolId);
    const updated = await this.futPoolRepository.updatePool(poolId, payload);
    this.events.emitPoolUpdated({ poolId: updated.id, pool: updated });
    await this.notifier.notifyPoolUpdated(updated, oldPool, payload, actor);
    return this.toResponseDto(updated);
  }

  private toResponseDto(entity: FutPool): FutPoolResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      availablePoolId: entity.availablePoolId,
      doubles: entity.doubles,
      triples: entity.triples,
      elige8: entity.elige8,
      date: entity.date,
      active: entity.active,
      status: this.getPoolStatus(entity),
      cost: entity.cost,
      earning: entity.earning,
      teamId: entity.teamId,
      matches: entity.matches?.map(convertMatchToResponseDto) || [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private getPoolStatus(entity: FutPool): 'programmed' | 'active' | 'closed' {
    if (!entity.active) {
      return 'closed';
    }

    const deadline = new Date(entity.availablePool?.closingDate ?? entity.date);
    if (!entity.availablePool?.closingDate) {
      deadline.setHours(23, 59, 59, 999);
    }
    const deadlineTime = deadline.getTime();

    return Number.isFinite(deadlineTime) && deadlineTime <= Date.now()
      ? 'active'
      : 'programmed';
  }
}
