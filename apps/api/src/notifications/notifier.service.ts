import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UpdateFutPoolMatchDto } from 'src/fut-pool-match/dto/update-fut-pool-match.dto';
import { FutPoolMatch } from 'src/fut-pool-match/entities/fut-pool-match.entity';
import { CreateFutPoolDto } from 'src/fut-pool/dto/create-fut-pool.dto';
import { UpdateFutPoolDto } from 'src/fut-pool/dto/update-fut-pool.dto';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { EmailNotificationPublisher } from './email-notification.publisher';
import { NotificationProducer } from './notification.producer';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    private readonly notifications: NotificationProducer,
    private readonly emailNotifications: EmailNotificationPublisher,
    private readonly configService: ConfigService,
  ) {}

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
      changes.push(`E8 ${payload.elige8 ? 'activado' : 'desactivado'}`);
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
      changes.push(`E8 ${matchUpdate.elige8 ? 'activado' : 'desactivado'}`);
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

  async notifyPoolPredictionsCompleted(data: {
    poolId: string;
    poolDate?: Date | string;
    teamId: string;
    teamName?: string;
    recipientUserIds: string[];
    actor?: { id: string; name?: string };
  }): Promise<void> {
    const poolUrl = `${this.frontendUrl()}/pools?poolId=${encodeURIComponent(
      data.poolId,
    )}`;
    const formattedDate = data.poolDate
      ? new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(data.poolDate))
      : '';
    const title = 'Quiniela completada';
    const body = formattedDate
      ? `Las 15 predicciones de la quiniela ${formattedDate} están completadas`
      : 'Las 15 predicciones de la quiniela están completadas';

    await this.notifications.emit({
      type: 'pool',
      title,
      body,
      teamId: data.teamId,
      poolId: data.poolId,
      recipientUserIds: data.recipientUserIds,
      actorId: data.actor?.id,
      actorName: data.actor?.name,
      details: {
        teamName: data.teamName,
        poolUrl,
      },
    });
  }

  async sendTeamInvitation(data: {
    to: string;
    teamId: string;
    teamName: string;
    inviterEmail: string;
    inviterName?: string;
    acceptUrl: string;
    locale?: string;
  }): Promise<void> {
    this.logger.log(
      `Team invitation requested for ${data.to} to ${data.teamName}. Accept URL: ${data.acceptUrl}`,
    );

    await this.notifications.emit({
      type: 'team',
      title: 'Invitación a equipo',
      body: `${data.inviterName ?? data.inviterEmail} te ha invitado a ${data.teamName}`,
      teamId: data.teamId,
      recipientUserIds: [],
      actorName: data.inviterName,
      details: {
        to: data.to,
        teamName: data.teamName,
        inviterEmail: data.inviterEmail,
        acceptUrl: data.acceptUrl,
        locale: data.locale,
      },
    });

    await this.emailNotifications.publishEmail(
      this.emailNotifications.buildTeamInvitationEvent(data),
    );
  }

  async notifyTeamInvitationAccepted(data: {
    teamId: string;
    teamName: string;
    userName?: string;
    userEmail: string;
  }): Promise<void> {
    await this.notifications.emit({
      type: 'team',
      title: 'Invitación aceptada',
      body: `${data.userName ?? data.userEmail} se ha unido a ${data.teamName}`,
      teamId: data.teamId,
      recipientUserIds: [],
      actorName: data.userName,
      details: {
        teamName: data.teamName,
        userEmail: data.userEmail,
      },
    });
  }

  private frontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3013'
    ).replace(/\/$/, '');
  }
}
