import { Injectable } from '@nestjs/common';
import { UpdateFutPoolMatchDto } from 'src/fut-pool-match/dto/update-fut-pool-match.dto';
import { FutPoolMatch } from 'src/fut-pool-match/entities/fut-pool-match.entity';
import { CreateFutPoolDto } from 'src/fut-pool/dto/create-fut-pool.dto';
import { UpdateFutPoolDto } from 'src/fut-pool/dto/update-fut-pool.dto';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { NotificationProducer } from './notification.producer';

@Injectable()
export class NotifierService {
  constructor(private readonly notifications: NotificationProducer) {}

  async notifyPoolCreated(
    pool: FutPool,
    payload: CreateFutPoolDto,
    actor?: { id: string; name?: string },
  ): Promise<void> {
    const body = actor?.name
      ? `${actor.name} ha creado una nueva quiniela`
      : 'Se ha creado una nueva quiniela';

    await this.notifications.emit({
      type: 'pool',
      title: 'Nueva quiniela disponible',
      body,
      poolId: pool.id,
      recipientUserIds: [],
      actorId: actor?.id,
      actorName: actor?.name,
      details: payload as unknown as Record<string, unknown>,
    });
  }

  async notifyPoolUpdated(
    updated: FutPool,
    oldPool: FutPool | null,
    payload: UpdateFutPoolDto,
    actor?: { id: string; name?: string },
  ): Promise<void> {
    const changes: string[] = [];
    if (
      oldPool &&
      payload.doubles !== undefined &&
      payload.doubles !== oldPool.doubles
    ) {
      changes.push(`dobles a ${payload.doubles}`);
    }
    if (
      oldPool &&
      payload.elige8 !== undefined &&
      payload.elige8 !== oldPool.elige8
    ) {
      changes.push(`elige8 a ${payload.elige8 ? 'activado' : 'desactivado'}`);
    }
    const changeDescription =
      changes.length > 0 ? ` (${changes.join(', ')})` : '';
    const body = actor?.name
      ? `${actor.name} ha actualizado la quiniela${changeDescription}`
      : `Se han realizado cambios en la quiniela${changeDescription}`;

    await this.notifications.emit({
      type: 'pool',
      title: 'Quiniela actualizada',
      body,
      poolId: updated.id,
      recipientUserIds: [],
      actorId: actor?.id,
      actorName: actor?.name,
      details: payload as unknown as Record<string, unknown>,
    });
  }

  async notifyMatchUpdated(
    updated: FutPoolMatch,
    oldMatch: FutPoolMatch | null,
    matchUpdate: UpdateFutPoolMatchDto,
    actor?: { id: string; name?: string },
  ): Promise<void> {
    const changes: string[] = [];
    if (
      oldMatch &&
      matchUpdate.results !== undefined &&
      JSON.stringify(matchUpdate.results) !== JSON.stringify(oldMatch.results)
    ) {
      changes.push(`resultados a [${matchUpdate.results.join(', ')}]`);
    }
    if (
      oldMatch &&
      matchUpdate.success !== undefined &&
      matchUpdate.success !== oldMatch.success
    ) {
      changes.push(`éxito a ${matchUpdate.success ? 'sí' : 'no'}`);
    }
    if (
      oldMatch &&
      matchUpdate.elige8 !== undefined &&
      matchUpdate.elige8 !== oldMatch.elige8
    ) {
      changes.push(
        `elige8 a ${matchUpdate.elige8 ? 'activado' : 'desactivado'}`,
      );
    }
    if (
      oldMatch &&
      matchUpdate.userId !== undefined &&
      matchUpdate.userId !== oldMatch.userId
    ) {
      const oldUserName = oldMatch.user?.name || 'Sin asignar';
      const newUserName = updated.user?.name || 'Sin asignar';
      changes.push(`usuario de ${oldUserName} a ${newUserName}`);
    }

    const changeDescription =
      changes.length > 0 ? ` (${changes.join(', ')})` : '';
    const matchInfo = oldMatch
      ? ` (${oldMatch.homeTeam} vs ${oldMatch.awayTeam})`
      : '';
    const body = actor?.name
      ? `${actor.name} ha actualizado un partido${matchInfo}${changeDescription}`
      : `Se han realizado cambios en un partido${matchInfo}${changeDescription}`;

    await this.notifications.emit({
      type: 'match',
      title: 'Partido actualizado',
      body,
      poolId: updated.futPool.id,
      matchId: updated.id,
      recipientUserIds: [],
      actorId: actor?.id,
      actorName: actor?.name,
      details: matchUpdate as Record<string, unknown>,
    });
  }
}
