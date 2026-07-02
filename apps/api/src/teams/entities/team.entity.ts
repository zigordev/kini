import { ApiProperty } from '@nestjs/swagger';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeamMembership } from './team-membership.entity';

@Entity({ name: 'team' })
export class Team {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  @ApiProperty()
  name: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', type: 'uuid' })
  @ApiProperty({ format: 'uuid' })
  ownerId: string;

  @OneToMany(() => TeamMembership, (membership) => membership.team)
  memberships: TeamMembership[];

  @OneToMany(() => FutPool, (pool) => pool.team)
  pools: FutPool[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
