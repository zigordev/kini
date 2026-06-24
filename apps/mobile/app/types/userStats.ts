import User from './user';

type UserStats = {
  user: User;
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
};

export default UserStats;
