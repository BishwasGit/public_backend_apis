
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../generated/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
    constructor(private readonly disputesService: DisputesService) { }

    @Post()
    @ApiOperation({ summary: 'Report a dispute for a session' })
    create(@Req() req, @Body() createDisputeDto: CreateDisputeDto) {
        return this.disputesService.create(req.user.id, createDisputeDto);
    }

    @Get()
    @ApiOperation({ summary: 'List all disputes (Admin sees all, User sees own)' })
    findAll(@Req() req) {
        return this.disputesService.findAll(req.user.id, req.user.role);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get dispute details' })
    findOne(@Param('id') id: string) {
        return this.disputesService.findOne(id);
    }

    @Post(':id/resolve')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Resolve a dispute (Admin only)' })
    resolve(@Param('id') id: string, @Req() req, @Body() resolveDto: ResolveDisputeDto) {
        return this.disputesService.resolve(id, req.user.id, resolveDto);
    }
}
