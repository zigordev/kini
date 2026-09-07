import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { NotifierService } from 'src/notifications/notifier.service';
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

describe('TeamsService', () => {
  let service: TeamsService;
  let teams: ReturnType<typeof repository>;
  let memberships: ReturnType<typeof repository>;
  let notifier: {
    sendTeamInvitation: ReturnType<typeof vi.fn>;
    notifyTeamInvitationAccepted: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    teams = repository();
    memberships = repository();
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
        { provide: getRepositoryToken(FutPool), useValue: repository() },
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

      await expect(
        service.inviteUser(team.id, 'friend@example.com', actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
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
        }),
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
        }),
      );
    });
  });

  describe('acceptInvitation', () => {
    it('is a 404 when nothing was pending for the actor', async () => {
      memberships.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.acceptInvitation(team.id, actor),
      ).rejects.toBeInstanceOf(NotFoundException);
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
      memberships.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(pending);

      const result = await service.acceptInvitation(team.id, actor);

      expect(memberships.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: actor.id,
          status: 'active',
          joinedAt: expect.any(Date),
        }),
      );
      expect(notifier.notifyTeamInvitationAccepted).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: team.id, userEmail: actor.email }),
      );
      expect(result.team.role).toBe('member');
    });
  });
});
