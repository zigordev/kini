import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { FutPoolResponseDto } from '../fut-pool/dto/fut-pool-response.dto';
import { User } from '../users/user.entity';
import { AvailablePoolsService } from './available-pools.service';

@Controller('fut-pools')
@ApiTags('Available pools')
@UseGuards(AuthenticatedGuard)
export class FutPoolResultsController {
  constructor(private readonly availablePools: AvailablePoolsService) {}

  @Post(':poolId/check-results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch official results and mark team pool correctness',
  })
  @ApiParam({ name: 'poolId', format: 'uuid' })
  @ApiOkResponse({ type: FutPoolResponseDto })
  checkResults(
    @Param('poolId', new ParseUUIDPipe({ version: '4' })) poolId: string,
    @Req() req: any
  ): Promise<FutPoolResponseDto> {
    return this.availablePools.checkTeamPoolResults(poolId, req.user as User);
  }
}
