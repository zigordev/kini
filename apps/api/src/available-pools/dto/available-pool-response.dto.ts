import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailablePoolMatch } from '../entities/available-pool.entity';

export class AvailablePoolResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  gameType: string;

  @ApiProperty()
  externalDrawId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, format: 'date' })
  drawDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closingDate: Date | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ nullable: true })
  jackpot: string | null;

  @ApiPropertyOptional({ nullable: true })
  jackpotFormatted: string | null;

  @ApiProperty({ isArray: true })
  matches: AvailablePoolMatch[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
