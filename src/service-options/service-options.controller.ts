import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateServiceOptionDto } from './dto/create-service-option.dto';
import { ServiceOptionsService } from './service-options.service';

@Controller('service-options')
export class ServiceOptionsController {
  constructor(private readonly serviceOptionsService: ServiceOptionsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createDto: CreateServiceOptionDto) {
    return this.serviceOptionsService.create(req.user.id, createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateServiceOptionDto>,
  ) {
    return this.serviceOptionsService.update(req.user.id, id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyOptions(@Request() req) {
    return this.serviceOptionsService.findAllByPsychologist(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.serviceOptionsService.findById(id);
  }

  // Public endpoint for patients to see options
  @Get('psychologist/:id')
  findByPsychologist(@Param('id') id: string) {
    return this.serviceOptionsService.findAllByPsychologist(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.serviceOptionsService.remove(req.user.id, id);
  }
}
