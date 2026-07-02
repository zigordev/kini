import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Saturday pool' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
