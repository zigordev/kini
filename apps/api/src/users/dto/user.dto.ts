import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ required: false, nullable: true })
  givenName: string | null;

  @ApiProperty({ required: false, nullable: true })
  familyName: string | null;
}
