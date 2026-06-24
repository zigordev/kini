import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { NotificationToken } from './notification-token.entity';

class RegisterTokenDto {
  token!: string;
  platform?: string;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthenticatedGuard)
export class NotificationController {
  constructor(
    @InjectRepository(NotificationToken)
    private readonly tokens: Repository<NotificationToken>,
  ) {}

  @Post('register')
  @ApiOkResponse({ description: 'Register or refresh a device push token' })
  async register(
    @Req() req: any,
    @Body() body: RegisterTokenDto,
  ): Promise<{ ok: true }> {
    const user = req.user as { id: string };

    const existing = await this.tokens.findOne({
      where: { token: body.token },
    });
    if (existing) {
      existing.userId = user.id;
      existing.platform = body.platform ?? existing.platform;
      existing.active = true;
      await this.tokens.save(existing);
      return { ok: true };
    }

    const record = this.tokens.create({
      token: body.token,
      platform: body.platform ?? null,
      userId: user.id,
      active: true,
    });
    await this.tokens.save(record);
    return { ok: true };
  }

  @Delete('unregister')
  @ApiOkResponse({ description: 'Deactivate a device push token' })
  async unregister(@Body() body: RegisterTokenDto): Promise<{ ok: true }> {
    const existing = await this.tokens.findOne({
      where: { token: body.token },
    });
    if (existing) {
      existing.active = false;
      await this.tokens.save(existing);
    }
    return { ok: true };
  }
}
