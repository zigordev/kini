import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import pdf from 'pdf-parse';
import { EventsGateway } from '../events/events.gateway';
import { convertMatchToResponseDto } from '../fut-pool/dto/match-conversion.util';
import { FutPoolResponseDto } from '../fut-pool/dto/fut-pool-response.dto';
import { FutPoolMatch } from '../fut-pool-match/entities/fut-pool-match.entity';
import { FutPool } from '../fut-pool/entities/fut-pool.entity';
import { TeamsService } from '../teams/teams.service';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';
import { AvailablePoolJackpotResponseDto } from './dto/available-pool-jackpot-response.dto';
import { AvailablePoolResponseDto } from './dto/available-pool-response.dto';
import {
  AvailablePool,
  AvailablePoolMatch,
} from './entities/available-pool.entity';
import {
  EduardoLosillaPool,
  extractEduardoLosillaPoolFromJornada,
  extractEduardoLosillaPools,
} from './eduardo-losilla-quiniela.parser';
import {
  extractCompositionMatches,
  extractOfficialResults as extractSelaeOfficialResults,
  extractSelaeDate,
  extractSelaeJackpot,
  extractSelaeJornada,
  htmlToText,
  parseSelaeRss,
  SelaeRssItem,
} from './selae-quiniela.parser';

const PROVIDER = 'eduardo-losilla';
const GAME_TYPE = 'quiniela';

@Injectable()
export class AvailablePoolsService implements OnModuleInit {
  private readonly logger = new Logger(AvailablePoolsService.name);

  constructor(
    @InjectRepository(AvailablePool)
    private readonly availablePools: Repository<AvailablePool>,
    @InjectRepository(FutPool)
    private readonly futPools: Repository<FutPool>,
    @InjectRepository(FutPoolMatch)
    private readonly matches: Repository<FutPoolMatch>,
    private readonly config: ConfigService,
    private readonly teams: TeamsService,
    private readonly events: EventsGateway,
  ) {}

  onModuleInit(): void {
    this.logger.log('Eduardo Losilla Quiniela sync is enabled.');
  }

