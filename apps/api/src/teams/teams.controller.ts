import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { User } from 'src/users/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteTeamUserDto } from './dto/invite-team-user.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@ApiTags('Teams')
@UseGuards(AuthenticatedGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List teams for the current user' })
  @ApiOkResponse({ type: TeamResponseDto, isArray: true })
  listTeams(@Req() req: any): Promise<TeamResponseDto[]> {
    return this.teamsService.listTeams(req.user as User);
  }

  @Post()
  @ApiOperation({ summary: 'Create a team' })
  @ApiCreatedResponse({ type: TeamResponseDto })
  createTeam(
    @Body() payload: CreateTeamDto,
    @Req() req: any,
  ): Promise<TeamResponseDto> {
    return this.teamsService.createTeam(payload, req.user as User);
  }

  @Post(':teamId/invite')
  @ApiOperation({ summary: 'Invite a user to a team' })
  inviteUser(
    @Param('teamId', new ParseUUIDPipe({ version: '4' })) teamId: string,
    @Body() payload: InviteTeamUserDto,
    @Req() req: any,
  ): Promise<{ success: true; message: string }> {
    return this.teamsService.inviteUser(
      teamId,
      payload.email,
      req.user as User,
    );
  }

  @Post(':teamId/accept-invitation')
  @ApiOperation({ summary: 'Accept a team invitation' })
  acceptInvitation(
    @Param('teamId', new ParseUUIDPipe({ version: '4' })) teamId: string,
    @Req() req: any,
  ): Promise<{ success: true; message: string; team: TeamResponseDto }> {
    return this.teamsService.acceptInvitation(teamId, req.user as User);
  }
}
