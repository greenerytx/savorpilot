import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto, UpdateChallengeDto, CreateEntryDto, ChallengeQueryDto } from './dto/challenge.dto';

interface AuthRequest {
  user: { id: string };
}

interface OptionalAuthRequest {
  user?: { id: string } | null;
}

@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createChallenge(@Request() req: AuthRequest, @Body() dto: CreateChallengeDto) {
    return this.challengesService.createChallenge(req.user.id, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getChallenges(@Query() query: ChallengeQueryDto) {
    return this.challengesService.getChallenges(query);
  }

  @Get('active')
  @UseGuards(OptionalJwtAuthGuard)
  getActiveChallenge() {
    return this.challengesService.getActiveChallenge();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getChallengeById(@Param('id', ParseUUIDPipe) id: string, @Request() req: OptionalAuthRequest) {
    return this.challengesService.getChallengeById(id, req.user?.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateChallenge(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.challengesService.updateChallenge(id, req.user.id, dto);
  }

  @Post(':id/entries')
  @UseGuards(JwtAuthGuard)
  submitEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
    @Body() dto: CreateEntryDto,
  ) {
    return this.challengesService.submitEntry(id, req.user.id, dto);
  }

  @Get(':id/entries')
  @UseGuards(OptionalJwtAuthGuard)
  getEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: OptionalAuthRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.challengesService.getEntries(
      id,
      req.user?.id,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post(':id/entries/:entryId/vote')
  @UseGuards(JwtAuthGuard)
  voteForEntry(
    @Param('id', ParseUUIDPipe) challengeId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Request() req: AuthRequest,
  ) {
    return this.challengesService.voteForEntry(entryId, req.user.id);
  }

  @Delete(':id/entries/:entryId/vote')
  @UseGuards(JwtAuthGuard)
  removeVote(
    @Param('id', ParseUUIDPipe) challengeId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Request() req: AuthRequest,
  ) {
    return this.challengesService.removeVote(entryId, req.user.id);
  }

  @Get(':id/leaderboard')
  @UseGuards(OptionalJwtAuthGuard)
  getLeaderboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    return this.challengesService.getLeaderboard(id, limit ? parseInt(limit) : undefined);
  }

  @Delete(':id/entries/:entryId')
  @UseGuards(JwtAuthGuard)
  deleteEntry(
    @Param('id', ParseUUIDPipe) challengeId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Request() req: AuthRequest,
  ) {
    return this.challengesService.deleteEntry(entryId, req.user.id);
  }

  @Post('update-statuses')
  @UseGuards(JwtAuthGuard)
  updateChallengeStatuses() {
    return this.challengesService.updateChallengeStatuses();
  }
}
