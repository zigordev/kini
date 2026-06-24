import { ApiProperty } from '@nestjs/swagger';
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
import { User } from '../users/user.entity';

@Entity({ name: 'notification_token' })
export class NotificationToken {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string;

  @Index('IDX_notification_token_token', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  @ApiProperty()
  token: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  @ApiProperty({ required: false })
  platform: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
