import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiTags('wallet')
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance returned successfully' })
  getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Deposit successful' })
  deposit(@Request() req, @Body('amount') amount: number) {
    // For MVP, userId is taken from token, but in real app this webhook might come from Payment Gateway
    return this.walletService.deposit(req.user.id, amount);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions returned successfully' })
  getTransactions(@Request() req, @Query('referenceId') referenceId?: string) {
    return this.walletService.getTransactions(req.user.id, referenceId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 50 },
        details: { type: 'string', example: 'Bank account info' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Withdrawal request created' })
  withdraw(@Request() req, @Body() body: { amount: number; details: string }) {
    return this.walletService.withdraw(req.user.id, body.amount, body.details);
  }
}