  async list(): Promise<AvailablePoolResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pools = await this.availablePools.find({
      order: { drawDate: 'ASC', createdAt: 'DESC' },
    });
    return pools
      .filter((pool) => {
        const status = String(pool.status ?? '').toUpperCase();
        const drawDate = new Date(pool.drawDate);
        drawDate.setHours(0, 0, 0, 0);
        const closingDate = pool.closingDate
          ? new Date(pool.closingDate)
          : null;
        const isActive = ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(status);
        const isUpcoming =
          drawDate >= today && (!closingDate || closingDate > new Date());

        return (
          !['CLOSED', 'FINISHED', 'ARCHIVED'].includes(status) &&
          (isActive || isUpcoming)
        );
      })
      .map((pool) => this.toAvailablePoolResponse(pool));
  }

  @Cron('0 8 * * 1', { name: 'sync-available-pools-weekly' })
  async scheduledSync(): Promise<void> {
    if (
      this.config.get<string>('EDUARDO_LOSILLA_SYNC_ENABLED', 'true') ===
      'false'
    ) {
      return;
    }

    try {
      await this.syncUpcomingPools();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Available pool sync failed: ${message}`);
    }
  }

  async syncUpcomingPools(): Promise<AvailablePoolResponseDto[]> {
    await this.migrateLegacyProviderRows();
    await this.syncEduardoLosillaPools();

    return this.list();
  }

  async currentJackpot(): Promise<AvailablePoolJackpotResponseDto> {
    let pools = await this.availablePools.find({
      where: { gameType: GAME_TYPE },
      order: { drawDate: 'ASC', createdAt: 'DESC' },
    });
    if (
      !pools.some(
        (candidate) =>
          candidate.provider === PROVIDER &&
          (candidate.jackpotFormatted ?? candidate.jackpot),
      )
    ) {
      await this.syncUpcomingPools();
      pools = await this.availablePools.find({
        where: { gameType: GAME_TYPE },
        order: { drawDate: 'ASC', createdAt: 'DESC' },
      });
    }
    const providerPools = pools.filter(
      (candidate) => candidate.provider === PROVIDER,
    );
    const candidates = providerPools.length > 0 ? providerPools : pools;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeCandidates = candidates.filter((candidate) =>
      ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(
        String(candidate.status ?? '').toUpperCase(),
      ),
    );
    const upcomingCandidates = activeCandidates.filter(
      (candidate) => new Date(candidate.drawDate).getTime() >= today.getTime(),
    );
    const preferredCandidates =
      upcomingCandidates.length > 0 ? upcomingCandidates : activeCandidates;
    const pool =
      preferredCandidates.find(
        (candidate) => candidate.jackpotFormatted ?? candidate.jackpot,
      ) ??
      preferredCandidates[0] ??
      candidates.find(
        (candidate) => candidate.jackpotFormatted ?? candidate.jackpot,
      ) ??
      candidates[0] ??
      null;

    return {
      jackpotPublished: Boolean(pool?.jackpotFormatted ?? pool?.jackpot),
      jackpot: pool?.jackpot ?? null,
      jackpotFormatted: pool?.jackpotFormatted ?? null,
      drawDate: pool?.drawDate ?? null,
      externalDrawId: pool?.externalDrawId ?? null,
      lastSyncedAt: pool?.lastSyncedAt ?? null,
    };
  }

  async addToTeam(
    availablePoolId: string,
    teamId: string,
    actor: Pick<User, 'id'>,
  ): Promise<FutPoolResponseDto> {
    await this.teams.assertMember(teamId, actor.id);
    const availablePool = await this.availablePools.findOne({
      where: { id: availablePoolId },
    });

    if (!availablePool) {
      throw new NotFoundException('Available pool not found');
    }

    const existing = await this.futPools.findOne({
      where: {
        teamId,
        availablePoolId,
      },
      relations: { availablePool: true, matches: { user: true } },
    });

    if (existing) {
      return this.toFutPoolResponse(existing);
    }

    const sourceMatches =
      availablePool.matches.length > 0
        ? availablePool.matches
        : this.emptyMatches();
    const assignmentOrder = await this.buildRotatedAssignmentOrder(
      teamId,
      sourceMatches.length,
    );

    const pool = await this.futPools.save(
      this.futPools.create({
        teamId,
        availablePoolId,
        doubles: 0,
        triples: 0,
        elige8: false,
        date: availablePool.drawDate,
        active: true,
        cost: 0.75,
        earning: null,
      }),
    );

    for (const [index, source] of sourceMatches.entries()) {
      const assignedUserId = assignmentOrder[index] ?? null;
      await this.matches.save(
        this.matches.create({
          futPoolId: pool.id,
          poolOrder: source.order,
          homeTeam: source.homeTeam || `Local ${source.order}`,
          awayTeam: source.awayTeam || `Visitante ${source.order}`,
          results: [],
          officialResults: (source.officialResults ??
            []) as FutPoolMatch['officialResults'],
          success: null,
          elige8: false,
          full15: Boolean(source.full15) || index === sourceMatches.length - 1,
          userId: assignedUserId,
        }),
      );
    }

    const created = await this.futPools.findOne({
      where: { id: pool.id },
      relations: { availablePool: true, matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });

    this.events.emitPoolUpdated({ poolId: created.id, pool: created });
    return this.toFutPoolResponse(created);
  }

  async updateAvailablePoolMatchResult(
    availablePoolId: string,
    order: number,
    officialResults: string[],
  ): Promise<AvailablePoolResponseDto> {
    const availablePool = await this.availablePools.findOne({
      where: { id: availablePoolId },
    });
    if (!availablePool) {
      throw new NotFoundException('Available pool not found');
    }

    const matches =
      availablePool.matches.length > 0
        ? [...availablePool.matches]
        : this.emptyMatches();
    const index = matches.findIndex((match) => Number(match.order) === order);
    if (index < 0) {
      throw new NotFoundException('Available pool match not found');
    }
    const isFull15 = Boolean(matches[index].full15) || order === 15;
    const normalizedResults = isFull15
      ? [officialResults[0] ?? '', officialResults[1] ?? ''].map((result) => {
          const normalized = String(result).toUpperCase();
          return normalized === '0' ||
            normalized === '1' ||
            normalized === '2' ||
            normalized === 'M'
            ? normalized
            : '';
        })
      : officialResults
          .map((result) => String(result).toUpperCase())
          .filter(
            (result) => result === '1' || result === 'X' || result === '2',
          );

    matches[index] = {
      ...matches[index],
      officialResults: normalizedResults,
    };
    availablePool.matches = matches;
    availablePool.lastSyncedAt = new Date();
    const saved = await this.availablePools.save(availablePool);

    const teamPools = await this.futPools.find({
      where: { availablePoolId },
      relations: { availablePool: true, matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });

    for (const pool of teamPools) {
      let changed = false;
      for (const match of pool.matches ?? []) {
        if (match.poolOrder !== order) {
          continue;
        }
        match.officialResults =
          normalizedResults as FutPoolMatch['officialResults'];
        match.success = this.computeSuccess(
          match.results,
          normalizedResults,
          match.full15,
        );
        await this.matches.save(match);
        changed = true;
      }
      if (changed) {
        this.events.emitPoolUpdated({ poolId: pool.id, pool });
      }
    }

    return this.toAvailablePoolResponse(saved);
  }

  private async buildRotatedAssignmentOrder(
    teamId: string,
    matchCount: number,
  ): Promise<(string | null)[]> {
    const members = await this.teams.listActiveMemberUsers(teamId);
    const memberIds = members.map((member) => member.id).filter(Boolean);
    if (memberIds.length === 0) {
      return Array.from({ length: matchCount }, () => null);
    }

    const latestPool = await this.futPools.findOne({
      where: { teamId },
      relations: { matches: true },
      order: {
        date: 'DESC',
        createdAt: 'DESC',
        matches: { poolOrder: 'ASC' },
      },
    });

    const previousAssignments =
      latestPool?.matches
        ?.slice()
        .sort((a, b) => a.poolOrder - b.poolOrder)
        .map((match) => match.userId)
        .filter((userId): userId is string => Boolean(userId)) ?? [];

    const baseOrder =
      previousAssignments.length > 0 ? previousAssignments : memberIds;
    const rotated =
      baseOrder.length > 1 ? [...baseOrder.slice(1), baseOrder[0]] : baseOrder;

    return Array.from(
      { length: matchCount },
      (_, index) =>
        rotated[index % rotated.length] ?? memberIds[index % memberIds.length],
    );
  }

  async checkTeamPoolResults(
    poolId: string,
    actor: Pick<User, 'id'>,
  ): Promise<FutPoolResponseDto> {
    const pool = await this.futPools.findOne({
      where: { id: poolId },
      relations: { availablePool: true, matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }
    if (!pool.teamId) {
      throw new BadRequestException('Pool is not attached to a team');
    }
    await this.teams.assertMember(pool.teamId, actor.id);

    await this.syncEduardoLosillaPools();
    const refreshed = await this.futPools.findOne({
      where: { id: poolId },
      relations: { availablePool: true, matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });
    const officialResults = [...(refreshed?.matches ?? [])]
      .sort((left, right) => left.poolOrder - right.poolOrder)
      .map((match) => match.officialResults ?? []);

    if (!officialResults.some((results) => results.length > 0)) {
      throw new BadRequestException('Official results are not available yet');
    }

    const sortedMatches = [...(refreshed?.matches ?? [])].sort(
      (a, b) => a.poolOrder - b.poolOrder,
    );

    for (const match of sortedMatches) {
      const nextOfficial = officialResults[match.poolOrder - 1];
      if (!nextOfficial?.length) {
        continue;
      }
      match.officialResults = nextOfficial as FutPoolMatch['officialResults'];
      match.success = this.computeSuccess(
        match.results,
        nextOfficial,
        match.full15,
      );
      await this.matches.save(match);
    }

    const updated = await this.futPools.findOne({
      where: { id: poolId },
      relations: { availablePool: true, matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });
    this.events.emitPoolUpdated({ poolId: updated.id, pool: updated });
    return this.toFutPoolResponse(updated);
  }

  private async migrateLegacyProviderRows(): Promise<void> {
    const pools = await this.availablePools.find({
      where: { gameType: GAME_TYPE },
    });

    for (const pool of pools) {
      if (pool.provider === PROVIDER) {
        continue;
      }
      pool.rawPayload = {
        ...(pool.rawPayload ?? {}),
        eduardoLosilla: {
          migratedFrom: pool.provider,
          migratedAt: new Date().toISOString(),
        },
      };
      pool.provider = PROVIDER;
      await this.availablePools.save(pool);
    }
  }

  private async syncEduardoLosillaPools(): Promise<void> {
    const urls = [
      this.config.get<string>(
        'EDUARDO_LOSILLA_QUINIELA_TICKET_URL',
        'https://www.eduardolosilla.es/quiniela/boletos',
      ),
      this.config.get<string>(
        'EDUARDO_LOSILLA_QUINIELA_RESULTS_URL',
        'https://www.eduardolosilla.es/quiniela/ayudas/escrutinio',
      ),
    ];
    const seenJornadas = new Map<number, number | null>();

    for (const value of urls) {
      try {
        const sourceUrl = new URL(value);
        if (!this.isEduardoLosillaUrl(sourceUrl)) {
          throw new BadRequestException(
            'Eduardo Losilla source URL must use the public eduardolosilla.es domain',
          );
        }
        const pools = extractEduardoLosillaPools(
          await this.fetchEduardoLosillaText(sourceUrl),
        );
        for (const source of pools) {
          if (seenJornadas.has(source.jornada)) {
            continue;
          }
          seenJornadas.set(source.jornada, source.season);
          await this.upsertEduardoLosillaPool(source, sourceUrl.toString());
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Eduardo Losilla sync failed for ${value}: ${message}`,
        );
      }
    }

    await this.syncEduardoLosillaJornadaApiPools(seenJornadas);
  }

  private async syncEduardoLosillaJornadaApiPools(
    seenJornadas: Map<number, number | null>,
  ): Promise<void> {
    const candidates = new Map(seenJornadas);
    const existing = await this.availablePools.find({
      where: { provider: PROVIDER, gameType: GAME_TYPE },
    });

    for (const pool of existing) {
      const jornada = this.extractJornadaNumber(pool.externalDrawId);
      if (!jornada) {
        continue;
      }
      const season = this.extractEduardoLosillaSeason(pool);
      candidates.set(jornada, season ?? candidates.get(jornada) ?? null);
    }

    const sortedJornadas = [...candidates.keys()].sort(
      (left, right) => left - right,
    );
    if (sortedJornadas.length >= 2) {
      const first = sortedJornadas[0];
      const last = sortedJornadas[sortedJornadas.length - 1];
      if (last - first <= 6) {
        const fallbackSeason =
          candidates.get(last) ?? candidates.get(first) ?? null;
        for (let jornada = first; jornada <= last; jornada += 1) {
          candidates.set(jornada, candidates.get(jornada) ?? fallbackSeason);
        }
      }
    }

    for (const [jornada, season] of [...candidates.entries()].sort(
      ([left], [right]) => left - right,
    )) {
      try {
        const url = new URL('https://api.eduardolosilla.es/jornada');
        url.searchParams.set('jornada', String(jornada));
        if (season) {
          url.searchParams.set('temporada', String(season));
        }
        const source = extractEduardoLosillaPoolFromJornada(
          JSON.parse(await this.fetchEduardoLosillaText(url)),
        );
        if (source) {
          await this.upsertEduardoLosillaPool(source, url.toString());
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Eduardo Losilla jornada API sync failed for jornada ${jornada}: ${message}`,
        );
      }
    }
  }

  private async upsertEduardoLosillaPool(
    source: EduardoLosillaPool,
    sourceUrl: string,
  ): Promise<void> {
    const existing = await this.findEduardoLosillaPool(source.jornada);
    const now = new Date();
    const status = source.completed
      ? 'COMPLETED'
      : source.closingDate && source.closingDate <= now
        ? 'ACTIVE'
        : 'OPEN';
    const pool = this.availablePools.create({
      id: existing?.id,
      provider: PROVIDER,
      gameType: GAME_TYPE,
      externalDrawId: `jornada-${source.jornada}`,
      name: 'La Quiniela',
      drawDate: source.drawDate,
      closingDate: source.closingDate,
      status,
      jackpot: source.jackpot,
      jackpotFormatted: source.jackpotFormatted,
      matches: source.matches,
      rawPayload: {
        ...(existing?.rawPayload ?? {}),
        eduardoLosilla: {
          jornada: source.jornada,
          season: source.season,
          sourceUrl,
          syncedAt: now.toISOString(),
        },
      },
      lastSyncedAt: now,
    });
    const saved = await this.availablePools.save(pool);

    if (source.matches.some((match) => match.officialResults?.length)) {
      await this.applyEduardoLosillaOfficialResults(saved);
    }
  }

  private async applyEduardoLosillaOfficialResults(
    availablePool: AvailablePool,
  ): Promise<void> {
    const officialResults = [...availablePool.matches]
      .sort((left, right) => left.order - right.order)
      .map((match) => match.officialResults ?? []);
    if (!officialResults.some((result) => result.length > 0)) {
      return;
    }

    const teamPools = await this.futPools.find({
      where: { availablePoolId: availablePool.id },
      relations: { matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });
    for (const teamPool of teamPools) {
      let changed = false;
      for (const match of teamPool.matches ?? []) {
        const results = officialResults[match.poolOrder - 1];
        if (!results?.length) {
          continue;
        }
        match.officialResults = results as FutPoolMatch['officialResults'];
        match.success = this.computeSuccess(
          match.results,
          results,
          match.full15,
        );
        await this.matches.save(match);
        changed = true;
      }
      if (changed) {
        this.events.emitPoolUpdated({ poolId: teamPool.id, pool: teamPool });
      }
    }
  }

  private async findEduardoLosillaPool(
    jornada: number,
  ): Promise<AvailablePool | null> {
    return this.availablePools.findOne({
      where: {
        provider: PROVIDER,
        gameType: GAME_TYPE,
        externalDrawId: `jornada-${jornada}`,
      },
    });
  }

  private extractJornadaNumber(
    value: string | null | undefined,
  ): number | null {
    const match = String(value ?? '').match(/jornada-(\d+)/i);
    if (!match) {
      return null;
    }
    const jornada = Number(match[1]);
    return Number.isFinite(jornada) ? jornada : null;
  }

  private extractEduardoLosillaSeason(pool: AvailablePool): number | null {
    const metadata = (pool.rawPayload as Record<string, unknown> | null)
      ?.eduardoLosilla as Record<string, unknown> | undefined;
    const season = metadata?.season;
    return typeof season === 'number' && Number.isFinite(season)
      ? season
      : null;
  }

  private isEduardoLosillaUrl(url: URL): boolean {
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'eduardolosilla.es' ||
        url.hostname === 'www.eduardolosilla.es')
    );
  }

  private async fetchEduardoLosillaText(url: URL): Promise<string> {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json,text/html,application/xhtml+xml',
        'User-Agent': 'Kini/0.1 (+https://github.com/zigordev/kini)',
      },
    });
    if (!response.ok) {
      throw new BadRequestException(
        `Eduardo Losilla request failed with ${response.status}`,
      );
    }
    return response.text();
  }

  private async syncSelaeCompositionDocuments(): Promise<void> {
    const noticesUrl = new URL(
      this.config.get<string>(
        'SELAE_QUINIELA_NOTICES_URL',
        'https://www.loteriasyapuestas.es/es/avisos-de-interes',
      ),
    );

    try {
      const noticesHtml = await this.fetchSelaeText(noticesUrl);
      const documentUrls = await this.findSelaeCompositionDocuments(
        noticesHtml,
        noticesUrl,
      );
      if (documentUrls.length === 0) {
        this.logger.warn('SELAE returned no Quiniela composition documents');
        return;
      }

      for (const documentUrl of documentUrls.slice(0, 6)) {
        try {
          const documentText = await this.fetchSelaePdfText(documentUrl);
          const jornada = extractSelaeJornada(documentText);
          const drawDate = extractSelaeDate(documentText);
          const matches = extractCompositionMatches(documentText);
          if (!drawDate || matches.length < 14) {
            this.logger.warn(
              `SELAE composition document could not be mapped: ${documentUrl.toString()}`,
            );
            continue;
          }

          await this.upsertSelaePool({
            jornada,
            drawDate,
            matches,
            sourceUrl: documentUrl.toString(),
            sourceType: 'composition-document',
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `SELAE composition document sync failed for ${documentUrl.toString()}: ${message}`,
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SELAE notices sync failed: ${message}`);
    }
  }

  private async syncSelaeJackpots(): Promise<void> {
    const feedUrl = new URL(
      this.config.get<string>(
        'SELAE_QUINIELA_JACKPOT_RSS_URL',
        'https://www.loteriasyapuestas.es/es/la-quiniela/botes/.formatoRSS',
      ),
    );

    try {
      const items = parseSelaeRss(await this.fetchSelaeText(feedUrl));
      if (items.length === 0) {
        this.logger.warn(
          `SELAE jackpot RSS returned no items: ${feedUrl.toString()}`,
        );
        return;
      }
      const jackpots = items
        .map((item) => ({ item, jackpot: extractSelaeJackpot(item) }))
        .filter(
          (
            entry,
          ): entry is {
            item: SelaeRssItem;
            jackpot: NonNullable<ReturnType<typeof extractSelaeJackpot>>;
          } => entry.jackpot !== null,
        );

      for (const { item, jackpot } of jackpots.slice(0, 3)) {
        const pool = await this.findSelaePool(
          jackpot.jornada,
          jackpot.drawDate,
        );
        if (!pool) {
          if (!jackpot.drawDate) {
            continue;
          }
          await this.upsertSelaePool({
            jornada: jackpot.jornada,
            drawDate: jackpot.drawDate,
            matches: [],
            sourceUrl: item.link ?? feedUrl.toString(),
            sourceType: 'jackpot-rss',
            jackpot: jackpot.value,
            jackpotFormatted: jackpot.formatted,
          });
          continue;
        }

        pool.jackpot = jackpot.value;
        pool.jackpotFormatted = jackpot.formatted;
        pool.rawPayload = this.withSelaeMetadata(pool, {
          jornada: jackpot.jornada ?? this.selaeJornada(pool),
          jackpotSourceUrl: item.link ?? feedUrl.toString(),
          jackpotSyncedAt: new Date().toISOString(),
        });
        pool.lastSyncedAt = new Date();
        await this.availablePools.save(pool);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SELAE jackpot RSS sync failed: ${message}`);
    }
  }

  private async syncSelaeResults(): Promise<void> {
    const feedUrl = new URL(
      this.config.get<string>(
        'SELAE_QUINIELA_RESULTS_RSS_URL',
        'https://www.loteriasyapuestas.es/es/la-quiniela/resultados/.formatoRSS',
      ),
    );

    try {
      const items = parseSelaeRss(await this.fetchSelaeText(feedUrl));
      if (items.length === 0) {
        this.logger.warn(
          `SELAE results RSS returned no items: ${feedUrl.toString()}`,
        );
        return;
      }
      for (const item of items.slice(0, 8)) {
        try {
          const resultUrl = item.link ? this.selaeUrl(item.link) : null;
          const resultText = resultUrl
            ? await this.fetchSelaeText(resultUrl)
            : item.description;
          const officialResults = extractSelaeOfficialResults(resultText);
          if (officialResults.length < 14) {
            continue;
          }

          const source = `${item.title}\n${item.description}\n${resultText}`;
          const targetPool = await this.findSelaePool(
            extractSelaeJornada(source),
            extractSelaeDate(source) ?? item.publishedAt,
          );
          if (!targetPool) {
            continue;
          }

          await this.applySelaeOfficialResults(
            targetPool,
            officialResults,
            item,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(`SELAE result item sync failed: ${message}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SELAE results RSS sync failed: ${message}`);
    }
  }

  private async upsertSelaePool(input: {
    jornada: number | null;
    drawDate: Date;
    matches: AvailablePoolMatch[];
    sourceUrl: string;
    sourceType: string;
    jackpot?: string | null;
    jackpotFormatted?: string | null;
  }): Promise<AvailablePool> {
    const existing = await this.findSelaePool(input.jornada, input.drawDate);
    const externalDrawId =
      input.jornada !== null
        ? `jornada-${input.jornada}`
        : `date-${this.toIsoDate(input.drawDate)}`;
    const isUpcoming = input.drawDate >= this.startOfToday();
    const pool = this.availablePools.create({
      id: existing?.id,
      provider: PROVIDER,
      gameType: GAME_TYPE,
      externalDrawId,
      name: 'La Quiniela',
      drawDate: input.drawDate,
      closingDate: existing?.closingDate ?? null,
      status: isUpcoming ? 'OPEN' : (existing?.status ?? 'COMPLETED'),
      jackpot: input.jackpot ?? existing?.jackpot ?? null,
      jackpotFormatted:
        input.jackpotFormatted ?? existing?.jackpotFormatted ?? null,
      matches:
        input.matches.length > 0 ? input.matches : (existing?.matches ?? []),
      rawPayload: this.withSelaeMetadata(existing, {
        jornada: input.jornada,
        [`${input.sourceType}Url`]: input.sourceUrl,
        [`${input.sourceType}SyncedAt`]: new Date().toISOString(),
      }),
      lastSyncedAt: new Date(),
    });
    return this.availablePools.save(pool);
  }

  private async applySelaeOfficialResults(
    availablePool: AvailablePool,
    officialResults: string[][],
    item: SelaeRssItem,
  ): Promise<void> {
    const currentMatches =
      availablePool.matches.length > 0
        ? [...availablePool.matches]
        : this.emptyMatches();
    availablePool.matches = currentMatches.map((match, index) => ({
      ...match,
      officialResults: officialResults[index] ?? match.officialResults ?? [],
    }));
    availablePool.status = 'COMPLETED';
    availablePool.rawPayload = this.withSelaeMetadata(availablePool, {
      resultSourceUrl: item.link,
      resultSyncedAt: new Date().toISOString(),
    });
    availablePool.lastSyncedAt = new Date();
    await this.availablePools.save(availablePool);

    const teamPools = await this.futPools.find({
      where: { availablePoolId: availablePool.id },
      relations: { matches: { user: true } },
      order: { matches: { poolOrder: 'ASC' } },
    });
    for (const teamPool of teamPools) {
      for (const match of teamPool.matches ?? []) {
        const results = officialResults[match.poolOrder - 1];
        if (!results?.length) {
          continue;
        }
        match.officialResults = results as FutPoolMatch['officialResults'];
        match.success = this.computeSuccess(
          match.results,
          results,
          match.full15,
        );
        await this.matches.save(match);
      }
      this.events.emitPoolUpdated({ poolId: teamPool.id, pool: teamPool });
    }
  }

  private computeSuccess(
    userResults: unknown,
    officialResults: string[],
    full15: boolean,
  ): boolean | null {
    const official = full15
      ? officialResults.map((value) => String(value).toUpperCase())
      : officialResults
          .map((value) => String(value).toUpperCase())
          .filter(Boolean);

    if (full15 && official.filter(Boolean).length < 2) {
      return null;
    }
    if (!official.length) {
      return null;
    }
    const selected = Array.isArray(userResults)
      ? userResults.map((value) => String(value).toUpperCase())
      : [];
    if (selected.length === 0) {
      return false;
    }
    if (full15) {
      return (
        selected.length === official.length &&
        selected.every((value, index) => value === official[index])
      );
    }
    return selected.includes(official[0]);
  }

  private async findSelaeCompositionDocuments(
    noticesHtml: string,
    noticesUrl: URL,
  ): Promise<URL[]> {
    const directDocuments = this.extractSelaeLinks(
      noticesHtml,
      noticesUrl,
      true,
    );
    const detailPages = this.extractSelaeLinks(noticesHtml, noticesUrl, false);
    const discoveredDocuments = [...directDocuments];

    for (const detailUrl of detailPages.slice(0, 8)) {
      try {
        const detailHtml = await this.fetchSelaeText(detailUrl);
        discoveredDocuments.push(
          ...this.extractSelaeLinks(detailHtml, detailUrl, true),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `SELAE notice detail fetch failed for ${detailUrl.toString()}: ${message}`,
        );
      }
    }

    return Array.from(
      new Map(discoveredDocuments.map((url) => [url.toString(), url])).values(),
    );
  }

  private extractSelaeLinks(
    html: string,
    baseUrl: URL,
    documentsOnly: boolean,
  ): URL[] {
    const links: URL[] = [];
    const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match = pattern.exec(html);
    while (match) {
      const href = match[1].replace(/&amp;/g, '&').trim();
      const label = htmlToText(match[2]);
      const isDocument = /\.pdf(?:[?#]|$)/i.test(href);
      const isQuinielaNotice = /quiniela|composici[oó]n|boletos?|jornada/i.test(
        `${label} ${href}`,
      );
      if (
        (documentsOnly && isDocument) ||
        (!documentsOnly && !isDocument && isQuinielaNotice)
      ) {
        try {
          const url = new URL(href, baseUrl);
          if (this.isSelaeUrl(url)) {
            links.push(url);
          }
        } catch {
          // Ignore malformed third-party links in the SELAE page.
        }
      }
      match = pattern.exec(html);
    }
    return links;
  }

  private selaeUrl(value: string): URL | null {
    try {
      const url = new URL(value);
      return this.isSelaeUrl(url) ? url : null;
    } catch {
      return null;
    }
  }

  private isSelaeUrl(url: URL): boolean {
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'loteriasyapuestas.es' ||
        url.hostname === 'www.loteriasyapuestas.es')
    );
  }

  private async findSelaePool(
    jornada: number | null,
    drawDate: Date | null,
  ): Promise<AvailablePool | null> {
    const pools = await this.availablePools.find({
      where: { gameType: GAME_TYPE },
      order: { drawDate: 'ASC', createdAt: 'DESC' },
    });
    const date = drawDate ? this.toIsoDate(drawDate) : null;
    return (
      pools.find((pool) => {
        if (jornada !== null && this.selaeJornada(pool) === jornada) {
          return true;
        }
        return date !== null && this.toIsoDate(pool.drawDate) === date;
      }) ?? null
    );
  }

  private selaeMetadata(pool?: AvailablePool): Record<string, unknown> | null {
    const raw = pool?.rawPayload;
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const metadata = (raw as Record<string, unknown>).selae;
    return metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : null;
  }

  private selaeJornada(pool: AvailablePool): number | null {
    const selaeJornada = this.selaeMetadata(pool)?.jornada;
    if (typeof selaeJornada === 'number') {
      return selaeJornada;
    }
    const legacyMetadata = (pool.rawPayload as Record<string, unknown> | null)
      ?.metadata as Record<string, unknown> | undefined;
    if (typeof legacyMetadata?.jornada === 'number') {
      return legacyMetadata.jornada;
    }
    const externalId = pool.externalDrawId.match(/^jornada-(\d+)$/);
    return externalId ? Number(externalId[1]) : null;
  }

  private withSelaeMetadata(
    pool: AvailablePool | undefined,
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...(pool?.rawPayload ?? {}),
      selae: {
        ...(this.selaeMetadata(pool) ?? {}),
        ...metadata,
      },
    };
  }

  private emptyMatches(): AvailablePoolMatch[] {
    return Array.from({ length: 15 }, (_, index) => ({
      order: index + 1,
      homeTeam: '',
      awayTeam: '',
      full15: index === 14,
    }));
  }

  private async fetchSelaeText(url: URL): Promise<string> {
    const response = await fetch(url, {
      headers: {
        Accept:
          'application/rss+xml, application/xml, text/xml, text/html;q=0.9',
        'User-Agent': 'Kini/0.1 (+https://github.com/zigordev/kini)',
      },
    });

    if (!response.ok) {
      throw new BadRequestException(
        `SELAE request failed with ${response.status}`,
      );
    }

    return response.text();
  }

  private async fetchSelaePdfText(url: URL): Promise<string> {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/pdf',
        'User-Agent': 'Kini/0.1 (+https://github.com/zigordev/kini)',
      },
    });
    if (!response.ok) {
      throw new BadRequestException(
        `SELAE PDF request failed with ${response.status}`,
      );
    }
    const document = await pdf(Buffer.from(await response.arrayBuffer()));
    return document.text;
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private toIsoDate(value: Date | string): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
  }

  private toAvailablePoolResponse(
    pool: AvailablePool,
  ): AvailablePoolResponseDto {
    return {
      id: pool.id,
      provider: pool.provider,
      gameType: pool.gameType,
      externalDrawId: pool.externalDrawId,
      name: pool.name,
      drawDate: pool.drawDate,
      closingDate: pool.closingDate,
      status: pool.status,
      jackpot: pool.jackpot,
      jackpotFormatted: pool.jackpotFormatted,
      matches: pool.matches ?? [],
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }

  private toFutPoolResponse(pool: FutPool): FutPoolResponseDto {
    return {
      id: pool.id,
      name: pool.name,
      availablePoolId: pool.availablePoolId,
      doubles: pool.doubles,
      triples: pool.triples,
      elige8: pool.elige8,
      date: pool.date,
      active: pool.active,
      status: this.getFutPoolStatus(pool),
      cost: pool.cost,
      earning: pool.earning,
      teamId: pool.teamId,
      matches: pool.matches?.map(convertMatchToResponseDto) ?? [],
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }

  private getFutPoolStatus(pool: FutPool): 'programmed' | 'active' | 'closed' {
    if (!pool.active) {
      return 'closed';
    }

    const deadline = new Date(pool.availablePool?.closingDate ?? pool.date);
    if (!pool.availablePool?.closingDate) {
      deadline.setHours(23, 59, 59, 999);
    }
    const deadlineTime = deadline.getTime();

    return Number.isFinite(deadlineTime) && deadlineTime <= Date.now()
      ? 'active'
      : 'programmed';
  }
}
