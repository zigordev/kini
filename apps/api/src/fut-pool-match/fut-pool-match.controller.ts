import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { FutPoolMatchResponseDto } from './dto/fut-pool-match-response.dto';
import { UpdateFutPoolMatchDto } from './dto/update-fut-pool-match.dto';
import { FutPoolMatchService } from './fut-pool-match.service';

@Controller('fut-pool-match')
@ApiTags('Pool match')
@UseGuards(AuthenticatedGuard)
export class FutPoolMatchController {
  constructor(private readonly futPoolMatchService: FutPoolMatchService) {}

  @Patch(':matchId')
  @ApiOperation({ summary: 'Partially update a pool match' })
  @ApiParam({ name: 'matchId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Partially update a pool match',
    type: FutPoolMatchResponseDto,
  })
  update(
    @Param('matchId', new ParseUUIDPipe({ version: '4' })) matchId: string,
    @Body() match: UpdateFutPoolMatchDto,
    @Req() req: any,
  ): Promise<FutPoolMatchResponseDto> {
    const actor = req.user as { id: string; name?: string } | undefined;
    return this.futPoolMatchService.update(matchId, match, actor);
  }
}
