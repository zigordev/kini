import Result from '../enums/result.enum';
import Full15Result from '../enums/resultFull15.enum';

export const REGULAR_OPTIONS = [Result.HOME, Result.DRAW, Result.AWAY] as const;
export const EXTENDED_OPTIONS = [
  Full15Result.CERO,
  Full15Result.ONE,
  Full15Result.TWO,
  Full15Result.MORE,
] as const;
export const SPLIT_SUFFIXES = ['a', 'b'] as const;

export type OptionValue =
  | (typeof REGULAR_OPTIONS)[number]
  | (typeof EXTENDED_OPTIONS)[number]
  | '';

export type SelectionState = Record<
  string,
  Partial<Record<OptionValue, boolean>>
>;

export type SuccessesByUser = {
  name: string;
  successes: number;
  textColor: string;
  backgroundColor: string;
};

export type FutPoolStatus = 'programmed' | 'active' | 'closed';

type FutPoolSnapshot = {
  id: string;
  name?: string | null;
  availablePoolId?: string | null;
  teamId?: string | null;
  date: string;
  matches: any[];
  results?: SelectionState;
  elige8: boolean;
  doubles: number;
  triples: number;
  active: boolean;
  status?: FutPoolStatus;
  successes: number;
  description?: string;
  earning?: number;
};

export default FutPoolSnapshot;
