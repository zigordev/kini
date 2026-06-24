import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleStrategy } from './google.strategy';
import { MobileAuthTokenStore } from './mobile-auth-token.store';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule),
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    SessionSerializer,
    AuthenticatedGuard,
    GoogleAuthGuard,
    MobileAuthTokenStore,
  ],
  exports: [AuthService],
})
export class AuthModule {}
