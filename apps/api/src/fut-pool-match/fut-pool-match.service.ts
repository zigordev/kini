import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/events/events.gateway';
import { NotifierService } from 'src/notifications/notifier.service';
import { TeamsService } from 'src/teams/teams.service';
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
    private readonly teams: TeamsService,
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

    const wasComplete =
      oldMatch?.futPoolId && match.results !== undefined
        ? await this.futPoolMatchRepository.isPoolPredictionsComplete(
            oldMatch.futPoolId,
          )
        : false;

    const updated = await this.futPoolMatchRepository.update(matchId, match);

    this.events.emitMatchUpdated({
      poolId: updated.futPool.id,
      matchId: updated.id,
      match: updated,
    });

    await this.notifier.notifyMatchUpdated(updated, oldMatch, match, actor);

    if (match.results !== undefined && !wasComplete) {
      const isComplete =
        await this.futPoolMatchRepository.isPoolPredictionsComplete(
          updated.futPoolId,
        );
      if (isComplete && updated.futPool?.teamId) {
        const members = await this.teams.listActiveMemberUsers(
          updated.futPool.teamId,
        );
        await this.notifier.notifyPoolPredictionsCompleted({
          poolId: updated.futPool.id,
          poolDate: updated.futPool.date,
          teamId: updated.futPool.teamId,
          teamName: updated.futPool.team?.name,
          recipientUserIds: members.map((member) => member.id),
          actor,
        });
      }
    }

    return this.toResponseDto(updated);
  }

  private toResponseDto(entity: FutPoolMatch): FutPoolMatchResponseDto {
    return {
      id: entity.id,
      homeTeam: entity.homeTeam,
      awayTeam: entity.awayTeam,
      poolOrder: entity.poolOrder,
      results: entity.results,
      officialResults: entity.officialResults,
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
