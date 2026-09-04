import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './user.entity';

export interface GoogleProfileData {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOrCreateGoogleUser(profile: GoogleProfileData): Promise<User> {
    const normalizedEmail = profile.email.toLowerCase();
    const existingUser = await this.usersRepository.findOne({
      where: [{ googleId: profile.googleId }, { email: normalizedEmail }],
    });

    const userToPersist = existingUser ?? this.usersRepository.create();

    userToPersist.googleId = profile.googleId;
    userToPersist.email = normalizedEmail;
    userToPersist.name = profile.displayName;
    userToPersist.avatarUrl = profile.avatarUrl ?? null;
    userToPersist.givenName = profile.givenName ?? null;
    userToPersist.familyName = profile.familyName ?? null;

    if (!userToPersist.textColor) {
      userToPersist.textColor = '#000000';
    }

    if (!userToPersist.backgroundColor) {
      userToPersist.backgroundColor = '#FFFFFF';
    }

    if (!userToPersist.theme) {
      userToPersist.theme = 'light';
    }

    const savedUser = await this.usersRepository.save(userToPersist);
    return savedUser;
  }

  async listUsers(): Promise<
    Array<Pick<User, 'id' | 'name' | 'textColor' | 'backgroundColor'>>
  > {
    const users = await this.usersRepository.find({
      select: { id: true, name: true, textColor: true, backgroundColor: true },
      order: { name: 'ASC' },
    });
    return users.map(({ id, name, textColor, backgroundColor }) => ({
      id,
      name,
      textColor,
      backgroundColor,
    }));
  }

  async updateUser(
    userId: string,
    updateData: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update only the provided fields
    Object.assign(user, updateData);

    const updatedUser = await this.usersRepository.save(user);
    return this.toResponseDto(updatedUser);
  }

  private toResponseDto(entity: User): UserResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      avatarUrl: entity.avatarUrl,
      givenName: entity.givenName,
      familyName: entity.familyName,
      textColor: entity.textColor,
      backgroundColor: entity.backgroundColor,
      language: entity.language,
      theme: entity.theme,
      activeTeamId: entity.activeTeamId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
