import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: 100, description: 'Amount to deposit', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class WithdrawDto {
  @ApiProperty({ example: 50, description: 'Amount to withdraw', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'Bank transfer to account ending in 1234',
    description: 'Withdrawal details',
  })
  @IsString()
  details: string;
}
