import { Body, Controller, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuditAction, AuditEntity } from '../audit/audit.service';
import { Audit } from '../audit/decorators/audit.decorator';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  @Audit(AuditEntity.USER, AuditAction.LOGIN)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and receive JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT access token',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid alias or PIN' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.alias,
      loginDto.pin,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('signup')
  @Audit(AuditEntity.USER, AuditAction.CREATE)
  @ApiOperation({
    summary: 'User registration',
    description: 'Create new user account (Patient, Psychologist, or Admin)',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid input data or alias already exists',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.register(
      signupDto.alias,
      signupDto.pin,
      signupDto.role,
      undefined, // dateOfBirth (optional)
      signupDto.email,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@Request() req, @Body() body: any) {
    // Expect body: { currentPin, newPin }
    return this.authService.changePassword(
      req.user.id,
      body.currentPin,
      body.newPin
    );
  }
}
