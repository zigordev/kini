import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { NotifierService } from 'src/notifications/notifier.service';
import { User } from 'src/users/user.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamMembership } from './entities/team-membership.entity';
import { Team } from './entities/team.entity';

type Actor = Pick<User, 'id' | 'email' | 'name' | 'language'>;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamMembership)
    private readonly membershipsRepository: Repository<TeamMembership>,
    @InjectRepository(FutPool)
    private readonly futPoolsRepository: Repository<FutPool>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notifier: NotifierService,
    private readonly configService: ConfigService,
  ) {}

  async listTeams(actor: Actor): Promise<TeamResponseDto[]> {
    await this.ensureDefaultTeam(actor);
    const memberships = await this.membershipsRepository.find({
      where: { userId: actor.id, status: 'active' },
      relations: { team: true },
      order: { createdAt: 'ASC' },
    });

    return memberships.map((membership) =>
      this.toResponseDto(membership.team, membership.role),
    );
  }

  async createTeam(
    payload: CreateTeamDto,
    actor: Actor,
  ): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.save(
      this.teamsRepository.create({
        name: payload.name.trim(),
        ownerId: actor.id,
      }),
    );

    const membership = await this.membershipsRepository.save(
      this.membershipsRepository.create({
        teamId: team.id,
        userId: actor.id,
        invitedEmail: normalizeEmail(actor.email),
        role: 'admin',
        status: 'active',
        invitedById: actor.id,
        joinedAt: new Date(),
      }),
    );

    return this.toResponseDto(team, membership.role);
  }

  async inviteUser(
    teamId: string,
    email: string,
    actor: Actor,
  ): Promise<{ success: true; message: string }> {
    const team = await this.getTeamOrThrow(teamId);
    await this.assertAdmin(teamId, actor.id);

    const normalizedEmail = normalizeEmail(email);
    const existingMembership = await this.membershipsRepository.findOne({
      where: [
        { teamId, invitedEmail: normalizedEmail, status: 'pending' },
        { teamId, user: { email: normalizedEmail }, status: 'active' },
      ],
    });

    if (!existingMembership) {
      await this.membershipsRepository.save(
        this.membershipsRepository.create({
          teamId,
          userId: null,
          invitedEmail: normalizedEmail,
          role: 'member',
          status: 'pending',
          invitedById: actor.id,
          joinedAt: null,
        }),
      );
    }

    await this.notifier.sendTeamInvitation({
      to: normalizedEmail,
      teamId,
      teamName: team.name,
      inviterEmail: actor.email,
      inviterName: actor.name,
      acceptUrl: this.teamAcceptUrl(teamId),
      locale: actor.language ?? undefined,
    });

    this.logger.log(`User ${normalizedEmail} invited to team ${teamId}`);
    return { success: true, message: 'Invitation sent successfully' };
  }

  async acceptInvitation(
    teamId: string,
    actor: Actor,
  ): Promise<{ success: true; message: string; team: TeamResponseDto }> {
    const team = await this.getTeamOrThrow(teamId);

    const existingActive = await this.membershipsRepository.findOne({
      where: { teamId, userId: actor.id, status: 'active' },
    });
    if (existingActive) {
      return {
        success: true,
        message: 'You are already a member of this team',
        team: this.toResponseDto(team, existingActive.role),
      };
    }

    const pending = await this.membershipsRepository.findOne({
      where: {
        teamId,
        invitedEmail: normalizeEmail(actor.email),
        status: 'pending',
      },
    });

    if (!pending) {
      throw new NotFoundException('Team invitation not found');
    }

    pending.userId = actor.id;
    pending.status = 'active';
    pending.joinedAt = new Date();
    const saved = await this.membershipsRepository.save(pending);

    await this.notifier.notifyTeamInvitationAccepted({
      teamId,
      teamName: team.name,
      userName: actor.name,
      userEmail: actor.email,
    });

    return {
      success: true,
      message: 'You have successfully joined the team',
      team: this.toResponseDto(team, saved.role),
    };
  }

  async assertMember(teamId: string, userId: string): Promise<void> {
    const membership = await this.membershipsRepository.findOne({
      where: { teamId, userId, status: 'active' },
    });

    if (!membership) {
      throw new ForbiddenException('Team membership required');
    }
  }

  async assertAdmin(teamId: string, userId: string): Promise<void> {
    const membership = await this.membershipsRepository.findOne({
      where: { teamId, userId, status: 'active' },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Team admin role required');
    }
  }

  async listActiveMemberUsers(teamId: string): Promise<User[]> {
    const memberships = await this.membershipsRepository.find({
      where: { teamId, status: 'active' },
      relations: { user: true },
      order: { joinedAt: 'ASC', createdAt: 'ASC' },
    });

    return memberships
      .map((membership) => membership.user)
      .filter((user): user is User => Boolean(user?.id));
  }

  private async ensureDefaultTeam(actor: Actor): Promise<void> {
    const count = await this.membershipsRepository.count({
      where: { userId: actor.id, status: 'active' },
    });

    if (count > 0) {
      return;
    }

    const team = await this.createTeam({ name: 'My team' }, actor);
    await this.adoptLegacyPools(team.id, actor.id);
  }

  private async adoptLegacyPools(teamId: string, invitedById: string) {
    const legacyPools = await this.futPoolsRepository.find({
      where: { teamId: IsNull() },
    });

    if (legacyPools.length === 0) {
      return;
    }

    const userIds = new Set<string>();
    for (const pool of legacyPools) {
      for (const match of pool.matches ?? []) {
        if (match.userId) {
          userIds.add(match.userId);
        }
      }
    }

    await this.futPoolsRepository.update({ teamId: IsNull() }, { teamId });

    const users = userIds.size
      ? await this.usersRepository.findBy([...userIds].map((id) => ({ id })))
      : [];

    for (const user of users) {
      const existing = await this.membershipsRepository.findOne({
        where: { teamId, userId: user.id },
      });

      if (existing) {
        continue;
      }

      await this.membershipsRepository.save(
        this.membershipsRepository.create({
          teamId,
          userId: user.id,
          invitedEmail: normalizeEmail(user.email ?? `${user.id}@kini.local`),
          role: 'member',
          status: 'active',
          invitedById,
          joinedAt: new Date(),
        }),
      );
    }

    this.logger.log(
      `Adopted ${legacyPools.length} legacy pools into default team ${teamId}`,
    );
  }

  private async getTeamOrThrow(teamId: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  private teamAcceptUrl(teamId: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:19006';
    return `${frontendUrl.replace(/\/$/, '')}/teams/${teamId}/accept`;
  }

  private toResponseDto(team: Team, role: TeamResponseDto['role']) {
    return {
      id: team.id,
      name: team.name,
      ownerId: team.ownerId,
      role,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}
