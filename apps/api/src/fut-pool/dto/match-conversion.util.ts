import { FutPoolMatch } from '../../fut-pool-match/entities/fut-pool-match.entity';

export function convertMatchToResponseDto(match: FutPoolMatch) {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    poolOrder: match.poolOrder,
    results: match.results,
    officialResults: match.officialResults,
    success: match.success,
    elige8: match.elige8,
    full15: match.full15,
    user: match.user
      ? {
          id: match.user.id,
          name: match.user.name,
          textColor: match.user.textColor,
          backgroundColor: match.user.backgroundColor,
        }
      : undefined,
    userId: match.userId,
    futPoolId: match.futPoolId,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}
