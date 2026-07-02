import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from './team.entity';

export type TeamRole = 'admin' | 'member';
export type TeamMembershipStatus = 'active' | 'pending';

@Index('IDX_team_membership_user', ['teamId', 'userId'], { unique: true })
@Index('IDX_team_membership_invited_email', ['teamId', 'invitedEmail'])
@Entity({ name: 'team_membership' })
export class TeamMembership {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ManyToOne(() => Team, (team) => team.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'team_id', type: 'uuid' })
  @ApiProperty({ format: 'uuid' })
  teamId: string;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @ApiProperty({ format: 'uuid', required: false })
  userId: string | null;

  @Column({ name: 'invited_email', type: 'varchar', length: 255 })
  @ApiProperty()
  invitedEmail: string;

  @Column({ type: 'varchar', length: 16, default: 'member' })
  @ApiProperty({ enum: ['admin', 'member'] })
  role: TeamRole;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  @ApiProperty({ enum: ['active', 'pending'] })
  status: TeamMembershipStatus;

  @Column({ name: 'invited_by_id', type: 'uuid', nullable: true })
  @ApiProperty({ format: 'uuid', required: false })
  invitedById: string | null;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  @ApiProperty({ type: String, format: 'date-time', required: false })
  joinedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
