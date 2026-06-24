import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/events/events.gateway';
import { NotifierService } from 'src/notifications/notifier.service';
import { FutPoolMatchResponseDto } from './dto/fut-pool-match-response.dto';
import { UpdateFutPoolMatchDto } from './dto/update-fut-pool-match.dto';
import { FutPoolMatch } from './entities/fut-pool-match.entity';
import { FutPoolMatchRepository } from './fut-pool-match.repository';

@Injectable()
export class FutPoolMatchService {
  constructor(
    private readonly futPoolMatchRepository: FutPoolMatchRepository,
    private readonly events: EventsGateway,
    private readonly notifier: NotifierService,
  ) {}

  async update(
    matchId: string,
    match: UpdateFutPoolMatchDto,
    actor?: { id: string; name?: string },
  ): Promise<FutPoolMatchResponseDto> {
    const oldMatch = await this.futPoolMatchRepository.findById(matchId);

    if (
      match.results !== undefined &&
      actor?.id &&
      oldMatch?.userId &&
      actor.id !== oldMatch.userId
    ) {
      throw new Error(
        'No tienes permisos para cambiar los resultados de este partido. Solo puedes cambiar los resultados de los partidos asignados a ti.',
      );
    }

    const updated = await this.futPoolMatchRepository.update(matchId, match);

    this.events.emitMatchUpdated({
      poolId: updated.futPool.id,
      matchId: updated.id,
      match: updated,
    });

    await this.notifier.notifyMatchUpdated(updated, oldMatch, match, actor);

    return this.toResponseDto(updated);
  }

  private toResponseDto(entity: FutPoolMatch): FutPoolMatchResponseDto {
    return {
      id: entity.id,
      homeTeam: entity.homeTeam,
      awayTeam: entity.awayTeam,
      poolOrder: entity.poolOrder,
      results: entity.results,
      success: entity.success,
      elige8: entity.elige8,
      full15: entity.full15,
      user: entity.user
        ? {
            id: entity.user.id,
            name: entity.user.name,
            textColor: entity.user.textColor,
            backgroundColor: entity.user.backgroundColor,
          }
        : undefined,
      userId: entity.userId,
      futPoolId: entity.futPoolId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
