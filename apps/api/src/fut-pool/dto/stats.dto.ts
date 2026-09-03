import { ApiProperty } from '@nestjs/swagger';
import { UserStatsDto } from './user-stats.dto';

export class PoolSeriesDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  date: Date;

  @ApiProperty()
  successes: number;

  @ApiProperty({ nullable: true })
  cost?: number | null;

  @ApiProperty({ nullable: true })
  earning?: number | null;
}

export class StatsDto {
  @ApiProperty()
  ranking: UserStatsDto[];

  @ApiProperty()
  balance: number;

  @ApiProperty({ type: () => PoolSeriesDto, isArray: true })
  series: PoolSeriesDto[];

  // Swagger 11 tightened `ApiPropertyOptions`: a bare `type: 'object'` is no
  // longer accepted, and naming the DTO is better documentation anyway — the
  // generated schema now describes the shape instead of saying "an object".
  @ApiProperty({
    description:
      'Breakdown of result combinations and their success/failure counts',
    type: () => ResultCombinationStatDto,
    isArray: true,
  })
  resultBreakdown: ResultCombinationStatDto[];

  @ApiProperty({ description: 'Totals across ranking columns' })
  rankingTotal?: {
    successes: number;
    failures: number;
    successesPercentage: number;
    doubleSuccesses: number;
    doubleFailures: number;
    doubleSuccessesPercentage: number;
    tripleSuccesses: number;
    tripleFailures: number;
    tripleSuccessesPercentage: number;
    full15Successes: number;
    full15Failures: number;
    full15SuccessesPercentage: number;
    elige8Successes: number;
    elige8Failures: number;
    elige8SuccessesPercentage: number;
  };
}

export class ResultCombinationStatDto {
  @ApiProperty({
    description: 'Combination key',
    enum: ['1', 'X', '2', '1X', '12', 'X2', '1X2', '15', 'TOTAL'],
  })
  key: '1' | 'X' | '2' | '1X' | '12' | 'X2' | '1X2' | '15' | 'TOTAL';

  @ApiProperty({ description: 'Total amount of matches for this combination' })
  total: number;

  @ApiProperty({
    description: 'Number of successful matches for this combination',
  })
  successes: number;

  @ApiProperty({ description: 'Number of failed matches for this combination' })
  failures: number;

  @ApiProperty({
    description: 'Success rate (0..100)',
    minimum: 0,
    maximum: 100,
  })
  successRate: number;
}
