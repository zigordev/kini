import UserStats from './userStats';

export type ResultCombinationKey =
  | '1'
  | 'X'
  | '2'
  | '1X'
  | '12'
  | 'X2'
  | '1X2'
  | '15'
  | 'TOTAL';

export type ResultCombinationStat = {
  key: ResultCombinationKey;
  total: number;
  successes: number;
  failures: number;
  successRate: number;
};

type Stats = {
  ranking: UserStats[];
  balance: number;
  resultBreakdown?: ResultCombinationStat[];
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
};

export default Stats;
