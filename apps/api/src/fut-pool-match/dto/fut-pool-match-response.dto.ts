import { ApiProperty } from '@nestjs/swagger';
import { UserSummaryDto } from '../../users/dto/user-summary.dto';
import { AllResults } from '../entities/fut-pool-match.entity';

export class FutPoolMatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  homeTeam: string;

  @ApiProperty()
  awayTeam: string;

  @ApiProperty({
    description: 'Ordering position inside the pool',
  })
  poolOrder: number;

  @ApiProperty({ type: 'string', isArray: true })
  results: AllResults[];

  @ApiProperty({ nullable: true })
  success: boolean;

  @ApiProperty({ default: false })
  elige8: boolean;

  @ApiProperty({ default: false })
  full15: boolean;

  @ApiProperty({ type: () => UserSummaryDto, required: false })
  user?: UserSummaryDto;

  @ApiProperty({ format: 'uuid', required: false })
  userId?: string;

  @ApiProperty({ format: 'uuid' })
  futPoolId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
