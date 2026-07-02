import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'User given name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  givenName?: string | null;

  @ApiPropertyOptional({
    description: 'User family name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  familyName?: string | null;

  @ApiPropertyOptional({
    description: 'Text color for user interface',
    example: '#000000',
  })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({
    description: 'Background color for user interface',
    example: '#FFFFFF',
  })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Preferred language (ISO code)',
    example: 'es',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'es'])
  language?: string | null;

  @ApiPropertyOptional({
    description: 'Preferred theme mode',
    example: 'dark',
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark'])
  theme?: string | null;

  @ApiPropertyOptional({
    description: 'Active team id',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  activeTeamId?: string | null;
}
