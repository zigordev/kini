import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ALL_RESULTS, AllResults } from '../entities/fut-pool-match.entity';

export class UpdateFutPoolMatchDto {
  @ApiPropertyOptional({ enum: ALL_RESULTS, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ALL_RESULTS, { each: true })
  results?: AllResults[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  elige8?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homeTeam?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  awayTeam?: string;
}
