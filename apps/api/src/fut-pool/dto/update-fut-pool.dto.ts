import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateFutPoolDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  elige8?: boolean;

  @ApiPropertyOptional({ default: 6 })
  @IsOptional()
  @IsInt()
  doubles?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  triples?: number;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  earning?: number;
}
