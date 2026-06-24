import { ApiProperty } from '@nestjs/swagger';
import { FutPoolMatchResponseDto } from '../../fut-pool-match/dto/fut-pool-match-response.dto';

export class FutPoolResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  doubles: number;

  @ApiProperty({ default: 0 })
  triples: number;

  @ApiProperty({ default: false })
  elige8: boolean;

  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @ApiProperty({ default: false })
  active: boolean;

  @ApiProperty({ required: false })
  cost: number;

  @ApiProperty({ required: false })
  earning: number;

  @ApiProperty({ type: () => FutPoolMatchResponseDto, isArray: true })
  matches: FutPoolMatchResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class FutPoolPaginationMetaDto {
  @ApiProperty({ minimum: 0 })
  total: number;

  @ApiProperty({ minimum: 1 })
  page: number;

  @ApiProperty({ minimum: 1 })
  limit: number;

  @ApiProperty({ minimum: 1 })
  totalPages: number;

  @ApiProperty()
  sortBy: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  sortOrder: 'asc' | 'desc';
}

export class FutPoolPaginatedResponseDto {
  @ApiProperty({ type: () => FutPoolResponseDto, isArray: true })
  data: FutPoolResponseDto[];

  @ApiProperty({ type: () => FutPoolPaginationMetaDto })
  meta: FutPoolPaginationMetaDto;
}
