import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmartCollectionsService } from './smart-collections.service';
import {
  CreateSmartCollectionDto,
  UpdateSmartCollectionDto,
  SmartCollectionResponseDto,
  SmartCollectionWithRecipesDto,
  FilterRulesDto,
} from './dto/smart-collection.dto';

@ApiTags('Smart Collections')
@Controller('smart-collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SmartCollectionsController {
  constructor(private readonly smartCollectionsService: SmartCollectionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a smart collection',
    description: 'Create a new smart collection with filter rules',
  })
  @ApiResponse({
    status: 201,
    description: 'Smart collection created',
    type: SmartCollectionResponseDto,
  })
  async create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateSmartCollectionDto,
  ): Promise<SmartCollectionResponseDto> {
    const collection = await this.smartCollectionsService.create(req.user.id, dto);
    return {
      ...collection,
      filterRules: collection.filterRules as FilterRulesDto,
      recipeCount: 0,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all smart collections',
    description: 'Get all smart collections for the current user with recipe counts',
  })
  @ApiResponse({
    status: 200,
    description: 'List of smart collections',
    type: [SmartCollectionResponseDto],
  })
  async findAll(@Request() req: { user: { id: string } }): Promise<SmartCollectionResponseDto[]> {
    const collections = await this.smartCollectionsService.findAll(req.user.id);
    return collections.map((c) => ({
      ...c,
      filterRules: c.filterRules as FilterRulesDto,
    }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a smart collection with recipes',
    description: 'Get a smart collection by ID with all matching recipes',
  })
  @ApiParam({ name: 'id', description: 'Smart collection ID' })
  @ApiResponse({
    status: 200,
    description: 'Smart collection with recipes',
    type: SmartCollectionWithRecipesDto,
  })
  @ApiResponse({ status: 404, description: 'Smart collection not found' })
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<SmartCollectionWithRecipesDto> {
    const collection = await this.smartCollectionsService.findOne(req.user.id, id);
    return {
      ...collection,
      filterRules: collection.filterRules as FilterRulesDto,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a smart collection',
    description: 'Update a smart collection (cannot modify system collections)',
  })
  @ApiParam({ name: 'id', description: 'Smart collection ID' })
  @ApiResponse({
    status: 200,
    description: 'Smart collection updated',
    type: SmartCollectionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Smart collection not found' })
  @ApiResponse({ status: 403, description: 'Cannot modify system collections' })
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateSmartCollectionDto,
  ): Promise<SmartCollectionResponseDto> {
    const collection = await this.smartCollectionsService.update(
      req.user.id,
      id,
      dto,
    );
    return {
      ...collection,
      filterRules: collection.filterRules as FilterRulesDto,
      recipeCount: 0,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a smart collection',
    description: 'Delete a smart collection (cannot delete system collections)',
  })
  @ApiParam({ name: 'id', description: 'Smart collection ID' })
  @ApiResponse({ status: 200, description: 'Smart collection deleted' })
  @ApiResponse({ status: 404, description: 'Smart collection not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete system collections' })
  async remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.smartCollectionsService.remove(req.user.id, id);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Preview filter results',
    description: 'Preview which recipes would be included with given filter rules',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview of matching recipes',
  })
  async previewFilter(@Request() req: { user: { id: string } }, @Body() filters: FilterRulesDto) {
    return this.smartCollectionsService.previewFilter(req.user.id, filters);
  }

  @Post('init-system')
  @ApiOperation({
    summary: 'Initialize system collections',
    description: 'Create default system smart collections for the current user',
  })
  @ApiResponse({
    status: 201,
    description: 'System collections created',
  })
  async initSystemCollections(@Request() req: { user: { id: string } }) {
    await this.smartCollectionsService.createSystemCollections(req.user.id);
    return { success: true, message: 'System collections initialized' };
  }
}
