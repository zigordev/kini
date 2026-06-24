import { ApiProperty } from '@nestjs/swagger';
import { FutPoolMatch } from 'src/fut-pool-match/entities/fut-pool-match.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'fut_pool' })
export class FutPool {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

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
