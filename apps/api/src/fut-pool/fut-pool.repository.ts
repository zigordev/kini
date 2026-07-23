import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FutPoolMatch } from 'src/fut-pool-match/entities/fut-pool-match.entity';
import { User } from 'src/users/user.entity';
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { CreateFutPoolDto } from './dto/create-fut-pool.dto';
import { FutPoolQueryDto } from './dto/fut-pool-query.dto';
import {
  FutPoolPaginatedResponseDto,
  FutPoolResponseDto,
} from './dto/fut-pool-response.dto';
import { convertMatchToResponseDto } from './dto/match-conversion.util';
import { ResultCombinationStatDto, StatsDto } from './dto/stats.dto';
import { UpdateFutPoolDto } from './dto/update-fut-pool.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { FutPool } from './entities/fut-pool.entity';

interface LoadedPoolsResult {
  items: FutPool[];
  total: number;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class FutPoolRepository {
  constructor(
    @InjectRepository(FutPool)
    private readonly repository: Repository<FutPool>,
  ) {}

  async findAll(query: FutPoolQueryDto): Promise<FutPoolPaginatedResponseDto> {
    const { items, total, page, limit, sortBy, sortOrder } =
      await this.loadPools(query);

    return {
      data: items.map((item) => this.toResponseDto(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        sortBy,
        sortOrder,
      },
    };
  }

  async getStats(teamId?: string): Promise<StatsDto> {
    const pools = await this.repository.find({
      where: teamId ? { teamId } : undefined,
      relations: { matches: { user: true } },
      order: { date: 'ASC', matches: { poolOrder: 'ASC' } },
    });

    let matches: FutPoolMatch[] = [];
    pools.forEach((pool) => {
      matches = matches.concat(pool.matches);
    });
    // Consider only matches with success defined
    const validMatches = matches.filter(
      (m) => m.success !== null && m.success !== undefined,
    );
    const nonFull15Matches = validMatches.filter((m) => !m.full15);
    const full15Matches = validMatches.filter((m) => m.full15);

    const stats = new StatsDto();
    stats.ranking = this.getMatchesStats(validMatches);
    stats.balance = this.getBalance(pools);

    stats.series = pools.map((pool) => {
      const successes = Array.isArray(pool.matches)
        ? pool.matches.filter((m) => !m.full15 && Boolean(m?.success)).length
        : 0;
      return {
        id: pool.id,
        date: pool.date,
        successes,
        cost: pool.cost ?? null,
        earning: pool.earning ?? null,
      };
    });

    stats.resultBreakdown = this.getResultCombinationStats(
      nonFull15Matches,
      full15Matches,
    );

    // Compute ranking totals across all users
    const totalNonFull15 = nonFull15Matches.length;
    const totalNonFull15Successes = nonFull15Matches.filter(
      (m) => m.success,
    ).length;
    const totalNonFull15Failures = totalNonFull15 - totalNonFull15Successes;

    const totalDouble = nonFull15Matches.filter(
      (m) => Array.isArray(m.results) && m.results.length === 2,
    ).length;
    const totalDoubleSuccesses = nonFull15Matches.filter(
      (m) => Array.isArray(m.results) && m.results.length === 2 && m.success,
    ).length;
    const totalDoubleFailures = totalDouble - totalDoubleSuccesses;

    const totalTriple = nonFull15Matches.filter(
      (m) => Array.isArray(m.results) && m.results.length === 3,
    ).length;
    const totalTripleSuccesses = nonFull15Matches.filter(
      (m) => Array.isArray(m.results) && m.results.length === 3 && m.success,
    ).length;
    const totalTripleFailures = totalTriple - totalTripleSuccesses;

    const totalFull15 = full15Matches.length;
    const totalFull15Successes = full15Matches.filter((m) => m.success).length;
    const totalFull15Failures = totalFull15 - totalFull15Successes;

    // E8 totals (only non-full15 matches flagged as elige8)
    const elige8Matches = nonFull15Matches.filter((m) => Boolean(m.elige8));
    const totalElige8 = elige8Matches.length;
    const totalElige8Successes = elige8Matches.filter((m) => m.success).length;
    const totalElige8Failures = totalElige8 - totalElige8Successes;

    stats.rankingTotal = {
      successes: totalNonFull15Successes,
      failures: totalNonFull15Failures,
      successesPercentage:
        totalNonFull15 > 0
          ? (totalNonFull15Successes / totalNonFull15) * 100
          : 0,
      doubleSuccesses: totalDoubleSuccesses,
      doubleFailures: totalDoubleFailures,
      doubleSuccessesPercentage:
        totalDouble > 0 ? (totalDoubleSuccesses / totalDouble) * 100 : 0,
      tripleSuccesses: totalTripleSuccesses,
      tripleFailures: totalTripleFailures,
      tripleSuccessesPercentage:
        totalTriple > 0 ? (totalTripleSuccesses / totalTriple) * 100 : 0,
      full15Successes: totalFull15Successes,
      full15Failures: totalFull15Failures,
      full15SuccessesPercentage:
        totalFull15 > 0 ? (totalFull15Successes / totalFull15) * 100 : 0,
      elige8Successes: totalElige8Successes,
      elige8Failures: totalElige8Failures,
      elige8SuccessesPercentage:
        totalElige8 > 0 ? (totalElige8Successes / totalElige8) * 100 : 0,
    };

    return stats;
  }

  private getMatchesStats(matches: FutPoolMatch[]): UserStatsDto[] {
    const matchesByUser = new Map<string, FutPoolMatch[]>();

    for (const match of matches) {
      if (!match.user?.id) {
        continue;
      }
      const userMatches = matchesByUser.get(match.user.id) ?? [];
      userMatches.push(match);
      matchesByUser.set(match.user.id, userMatches);
    }

    const summaries: UserStatsDto[] = [];

    for (const matches of matchesByUser.values()) {
      // matches contains both nonFull15 and full15, all with success defined
      const nonFull15 = matches.filter((m) => !m.full15);
      const elige8 = nonFull15.filter((m) => Boolean(m.elige8));
      const full15 = matches.filter((m) => m.full15);
      const doubleMatches = nonFull15.filter(
        (match) => Array.isArray(match.results) && match.results.length === 2,
      );
      const doubleSuccessMatches = doubleMatches.filter(
        (match) => match.success,
      );

      const tripleMatches = nonFull15.filter(
        (match) => Array.isArray(match.results) && match.results.length === 3,
      );
      const tripleSuccessMatches = tripleMatches.filter(
        (match) => match.success,
      );

      const nonFull15Successes = nonFull15.filter(
        (match) => match.success,
      ).length;
      const nonFull15Failures = nonFull15.length - nonFull15Successes;
      const elige8Successes = elige8.filter((match) => match.success).length;
      const elige8Failures = elige8.length - elige8Successes;
      const full15Successes = full15.filter((match) => match.success).length;
      const full15Failures = full15.length - full15Successes;

      const doubleSuccesses = doubleSuccessMatches.filter(
        (match) => match.success,
      ).length;
      const doubleFailures = doubleMatches.length - doubleSuccesses;

      const tripleSuccesses = tripleSuccessMatches.filter(
        (match) => match.success,
      ).length;
      const tripleFailures = tripleMatches.length - tripleSuccesses;

      const totalSuccesses = nonFull15Successes; // keep main successes as nonFull15 to match main column semantics
      const totalSuccessesPercetage =
        nonFull15.length > 0 ? (totalSuccesses / nonFull15.length) * 100 : 0;

      const doubleSuccessesPercentage =
        (doubleSuccesses / doubleMatches.length) * 100;

      const tripleSuccessesPercentage =
        tripleMatches.length > 0
          ? (tripleSuccesses / tripleMatches.length) * 100
          : 0;

      const user = matches.find((match) => match.user)?.user;

      summaries.push({
        user,
        successes: totalSuccesses,
        successesPercentage: totalSuccessesPercetage,
        doubleSuccesses: doubleSuccesses,
        doubleSuccessesPercentage: doubleSuccessesPercentage,
        tripleSuccesses: tripleSuccesses,
        tripleSuccessesPercentage: tripleSuccessesPercentage,
        failures: nonFull15Failures,
        doubleFailures: doubleFailures,
        tripleFailures: tripleFailures,
        full15Successes: full15Successes,
        full15Failures: full15Failures,
        full15SuccessesPercentage:
          full15.length > 0 ? (full15Successes / full15.length) * 100 : 0,
        elige8Successes: elige8Successes,
        elige8Failures: elige8Failures,
        elige8SuccessesPercentage:
          elige8.length > 0 ? (elige8Successes / elige8.length) * 100 : 0,
      });
    }

    summaries.sort((a, b) => b.successes - a.successes);

    return summaries;
  }

  private getBalance(pools: FutPool[]): number {
    const totalCost = pools.reduce((sum, pool) => sum + (pool.cost ?? 0), 0);
    const totalEarning = pools.reduce(
      (sum, pool) => sum + (pool.earning ?? 0),
      0,
    );

    const result = totalEarning - totalCost;

    return result;
  }

  private getResultCombinationStats(
    matches: FutPoolMatch[],
    full15: FutPoolMatch[],
  ): ResultCombinationStatDto[] {
    type Key = '1' | 'X' | '2' | '1X' | '12' | 'X2' | '1X2' | '15' | 'TOTAL';

    const counters = new Map<Key, { total: number; successes: number }>();

    const normalizeKey = (results: unknown, full15: boolean): Key | null => {
      if (full15) {
        return null;
      }
      const list = Array.isArray(results) ? (results as unknown[]) : [];
      const values = Array.from(
        new Set(
          list
            .map((v) => String(v).toUpperCase())
            .filter((v) => v === '1' || v === 'X' || v === '2'),
        ),
      );
      // Sort in logical order: 1, X, 2 (not alphabetical)
      values.sort((a, b) => {
        const order = ['1', 'X', '2'];
        return order.indexOf(a) - order.indexOf(b);
      });
      if (values.length === 0) return null;
      if (values.length === 3) return '1X2'; // Triples
      if (values.length === 2) return values.join('') as Key;
      return values[0] as Key;
    };

    for (const match of matches) {
      const key = normalizeKey(match.results, match.full15);
      if (!key) continue;
      const bucket = counters.get(key) ?? { total: 0, successes: 0 };
      bucket.total += 1;
      if (match.success) bucket.successes += 1;
      counters.set(key, bucket);
    }

    const result: ResultCombinationStatDto[] = [];
    let grandTotal = 0;
    let grandSuccesses = 0;
    for (const [key, { total, successes }] of counters.entries()) {
      const failures = total - successes;
      const successRate = total > 0 ? (successes / total) * 100 : 0;
      result.push({
        key,
        total,
        successes,
        failures,
        successRate,
      });
      grandTotal += total;
      grandSuccesses += successes;
    }

    // Add row for Full15 ('15')
    const full15Total = full15.length;
    const full15Successes = full15.filter((m) => m.success).length;
    const full15Failures = full15Total - full15Successes;
    const full15SuccessRate =
      full15Total > 0 ? (full15Successes / full15Total) * 100 : 0;
    result.push({
      key: '15',
      total: full15Total,
      successes: full15Successes,
      failures: full15Failures,
      successRate: full15SuccessRate,
    });
    // Include Full15 in grand totals as requested
    grandTotal += full15Total;
    grandSuccesses += full15Successes;

    // Add row for Triples ('1X2') - always show even if no triples
    const tripleTotal = counters.get('1X2')?.total ?? 0;
    const tripleSuccesses = counters.get('1X2')?.successes ?? 0;
    const tripleFailures = tripleTotal - tripleSuccesses;
    const tripleSuccessRate =
      tripleTotal > 0 ? (tripleSuccesses / tripleTotal) * 100 : 0;
    result.push({
      key: '1X2',
      total: tripleTotal,
      successes: tripleSuccesses,
      failures: tripleFailures,
      successRate: tripleSuccessRate,
    });
    // Include Triples in grand totals
    grandTotal += tripleTotal;
    grandSuccesses += tripleSuccesses;

    // Ensure deterministic order for UI (TOTAL handled below)
    const order: Key[] = ['1', 'X', '2', '1X', '12', 'X2', '1X2', '15'];
    result.sort(
      (a, b) => order.indexOf(a.key as Key) - order.indexOf(b.key as Key),
    );

    // Append TOTAL row at the end
    const totalFailures = grandTotal - grandSuccesses;
    const totalSuccessRate =
      grandTotal > 0 ? (grandSuccesses / grandTotal) * 100 : 0;
    result.push({
      key: 'TOTAL',
      total: grandTotal,
      successes: grandSuccesses,
      failures: totalFailures,
      successRate: totalSuccessRate,
    });

    return result;
  }

  async findById(poolId: string): Promise<FutPool | null> {
    return this.repository.findOne({
      where: { id: poolId },
      relations: { availablePool: true },
    });
  }

  async updatePool(poolId: string, update: UpdateFutPoolDto): Promise<FutPool> {
    const pool = await this.repository.findOne({
      where: { id: poolId },
      relations: { availablePool: true, matches: true },
    });

    if (!pool) {
      throw new NotFoundException('Fut pool not found');
    }

    // Validate doubles and triples against existing results
    if (update.doubles !== undefined) {
      const doubleResultsCount = pool.matches.filter(
        (match) =>
          Array.isArray(match.results) &&
          match.results.length === 2 &&
          !match.full15,
      ).length;

      if (update.doubles < doubleResultsCount) {
        throw new BadRequestException(
          `Cannot set doubles to ${update.doubles}. There are already ${doubleResultsCount} matches with double results.`,
        );
      }
    }

    if (update.triples !== undefined) {
      const tripleResultsCount = pool.matches.filter(
        (match) =>
          Array.isArray(match.results) &&
          match.results.length === 3 &&
          !match.full15,
      ).length;

      if (update.triples < tripleResultsCount) {
        throw new BadRequestException(
          `Cannot set triples to ${update.triples}. There are already ${tripleResultsCount} matches with triple results.`,
        );
      }
    }

    const nextUpdate = { ...update } as UpdateFutPoolDto & { date?: string };

    if (nextUpdate.date) {
      pool.date = new Date(nextUpdate.date);
      delete nextUpdate.date;
    }
    if (nextUpdate.name !== undefined) {
      nextUpdate.name = nextUpdate.name.trim();
      if (!nextUpdate.name) {
        nextUpdate.name = null;
      }
    }

    Object.assign(pool, nextUpdate);

    return this.repository.save(pool);
  }

  async createPool(payload: CreateFutPoolDto): Promise<FutPool> {
    const doubles = payload.doubles;
    const triples = payload.triples ?? 0;
    const baseCost = 0.75;
    const computedCost = baseCost * Math.pow(2, doubles) * Math.pow(3, triples);

    const pool = this.repository.create({
      name: payload.name?.trim() || null,
      doubles: doubles,
      triples: triples,
      elige8: payload.elige8 ?? false,
      date: new Date(payload.date),
      active: payload.active ?? true,
      cost: computedCost,
      earning: payload.earning ?? null,
      teamId: payload.teamId ?? null,
      availablePoolId: payload.availablePoolId ?? null,
    });

    const savedPool = await this.repository.save(pool);

    // Create matches if provided
    if (payload.matches && payload.matches.length > 0) {
      // Validate that all matches have required fields
      for (const match of payload.matches) {
        if (!match.homeTeam || !match.homeTeam.trim()) {
          throw new BadRequestException(
            'Home team is required for all matches',
          );
        }
        if (!match.awayTeam || !match.awayTeam.trim()) {
          throw new BadRequestException(
            'Away team is required for all matches',
          );
        }
      }

      const matchRepository =
        this.repository.manager.getRepository(FutPoolMatch);
      const userRepository = this.repository.manager.getRepository(User);

      // Create matches one by one to handle user relations
      for (const [index, matchData] of payload.matches.entries()) {
        const matchToCreate: any = {
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          poolOrder: matchData.order,
          futPoolId: savedPool.id,
          userId: matchData.userId || null,
          results: [],
          officialResults: [],
          success: null,
          elige8: false,
          full15: index === payload.matches.length - 1, // Last match has full15 = true
        };

        // If userId is provided, load the user entity
        if (matchData.userId) {
          const user = await userRepository.findOne({
            where: { id: matchData.userId },
          });
          if (user) {
            matchToCreate.user = user;
          }
        }

        await matchRepository.save(matchToCreate);
      }
    }

    // Return the pool with matches
    return this.repository.findOne({
      where: { id: savedPool.id },
      relations: { availablePool: true, matches: { user: true } },
    });
  }

  private async loadPools(query: FutPoolQueryDto): Promise<LoadedPoolsResult> {
    const { page, limit, sortBy, sortOrder, teamId } = query;
    const skip = (page - 1) * limit;

    const order: FindOptionsOrder<FutPool> = {
      matches: { poolOrder: 'ASC' },
    };

    (order as Record<string, unknown>)[sortBy] =
      sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const [items, total] = await this.repository.findAndCount({
      where: teamId
        ? ({ teamId } satisfies FindOptionsWhere<FutPool>)
        : undefined,
      relations: { availablePool: true, matches: { user: true } },
      order,
      skip,
      take: limit,
    });

    return { items, total, page, limit, sortBy, sortOrder };
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
