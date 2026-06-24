import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class FutPoolQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @ApiPropertyOptional({ minimum: 1, default: 25 })
  limit = 25;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ default: 'date' })
  sortBy = 'date';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be "asc" or "desc"' })
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  sortOrder: 'asc' | 'desc' = 'asc';
}
