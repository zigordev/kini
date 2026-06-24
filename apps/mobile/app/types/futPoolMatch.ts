import FutPoolSnapshot, { OptionValue } from './futPool';
import User from './user';

type FutPoolMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  poolOrder: number;
  results: OptionValue[];
  success: boolean;
  elige8: boolean;
  double: boolean;
  full15: boolean;
  user: User;
  userId?: string;
  futPool: FutPoolSnapshot;
  futPoolId: string;
};

export default FutPoolMatch;
