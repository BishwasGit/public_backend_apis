import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EsewaService } from './esewa.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('wallet/esewa')
export class EsewaController {
  constructor(private readonly esewaService: EsewaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('init')
  async initPayment(@Req() req, @Body() body: { amount: number; successUrl?: string; failureUrl?: string }) {
    const userId = (req as any).user['id']; // Assumes Request has user from JwtStrategy
    return this.esewaService.initializePayment(userId, body.amount, body.successUrl, body.failureUrl);
  }

  // Verification is called by Frontend after redirect
  // So likely the user is authenticated.
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyPayment(@Body() body: { data: string }) {
    return this.esewaService.verifyPayment(body);
  }
}
