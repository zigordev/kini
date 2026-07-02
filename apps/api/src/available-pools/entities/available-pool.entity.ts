import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FutPool } from '../../fut-pool/entities/fut-pool.entity';

export interface AvailablePoolMatch {
  order: number;
  homeTeam: string;
  awayTeam: string;
  full15?: boolean;
  officialResults?: string[];
}

@Entity({ name: 'available_pool' })
@Index(['provider', 'gameType', 'externalDrawId'], { unique: true })
export class AvailablePool {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 80, default: 'eduardo-losilla' })
  @ApiProperty()
  provider: string;

  @Column({ name: 'game_type', type: 'varchar', length: 80 })
  @ApiProperty()
  gameType: string;

  @Column({ name: 'external_draw_id', type: 'varchar', length: 160 })
  @ApiProperty()
  externalDrawId: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty()
  name: string;

  @Column({ name: 'draw_date', type: 'date' })
  @ApiProperty({ type: String, format: 'date' })
  drawDate: Date;

  @Column({ name: 'closing_date', type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closingDate: Date | null;

  @Column({ type: 'varchar', length: 40, default: 'SCHEDULED' })
  @ApiProperty()
  status: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  @ApiPropertyOptional({ nullable: true })
  jackpot: string | null;

  @Column({
    name: 'jackpot_formatted',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  @ApiPropertyOptional({ nullable: true })
  jackpotFormatted: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  @ApiProperty({ isArray: true })
  matches: AvailablePoolMatch[];

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  rawPayload: Record<string, unknown> | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSyncedAt: Date | null;

  @OneToMany(() => FutPool, (pool) => pool.availablePool)
  teamPools: FutPool[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
