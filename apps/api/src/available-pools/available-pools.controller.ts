import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
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
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { FutPoolResponseDto } from '../fut-pool/dto/fut-pool-response.dto';
import { User } from '../users/user.entity';
import { AddAvailablePoolToTeamDto } from './dto/add-available-pool-to-team.dto';
import { AvailablePoolJackpotResponseDto } from './dto/available-pool-jackpot-response.dto';
import { AvailablePoolResponseDto } from './dto/available-pool-response.dto';
import { UpdateAvailablePoolMatchResultDto } from './dto/update-available-pool-match-result.dto';
import { AvailablePoolsService } from './available-pools.service';

@Controller('available-pools')
@ApiTags('Available pools')
@UseGuards(AuthenticatedGuard)
export class AvailablePoolsController {
  constructor(private readonly availablePools: AvailablePoolsService) {}

  @Get()
  @ApiOperation({ summary: 'List raw available pools from external providers' })
  @ApiOkResponse({ type: AvailablePoolResponseDto, isArray: true })
  list(): Promise<AvailablePoolResponseDto[]> {
    return this.availablePools.list();
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Synchronize available pools from external providers',
  })
  @ApiOkResponse({ type: AvailablePoolResponseDto, isArray: true })
  sync(): Promise<AvailablePoolResponseDto[]> {
    return this.availablePools.syncUpcomingPools();
  }

  @Get('jackpot')
  @ApiOperation({ summary: 'Get the current saved Quiniela jackpot' })
  @ApiOkResponse({ type: AvailablePoolJackpotResponseDto })
  jackpot(): Promise<AvailablePoolJackpotResponseDto> {
    return this.availablePools.currentJackpot();
  }

  @Patch(':availablePoolId/matches/:order/result')
  @ApiOperation({
    summary: 'Set the official result for an available pool match',
  })
  @ApiOkResponse({ type: AvailablePoolResponseDto })
  updateMatchResult(
    @Param('availablePoolId', new ParseUUIDPipe({ version: '4' }))
    availablePoolId: string,
    @Param('order', ParseIntPipe) order: number,
    @Body() payload: UpdateAvailablePoolMatchResultDto,
  ): Promise<AvailablePoolResponseDto> {
    return this.availablePools.updateAvailablePoolMatchResult(
      availablePoolId,
      order,
      payload.officialResults,
    );
  }

  @Post(':availablePoolId/add-to-team')
  @ApiOperation({ summary: 'Add an available pool to one of my teams' })
  @ApiCreatedResponse({ type: FutPoolResponseDto })
  addToTeam(
    @Param('availablePoolId', new ParseUUIDPipe({ version: '4' }))
    availablePoolId: string,
    @Body() payload: AddAvailablePoolToTeamDto,
    @Req() req: any,
  ): Promise<FutPoolResponseDto> {
    return this.availablePools.addToTeam(
      availablePoolId,
      payload.teamId,
      req.user as User,
    );
  }

  @Post('team-pools/:poolId/check-results')
  @ApiOperation({
    summary: 'Fetch official results and mark team pool correctness',
  })
  @ApiOkResponse({ type: FutPoolResponseDto })
  checkResults(
    @Param('poolId', new ParseUUIDPipe({ version: '4' })) poolId: string,
    @Req() req: any,
  ): Promise<FutPoolResponseDto> {
    return this.availablePools.checkTeamPoolResults(poolId, req.user as User);
  }
}
