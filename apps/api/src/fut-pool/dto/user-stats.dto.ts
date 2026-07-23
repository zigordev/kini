import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'src/users/dto/user.dto';

export class UserStatsDto {
  @ApiProperty()
  user: UserDto;

  @ApiProperty()
  successes: number;

  @ApiProperty()
  successesPercentage: number;

  @ApiProperty()
  doubleSuccesses: number;

  @ApiProperty()
  doubleSuccessesPercentage: number;

  @ApiProperty()
  tripleSuccesses: number;

  @ApiProperty()
  tripleSuccessesPercentage: number;

  @ApiProperty()
  failures: number;

  @ApiProperty()
  doubleFailures: number;

  @ApiProperty()
  tripleFailures: number;

  @ApiProperty()
  full15Successes: number;

  @ApiProperty()
  full15Failures: number;

  @ApiProperty()
  full15SuccessesPercentage: number;

  @ApiProperty({ description: 'E8 successful matches' })
  elige8Successes: number;

  @ApiProperty({ description: 'E8 failed matches' })
  elige8Failures: number;

  @ApiProperty({ description: 'E8 success percentage (0..100)' })
  elige8SuccessesPercentage: number;
}
