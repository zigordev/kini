export type Language = 'en' | 'es';
export type ThemeMode = 'light' | 'dark';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  givenName: string | null;
  familyName: string | null;
  textColor?: string;
  backgroundColor?: string;
  language?: Language | null;
  theme?: ThemeMode | null;
  activeTeamId?: string | null;
}

export type TeamRole = 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  textColor?: string;
  backgroundColor?: string;
}

export type ResultValue = '1' | 'X' | '2' | '0' | 'M';

export interface FutPoolMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  poolOrder: number;
  results: ResultValue[];
  officialResults: ResultValue[];
  success: boolean | null;
  elige8: boolean;
  full15: boolean;
  user?: UserSummary;
  userId?: string;
  futPoolId: string;
}

export type FutPoolStatus = 'programmed' | 'active' | 'closed';

export interface FutPool {
  id: string;
  name?: string | null;
  availablePoolId?: string | null;
  teamId?: string | null;
  date: string;
  matches: FutPoolMatch[];
  elige8: boolean;
  doubles: number;
  triples: number;
  active: boolean;
  status?: FutPoolStatus;
  cost?: number;
  earning?: number;
}

export interface AvailablePoolMatch {
  order: number;
  homeTeam: string;
  awayTeam: string;
  full15?: boolean;
  officialResults?: ResultValue[];
}

export interface AvailablePool {
  id: string;
  provider: string;
  gameType: string;
  externalDrawId: string;
  name: string;
  drawDate: string;
  closingDate?: string | null;
  status: string;
  jackpot?: string | null;
  jackpotFormatted?: string | null;
  matches: AvailablePoolMatch[];
  createdAt: string;
  updatedAt: string;
}

export interface AvailablePoolJackpot {
  jackpotPublished?: boolean;
  jackpot?: string | null;
  jackpotFormatted?: string | null;
  drawDate?: string | null;
  externalDrawId?: string | null;
  lastSyncedAt?: string | null;
}

export interface UserStats {
  user: UserSummary;
  successes: number;
  successesPercentage: number;
  doubleSuccesses: number;
  doubleSuccessesPercentage: number;
  tripleSuccesses: number;
  tripleSuccessesPercentage: number;
  failures: number;
  doubleFailures: number;
  tripleFailures: number;
  full15Successes: number;
  full15Failures: number;
  full15SuccessesPercentage: number;
  elige8Successes: number;
  elige8Failures: number;
  elige8SuccessesPercentage: number;
}

export type ResultCombinationKey =
  '1' | 'X' | '2' | '1X' | '12' | 'X2' | '1X2' | '15' | 'TOTAL';

export interface ResultCombinationStat {
  key: ResultCombinationKey;
  total: number;
  successes: number;
  failures: number;
  successRate: number;
}

export interface Stats {
  ranking: UserStats[];
  balance: number;
  resultBreakdown?: ResultCombinationStat[];
}

export interface PoolDefaults {
  doubles: number;
  triples: number;
  elige8: boolean;
}

export interface PoolForm {
  name?: string;
  teamId?: string;
  doubles: number;
  triples: number;
  elige8: boolean;
  active: boolean;
  date: string;
  earning?: number;
  matches?: Array<{
    order: number;
    homeTeam: string;
    awayTeam: string;
    userId?: string;
  }>;
}
