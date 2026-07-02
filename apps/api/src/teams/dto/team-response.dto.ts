import { ApiProperty } from '@nestjs/swagger';
import type { TeamRole } from '../entities/team-membership.entity';

export class TeamResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'uuid' })
  ownerId: string;

  @ApiProperty({ enum: ['admin', 'member'] })
  role: TeamRole;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
