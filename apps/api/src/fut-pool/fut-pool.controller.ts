import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFutPoolDto } from './dto/create-fut-pool.dto';
import { FutPoolQueryDto } from './dto/fut-pool-query.dto';
import {
  FutPoolPaginatedResponseDto,
  FutPoolResponseDto,
} from './dto/fut-pool-response.dto';
import { StatsDto } from './dto/stats.dto';
import { UpdateFutPoolDto } from './dto/update-fut-pool.dto';
import { FutPoolService } from './fut-pool.service';

@Controller('fut-pool')
@ApiTags('Pool')
export class FutPoolController {
  constructor(private readonly futPoolService: FutPoolService) {}

  @Get()
  @ApiOperation({ summary: 'List Fut Pools with pagination and sorting' })
  @ApiOkResponse({
    description: 'Paginated list of Fut Pools',
    type: FutPoolPaginatedResponseDto,
  })
  getFutPools(
    @Query() query: FutPoolQueryDto,
  ): Promise<FutPoolPaginatedResponseDto> {
    return this.futPoolService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Aggregate success totals per user across all pools',
  })
  @ApiOkResponse({
    description: 'Total successes per user for every Fut Pool',
    type: StatsDto,
    isArray: true,
  })
  getStats(): Promise<StatsDto> {
    return this.futPoolService.getStats();
  }

  @Post()
  @ApiOperation({ summary: 'Create a Fut Pool' })
  @ApiCreatedResponse({
    description: 'Created Fut Pool',
    type: FutPoolResponseDto,
  })
  createPool(
    @Body() payload: CreateFutPoolDto,
    @Req() req: any,
  ): Promise<FutPoolResponseDto> {
    const actor = req.user as { id: string; name?: string } | undefined;
    return this.futPoolService.createPool(payload, actor);
  }

  @Patch(':poolId')
  @ApiOperation({ summary: 'Partially update a Fut Pool' })
  @ApiParam({ name: 'poolId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Updated Fut Pool',
    type: FutPoolResponseDto,
  })
  updatePool(
    @Param('poolId', new ParseUUIDPipe({ version: '4' })) poolId: string,
    @Body() payload: UpdateFutPoolDto,
    @Req() req: any,
  ): Promise<FutPoolResponseDto> {
    const actor = req.user as { id: string; name?: string } | undefined;
    return this.futPoolService.updatePool(poolId, payload, actor);
  }
}
