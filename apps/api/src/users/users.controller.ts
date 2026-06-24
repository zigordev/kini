import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthenticatedGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List platform users' })
  @ApiOkResponse({
    description: 'List of users available for assignment',
    type: UserSummaryDto,
    isArray: true,
  })
  async listUsers(): Promise<UserSummaryDto[]> {
    const users = await this.usersService.listUsers();
    return users.map(UserSummaryDto.fromEntity);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update user profile' })
  @ApiOkResponse({
    description: 'Updated user profile',
    type: UserResponseDto,
  })
  async updateUser(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = req.user as any;
    return this.usersService.updateUser(user.id, updateUserDto);
  }
}
