import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MobileSessionDto {
  @ApiProperty({
    description: 'One-time token exchanged after mobile OAuth redirect',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;
}
