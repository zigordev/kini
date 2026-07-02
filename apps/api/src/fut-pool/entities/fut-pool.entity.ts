import { ApiProperty } from '@nestjs/swagger';
import { AvailablePool } from 'src/available-pools/entities/available-pool.entity';
import { FutPoolMatch } from 'src/fut-pool-match/entities/fut-pool-match.entity';
import { Team } from 'src/teams/entities/team.entity';
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

@Entity({ name: 'fut_pool' })
export class FutPool {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ required: false, nullable: true })
  name: string | null;

  @Column({ type: 'int' })
  @ApiProperty()
  doubles: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ default: 0 })
  triples: number;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ default: false })
  elige8: boolean;

  @Column({ name: 'date', type: 'date' })
  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ default: false })
  active: boolean;

  @Column({ type: 'float', nullable: true })
  @ApiProperty()
  cost: number;

  @Column({ type: 'float', nullable: true })
  @ApiProperty()
  earning: number;

  @ManyToOne(() => Team, (team) => team.pools, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'team_id' })
  team: Team | null;

  @Column({ name: 'team_id', type: 'uuid', nullable: true })
  @ApiProperty({ format: 'uuid', required: false })
  teamId: string | null;

  @ManyToOne(() => AvailablePool, (availablePool) => availablePool.teamPools, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'available_pool_id' })
  availablePool: AvailablePool | null;

  @Column({ name: 'available_pool_id', type: 'uuid', nullable: true })
  @ApiProperty({ format: 'uuid', required: false })
  availablePoolId: string | null;

  @OneToMany(() => FutPoolMatch, (match) => match.futPool, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  matches: FutPoolMatch[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
