import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddAvailablePoolToTeamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teamId: string;
}
