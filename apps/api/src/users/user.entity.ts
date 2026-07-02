import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'kini_user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty()
  name: string;

  @Index('IDX_user_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @ApiProperty()
  email: string;

  @Index('IDX_user_google_id', { unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ required: false })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ required: false })
  givenName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ required: false })
  familyName: string | null;

  @Column({ type: 'varchar', length: 255, default: '#000000' })
  @ApiProperty({ required: false })
  textColor: string;

  @Column({ type: 'varchar', length: 255, default: '#FFFFFF' })
  @ApiProperty({ required: false })
  backgroundColor: string;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ required: false })
  notificationsEnabled: boolean;

  @Column({ type: 'varchar', length: 16, nullable: true })
  @ApiProperty({
    required: false,
    description: 'Preferred language code (e.g., en, es, eu)',
  })
  language: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  @ApiProperty({
    required: false,
    description: 'Preferred theme mode',
  })
  theme: string | null;

  @Column({ name: 'active_team_id', type: 'uuid', nullable: true })
  @ApiProperty({ format: 'uuid', required: false, nullable: true })
  activeTeamId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
