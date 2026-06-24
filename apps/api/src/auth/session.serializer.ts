import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(
    user: User,
    done: (err: Error | null, payload: string) => void,
  ): void {
    done(null, user.id);
  }

  async deserializeUser(
    userId: string,
    done: (err: Error | null, payload?: User | null) => void,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      done(null, user ?? null);
    } catch (error) {
      done(error as Error);
    }
  }
}
