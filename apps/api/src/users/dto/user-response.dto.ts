import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
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

  @ApiProperty({ required: false })
  textColor: string;

  @ApiProperty({ required: false })
  backgroundColor: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Preferred language code (e.g., en, es, eu)',
  })
  language: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Preferred theme mode',
  })
  theme: string | null;

  @ApiProperty({ format: 'uuid', required: false, nullable: true })
  activeTeamId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
