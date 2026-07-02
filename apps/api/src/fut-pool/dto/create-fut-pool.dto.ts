import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateMatchDto {
  @ApiProperty()
  @IsInt()
  order: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  homeTeam: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  awayTeam: string;

  @ApiProperty({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string | null;
}

export class CreateFutPoolDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  availablePoolId?: string;

  @ApiProperty({ default: 6 })
  @IsInt()
  doubles: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  triples?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  elige8?: boolean;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  earning?: number;

  @ApiPropertyOptional({ type: [CreateMatchDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMatchDto)
  matches?: CreateMatchDto[];
}
