import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  textColor?: string;

  @ApiProperty({ required: false })
  backgroundColor?: string;

  static fromEntity(
    user: Pick<User, 'id' | 'name' | 'textColor' | 'backgroundColor'>,
  ): UserSummaryDto {
    const dto = new UserSummaryDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.textColor = user.textColor;
    dto.backgroundColor = user.backgroundColor;
    return dto;
  }
}
