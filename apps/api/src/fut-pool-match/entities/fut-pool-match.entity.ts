import { ApiProperty } from '@nestjs/swagger';
import { FutPool } from 'src/fut-pool/entities/fut-pool.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum Result {
  HOME = '1',
  DRAW = 'X',
  AWAY = '2',
}

export enum Full15Result {
  CERO = '0',
  ONE = '1',
  TWO = '2',
  MORE = 'M',
  EMPTY = '',
}

export type AllResults = Result | Full15Result;

export const ALL_RESULTS: AllResults[] = [
  Result.HOME,
  Result.DRAW,
  Result.AWAY,
  Full15Result.CERO,
  Full15Result.ONE,
  Full15Result.TWO,
  Full15Result.MORE,
  Full15Result.EMPTY,
];

@Entity({ name: 'fut_pool_match' })
export class FutPoolMatch {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid', readOnly: true })
  id: string;

  @Column({ name: 'home_team', type: 'varchar', length: 255 })
  @ApiProperty()
  homeTeam: string;

  @Column({ name: 'away_team', type: 'varchar', length: 255 })
  @ApiProperty()
  awayTeam: string;

  @Column({ name: 'pool_order', type: 'int' })
  @ApiProperty({
    description: 'Ordering position inside the pool',
  })
  poolOrder: number;

  @Column({
    type: 'char',
    array: true,
    default: [],
  })
  @ApiProperty({ type: 'string', isArray: true })
  results: AllResults[];

  @Column({
    name: 'official_results',
    type: 'char',
    array: true,
    default: [],
  })
  @ApiProperty({ type: 'string', isArray: true })
  officialResults: AllResults[];

  @Column({ type: 'boolean', nullable: true, default: null })
  @ApiProperty({ nullable: true })
  success: boolean;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ default: false })
  elige8: boolean;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ default: false })
  full15: boolean;

  @ManyToOne(() => User, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((match: FutPoolMatch) => match.user)
  @ApiProperty({ format: 'uuid' })
  userId?: string;

  @ManyToOne(() => FutPool, (futPool) => futPool.matches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fut_pool_id' })
  futPool: FutPool;

  @Column({ name: 'fut_pool_id', type: 'uuid' })
  @ApiProperty({ format: 'uuid', readOnly: true })
  futPoolId: string;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ type: String, format: 'date-time', readOnly: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ type: String, format: 'date-time', readOnly: true })
  updatedAt: Date;
}
