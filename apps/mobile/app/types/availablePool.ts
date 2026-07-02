export type AvailablePoolMatch = {
  order: number;
  homeTeam: string;
  awayTeam: string;
  full15?: boolean;
  officialResults?: string[];
};

export type AvailablePool = {
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
};

export type AvailablePoolJackpot = {
  jackpotPublished?: boolean;
  jackpot?: string | null;
  jackpotFormatted?: string | null;
  drawDate?: string | null;
  externalDrawId?: string | null;
  lastSyncedAt?: string | null;
};
