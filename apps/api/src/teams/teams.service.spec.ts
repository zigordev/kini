import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { NotifierService } from 'src/notifications/notifier.service';
import { registry } from 'src/observability';
import { User } from 'src/users/user.entity';
import { vi } from 'vitest';
import { TeamMembership } from './entities/team-membership.entity';
import { Team } from './entities/team.entity';
import { TeamsService } from './teams.service';

const actor = {
  id: 'user-1',
  email: 'owner@example.com',
  name: 'Owner',
  language: 'en',
};

const team = {
  id: 'team-1',
  name: 'Saturday pool',
  ownerId: 'user-1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const repository = () => ({
  find: vi.fn(),
  findOne: vi.fn(),
  findBy: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  create: vi.fn((entity: unknown) => entity),
  save: vi.fn(async (entity: unknown) => entity),
});

const teamActions = async (action: string): Promise<number> => {
  const line = `kini_team_actions_total{action="${action}"}`;
  const text = await registry.metrics();
  const row = text.split('\n').find((entry) => entry.startsWith(`${line} `));
  return row ? Number(row.slice(line.length + 1)) : 0;
};

describe('TeamsService', () => {
  let service: TeamsService;
  let teams: ReturnType<typeof repository>;
  let memberships: ReturnType<typeof repository>;
  let futPools: ReturnType<typeof repository>;
  let notifier: {
    sendTeamInvitation: ReturnType<typeof vi.fn>;
    notifyTeamInvitationAccepted: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    teams = repository();
    memberships = repository();
    futPools = repository();
    notifier = {
      sendTeamInvitation: vi.fn().mockResolvedValue(undefined),
      notifyTeamInvitationAccepted: vi.fn().mockResolvedValue(undefined),
    };
    teams.findOne.mockResolvedValue(team);

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: teams },
        { provide: getRepositoryToken(TeamMembership), useValue: memberships },
        { provide: getRepositoryToken(FutPool), useValue: futPools },
        { provide: getRepositoryToken(User), useValue: repository() },
        { provide: NotifierService, useValue: notifier },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('https://kini.example.com/'),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TeamsService);
  });

  describe('inviteUser', () => {
    it('needs an active admin membership, not just any membership', async () => {
      memberships.findOne.mockResolvedValueOnce({
        teamId: team.id,
        userId: actor.id,
        role: 'member',
        status: 'active',
      });

      await expect(service.inviteUser(team.id, 'friend@example.com', actor)).rejects.toBeInstanceOf(
        ForbiddenException
      );
      expect(memberships.save).not.toHaveBeenCalled();
      expect(notifier.sendTeamInvitation).not.toHaveBeenCalled();
    });

    it('normalises the address, keeps one pending invitation per address, and still resends the email', async () => {
      memberships.findOne
        .mockResolvedValueOnce({
          teamId: team.id,
          userId: actor.id,
          role: 'admin',
          status: 'active',
        })
        .mockResolvedValueOnce({
          teamId: team.id,
          invitedEmail: 'friend@example.com',
          status: 'pending',
        });

      await service.inviteUser(team.id, '  Friend@Example.com ', actor);

      expect(memberships.save).not.toHaveBeenCalled();
      expect(notifier.sendTeamInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'friend@example.com',
          teamId: team.id,
          acceptUrl: 'https://kini.example.com/teams/team-1/accept',
        })
      );
    });

    it('records a first invitation as pending, owned by nobody yet', async () => {
      memberships.findOne
        .mockResolvedValueOnce({
          teamId: team.id,
          userId: actor.id,
          role: 'admin',
          status: 'active',
        })
        .mockResolvedValueOnce(null);

      await service.inviteUser(team.id, 'friend@example.com', actor);

      expect(memberships.save).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: team.id,
          userId: null,
          invitedEmail: 'friend@example.com',
          role: 'member',
          status: 'pending',
          invitedById: actor.id,
        })
      );
    });
  });

  describe('acceptInvitation', () => {
    it('is a 404 when nothing was pending for the actor', async () => {
      memberships.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(service.acceptInvitation(team.id, actor)).rejects.toBeInstanceOf(
        NotFoundException
      );
      expect(memberships.save).not.toHaveBeenCalled();
    });

    it('is idempotent for an existing member and does not notify the team again', async () => {
      memberships.findOne.mockResolvedValueOnce({
        teamId: team.id,
        userId: actor.id,
        role: 'member',
        status: 'active',
      });

      const result = await service.acceptInvitation(team.id, actor);

      expect(result.team).toMatchObject({ id: team.id, role: 'member' });
      expect(memberships.save).not.toHaveBeenCalled();
      expect(notifier.notifyTeamInvitationAccepted).not.toHaveBeenCalled();
    });

    it('activates the pending row under the actor and tells the team', async () => {
      const pending = {
        teamId: team.id,
        userId: null as string | null,
        invitedEmail: 'owner@example.com',
        role: 'member',
        status: 'pending',
        joinedAt: null as Date | null,
      };
      memberships.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(pending);

      const result = await service.acceptInvitation(team.id, actor);

      expect(memberships.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: actor.id,
          status: 'active',
          joinedAt: expect.any(Date),
        })
      );
      expect(notifier.notifyTeamInvitationAccepted).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: team.id, userEmail: actor.email })
      );
      expect(result.team.role).toBe('member');
    });
  });

  describe('counters', () => {
    it('counts a team a player asked for, and not as a default team', async () => {
      const created = await teamActions('created');
      const defaultCreated = await teamActions('default_created');

      await service.createTeam({ name: 'Saturday pool' }, actor);

      expect(await teamActions('created')).toBe(created + 1);
      expect(await teamActions('default_created')).toBe(defaultCreated);
    });

    it('counts the team provisioned for a player who has none, and not as a create', async () => {
      memberships.count.mockResolvedValue(0);
      memberships.find.mockResolvedValue([]);
      futPools.find.mockResolvedValue([]);
      const created = await teamActions('created');
      const defaultCreated = await teamActions('default_created');

      await service.listTeams(actor);

      expect(await teamActions('default_created')).toBe(defaultCreated + 1);
      expect(await teamActions('created')).toBe(created);
    });

    it('counts an invitation once it has been handed to notifications', async () => {
      memberships.findOne
        .mockResolvedValueOnce({
          teamId: team.id,
          userId: actor.id,
          role: 'admin',
          status: 'active',
        })
        .mockResolvedValueOnce(null);
      const sent = await teamActions('invitation_sent');

      await service.inviteUser(team.id, 'friend@example.com', actor);

      expect(await teamActions('invitation_sent')).toBe(sent + 1);
    });

    it('counts and logs an accepted invitation, and nothing else', async () => {
      const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
      memberships.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        teamId: team.id,
        userId: null as string | null,
        invitedEmail: 'owner@example.com',
        role: 'member',
        status: 'pending',
      });
      const accepted = await teamActions('invitation_accepted');
      const alreadyMember = await teamActions('invitation_already_member');

      await service.acceptInvitation(team.id, actor);

      expect(await teamActions('invitation_accepted')).toBe(accepted + 1);
      expect(await teamActions('invitation_already_member')).toBe(alreadyMember);
      expect(log).toHaveBeenCalledWith({ event: 'team.invitation_accepted', teamId: team.id });
      log.mockRestore();
    });

    it('counts a second accept from a member as already a member, not as an accept', async () => {
      memberships.findOne.mockResolvedValueOnce({
        teamId: team.id,
        userId: actor.id,
        role: 'member',
        status: 'active',
      });
      const accepted = await teamActions('invitation_accepted');
      const alreadyMember = await teamActions('invitation_already_member');

      await service.acceptInvitation(team.id, actor);

      expect(await teamActions('invitation_already_member')).toBe(alreadyMember + 1);
      expect(await teamActions('invitation_accepted')).toBe(accepted);
    });

    it('counts an accept with nothing pending as a failure', async () => {
      memberships.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      const failed = await teamActions('invitation_accept_failed');
      const accepted = await teamActions('invitation_accepted');

      await expect(service.acceptInvitation(team.id, actor)).rejects.toBeInstanceOf(
        NotFoundException
      );

      expect(await teamActions('invitation_accept_failed')).toBe(failed + 1);
      expect(await teamActions('invitation_accepted')).toBe(accepted);
    });
  });
});
