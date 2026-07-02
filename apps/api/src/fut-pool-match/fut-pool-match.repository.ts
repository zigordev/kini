import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Not, Repository } from 'typeorm';
import { UpdateFutPoolMatchDto } from './dto/update-fut-pool-match.dto';
import { FutPoolMatch } from './entities/fut-pool-match.entity';

@Injectable()
export class FutPoolMatchRepository {
  constructor(
    @InjectRepository(FutPoolMatch)
    private readonly repository: Repository<FutPoolMatch>,
  ) {}

  async findById(matchId: string): Promise<FutPoolMatch | null> {
    return this.repository.findOne({
      where: { id: matchId },
      relations: { futPool: true, user: true },
    });
  }

  async isPoolPredictionsComplete(futPoolId: string): Promise<boolean> {
    const matches = await this.repository.find({
      where: { futPoolId },
    });
    return (
      matches.length === 15 &&
      matches.every((match) => this.hasPrediction(match.results))
    );
  }

  async update(
    matchId: string,
    matchUpdate: UpdateFutPoolMatchDto,
  ): Promise<FutPoolMatch> {
    const match = await this.repository.findOne({
      where: { id: matchId },
      relations: { futPool: true, user: true },
    });

    const { userId, ...otherUpdates } = matchUpdate;

    Object.assign(match, otherUpdates);

    if (userId !== undefined) {
      if (userId === null || userId === '') {
        match.userId = null;
        match.user = null;
      } else {
        match.userId = userId;
        const user = await this.repository.manager.findOne(User, {
          where: { id: userId },
        });
        match.user = user;
      }
    }

    await this.assertElige8Limit(match);
    await this.assertDoubleLimit(match);
    await this.assertTripleLimit(match);

    if (
      matchUpdate.results !== undefined ||
      matchUpdate.officialResults !== undefined
    ) {
      match.success = this.computeSuccess(
        match.results,
        match.officialResults,
        match.full15,
      );
    }

    await this.repository.save(match);

    return this.repository.findOne({
      where: { id: matchId },
      relations: {
        futPool: { matches: { user: true }, team: true },
        user: true,
      },
    });
  }

  private hasPrediction(results: unknown): boolean {
    return (
      Array.isArray(results) &&
      results.some((value) =>
        Array.isArray(value)
          ? value.some((entry) => Boolean(String(entry).trim()))
          : Boolean(String(value ?? '').trim()),
      )
    );
  }

  private async assertElige8Limit(match: FutPoolMatch): Promise<void> {
    const elige8Count = await this.repository.count({
      where: {
        futPoolId: match.futPoolId,
        id: Not(match.id),
        elige8: true,
      },
    });

    const totalElige8Matches = elige8Count + (match.elige8 ? 1 : 0);

    if (totalElige8Matches > 8) {
      throw new BadRequestException({
        code: 'FUT_POOL_MATCH.ELIGE8_LIMIT',
        params: { max: 8 },
        message: 'The maximum number of elige8 matches is 8',
      });
    }
  }

  private async assertDoubleLimit(match: FutPoolMatch): Promise<void> {
    const doubleCount = await this.repository
      .createQueryBuilder('futPoolMatch')
      .where('futPoolMatch.fut_pool_id = :poolId', {
        poolId: match.futPoolId,
      })
      .andWhere('futPoolMatch.id <> :matchId', { matchId: match.id })
      .andWhere('futPoolMatch.full15 = false')
      .andWhere('cardinality(futPoolMatch.results) = 2')
      .getCount();

    const totalDoubles =
      doubleCount + (!match.full15 && this.hasTwoResults(match) ? 1 : 0);

    if (totalDoubles > match.futPool.doubles) {
      throw new BadRequestException(
        `The maximum number of double matches for this pool is ${match.futPool.doubles}`,
      );
    }
  }

  private async assertTripleLimit(match: FutPoolMatch): Promise<void> {
    const tripleCount = await this.repository
      .createQueryBuilder('futPoolMatch')
      .where('futPoolMatch.fut_pool_id = :poolId', {
        poolId: match.futPoolId,
      })
      .andWhere('futPoolMatch.id <> :matchId', { matchId: match.id })
      .andWhere('futPoolMatch.full15 = false')
      .andWhere('cardinality(futPoolMatch.results) = 3')
      .getCount();

    const totalTriples =
      tripleCount + (!match.full15 && this.hasThreeResults(match) ? 1 : 0);

    if (totalTriples > match.futPool.triples) {
      throw new BadRequestException(
        `The maximum number of triple matches for this pool is ${match.futPool.triples}`,
      );
    }
  }

  private hasTwoResults(match: FutPoolMatch): boolean {
    return Array.isArray(match.results) && match.results.length === 2;
  }

  private hasThreeResults(match: FutPoolMatch): boolean {
    return Array.isArray(match.results) && match.results.length === 3;
  }

  private computeSuccess(
    userResults: unknown,
    officialResults: unknown,
    full15: boolean,
  ): boolean | null {
    const selected = Array.isArray(userResults)
      ? userResults.map((value) => String(value).toUpperCase())
      : [];
    const official = Array.isArray(officialResults)
      ? officialResults
          .map((value) => String(value).toUpperCase())
          .filter((value, index) => (full15 ? index < 2 : Boolean(value)))
      : [];

    if (full15 && official.filter(Boolean).length < 2) {
      return null;
    }
    if (official.length === 0) {
      return null;
    }
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
}
