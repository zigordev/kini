import { ApiPropertyOptional } from '@nestjs/swagger';

export class AvailablePoolJackpotResponseDto {
  @ApiPropertyOptional()
  jackpotPublished: boolean;

  @ApiPropertyOptional({ nullable: true })
  jackpot: string | null;

  @ApiPropertyOptional({ nullable: true })
  jackpotFormatted: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  drawDate: Date | null;

  @ApiPropertyOptional({ nullable: true })
  externalDrawId: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSyncedAt: Date | null;
}
