import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn } from 'class-validator';

const RESULT_VALUES = ['', '0', '1', 'X', '2', 'M'] as const;

export class UpdateAvailablePoolMatchResultDto {
  @ApiProperty({ isArray: true, enum: RESULT_VALUES })
  @IsArray()
  @IsIn(RESULT_VALUES, { each: true })
  officialResults: string[];
}
