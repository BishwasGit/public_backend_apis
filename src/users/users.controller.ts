import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditAction, AuditEntity } from '../audit/audit.service';
import { Audit } from '../audit/decorators/audit.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomCacheKey } from '../common/decorators/cache-key.decorator';
import { CustomCacheInterceptor } from '../common/interceptors/cache.interceptor';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Audit(AuditEntity.USER, AuditAction.CREATE)
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseInterceptors(CustomCacheInterceptor)
  @CustomCacheKey('all_users')
  @ApiOperation({
    summary: 'Get all users with optional filters',
  })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  findAll(@Query() query: ListUsersDto) {
    const { role, gender, sexualOrientation, minAge, maxAge } = query;
    return this.usersService.findAll({}, role, {
      gender,
      sexualOrientation,
      minAge,
      maxAge,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @UseInterceptors(CustomCacheInterceptor)
  @CustomCacheKey('user')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update user online status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(@Param('id') id: string, @Body('isOnline') isOnline: boolean) {
    return this.usersService.updateStatus(id, isOnline);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Audit(AuditEntity.USER, AuditAction.VERIFY)
  @ApiOperation({ summary: 'Verify user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User verified' })
  verify(@Param('id') id: string, @Body('isVerified') isVerified: boolean) {
    return this.usersService.verifyUser(id, isVerified);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Audit(AuditEntity.USER, AuditAction.UPDATE)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Audit(AuditEntity.USER, AuditAction.DELETE)
  @ApiOperation({ summary: 'Soft delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Audit(AuditEntity.USER, AuditAction.UPDATE)
  @ApiOperation({ summary: 'Restore deleted user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  restoreUser(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
}
