import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import { EventsGateway } from '../events/events.gateway';
import { FutPoolMatch, Result } from '../fut-pool-match/entities/fut-pool-match.entity';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { registry } from '../observability';
import { TeamsService } from '../teams/teams.service';
import { AvailablePoolsService } from './available-pools.service';
import { AvailablePool } from './entities/available-pool.entity';

const actor = { id: 'user-1' };
const TEAM_ID = 'team-1';

const repository = () => ({
  find: vi.fn(async () => []),
  findOne: vi.fn(),
  create: vi.fn((entity: unknown) => entity),
  save: vi.fn(async (entity: unknown) => entity),
});

const counted = async (line: string): Promise<number> => {
  const text = await registry.metrics();
  const row = text.split('\n').find((entry) => entry.startsWith(`${line} `));
  return row ? Number(row.slice(line.length + 1)) : 0;
};

const poolActions = (action: string): Promise<number> =>
  counted(`kini_pool_actions_total{action="${action}"}`);

const matchOutcomes = (outcome: string): Promise<number> =>
  counted(`kini_match_results_total{outcome="${outcome}"}`);

describe('AvailablePoolsService', () => {
  let service: AvailablePoolsService;
  let availablePools: ReturnType<typeof repository>;
  let futPools: ReturnType<typeof repository>;
  let matches: ReturnType<typeof repository>;
  let teams: {
    assertMember: ReturnType<typeof vi.fn>;
    listActiveMemberUsers: ReturnType<typeof vi.fn>;
  };
  let events: { emitPoolUpdated: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('no network in unit tests');
      })
    );

    availablePools = repository();
    futPools = repository();
    matches = repository();
    teams = {
      assertMember: vi.fn(async () => undefined),
      listActiveMemberUsers: vi.fn(async () => []),
    };
    events = { emitPoolUpdated: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailablePoolsService,
        { provide: getRepositoryToken(AvailablePool), useValue: availablePools },
        { provide: getRepositoryToken(FutPool), useValue: futPools },
        { provide: getRepositoryToken(FutPoolMatch), useValue: matches },
        {
          provide: ConfigService,
          useValue: { get: vi.fn((_key: string, fallback?: string) => fallback) },
        },
        { provide: TeamsService, useValue: teams },
        { provide: EventsGateway, useValue: events },
      ],
    }).compile();

    service = moduleRef.get(AvailablePoolsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('addToTeam', () => {
    it('counts a pool the team takes up', async () => {
      availablePools.findOne.mockResolvedValue({
        id: 'available-1',
        drawDate: new Date('2026-01-10T00:00:00Z'),
        matches: [],
      });
      futPools.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'pool-1', teamId: TEAM_ID, matches: [] });
      const takenUp = await poolActions('taken_up');

      await service.addToTeam('available-1', TEAM_ID, actor);

      expect(await poolActions('taken_up')).toBe(takenUp + 1);
      expect(events.emitPoolUpdated).toHaveBeenCalled();
    });

    it('counts nothing when the team already has that pool', async () => {
      availablePools.findOne.mockResolvedValue({
        id: 'available-1',
        drawDate: new Date('2026-01-10T00:00:00Z'),
        matches: [],
      });
      futPools.findOne.mockResolvedValue({ id: 'pool-1', teamId: TEAM_ID, matches: [] });
      const takenUp = await poolActions('taken_up');

      await service.addToTeam('available-1', TEAM_ID, actor);

      expect(await poolActions('taken_up')).toBe(takenUp);
      expect(futPools.save).not.toHaveBeenCalled();
    });
  });

  describe('checkTeamPoolResults', () => {
    const teamPool = () => ({ id: 'pool-1', teamId: TEAM_ID, matches: [] });

    it('counts the check and the first verdict of each match, once', async () => {
      const match = {
        poolOrder: 1,
        results: [Result.HOME],
        officialResults: [Result.HOME],
        full15: false,
        success: null as boolean | null,
      };
      const refreshed = { id: 'pool-1', teamId: TEAM_ID, matches: [match] };
      futPools.findOne
        .mockResolvedValueOnce(teamPool())
        .mockResolvedValueOnce(refreshed)
        .mockResolvedValueOnce(teamPool())
        .mockResolvedValueOnce(teamPool())
        .mockResolvedValueOnce(refreshed)
        .mockResolvedValueOnce(teamPool());
      const checked = await poolActions('results_checked');
      const hit = await matchOutcomes('hit');

      await service.checkTeamPoolResults('pool-1', actor);

      expect(match.success).toBe(true);
      expect(await poolActions('results_checked')).toBe(checked + 1);
      expect(await matchOutcomes('hit')).toBe(hit + 1);

      await service.checkTeamPoolResults('pool-1', actor);

      expect(await poolActions('results_checked')).toBe(checked + 2);
      expect(await matchOutcomes('hit')).toBe(hit + 1);
    });

    it('counts nothing when the official results have not arrived', async () => {
      const refreshed = {
        id: 'pool-1',
        teamId: TEAM_ID,
        matches: [{ poolOrder: 1, results: [Result.HOME], officialResults: [], full15: false }],
      };
      futPools.findOne.mockResolvedValueOnce(teamPool()).mockResolvedValueOnce(refreshed);
      const checked = await poolActions('results_checked');

      await expect(service.checkTeamPoolResults('pool-1', actor)).rejects.toThrow(
        /Official results are not available yet/
      );

      expect(await poolActions('results_checked')).toBe(checked);
    });
  });
});
