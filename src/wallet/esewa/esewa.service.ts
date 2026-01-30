import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { TopupStatus, TransactionStatus, TransactionType } from '../../../generated/client';

@Injectable()
export class EsewaService {
    private readonly logger = new Logger(EsewaService.name);
    // Sandbox Credentials
    private readonly merchantId = 'EPAYTEST';
    private readonly secretKey = '8gBm/:&EnhH.1/q';
    private readonly baseUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'; 
    // User provided: Payment URL: https://uat.esewa.com.np/epay/main
    // Verification URL: https://uat.esewa.com.np/epay/transrec
    
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async initializePayment(userId: string, amount: number) {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        const orderId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        // Save initial topup record
        await this.prisma.walletTopup.create({
            data: {
                userId,
                amount,
                orderId,
                status: TopupStatus.PENDING,
            },
        });

        // Prepare eSewa form data
        // For eSewa connection, signature is required.
        // Signature string: "total_amount,transaction_uuid,product_code"
        const totalAmount = amount;
        const transactionUuid = orderId;
        const productCode = this.merchantId;
        
        const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
        const signature = this.generateSignature(signatureString);

        return {
            action: this.baseUrl,
            params: {
                amount: amount,
                tax_amount: 0,
                total_amount: totalAmount,
                transaction_uuid: transactionUuid,
                product_code: productCode,
                product_service_charge: 0,
                product_delivery_charge: 0,
                success_url: `${this.configService.get('FRONTEND_URL')}/esewa/success`, 
                failure_url: `${this.configService.get('FRONTEND_URL')}/esewa/failure`,
                signed_field_names: 'total_amount,transaction_uuid,product_code',
                signature: signature,
            }
        };
    }

    async verifyPayment(encodedData: { data: string }) {
        if (!encodedData.data) throw new BadRequestException('Missing data');

        // 1. Decode Base64
        let decodedData;
        try {
            const buffer = Buffer.from(encodedData.data, 'base64');
            decodedData = JSON.parse(buffer.toString('utf-8'));
        } catch (e) {
            throw new BadRequestException('Invalid data format');
        }

        const { transaction_code, status, total_amount, transaction_uuid, signature, signed_field_names } = decodedData;

        if (status !== 'COMPLETE') {
             throw new BadRequestException('Transaction failed or incomplete');
        }

        // 2. Verify Signature
        // Format: key1=value1,key2=value2... based on signed_field_names
        // Usually: "transaction_code=...,status=...,total_amount=...,transaction_uuid=...,product_code=...,signed_field_names=..."
        const message = signed_field_names
            .split(',')
            .map(field => `${field}=${decodedData[field]}`)
            .join(',');

        const calculatedSignature = this.generateSignature(message);

        if (calculatedSignature !== signature) {
            throw new BadRequestException('Invalid signature');
        }

        // 3. Find Transaction (Initial check)
        const topup = await this.prisma.walletTopup.findUnique({
            where: { orderId: transaction_uuid },
        });

        if (!topup) throw new BadRequestException('Invalid Order ID');
        
        // Amount check (allowing float string parsing)
        const returnedAmount = parseFloat(total_amount.replace(/,/g, ''));
        if (topup.amount !== returnedAmount) {
             throw new BadRequestException('Amount mismatch');
        }

        // 4. Update Database (Atomic Transaction)
        return this.prisma.$transaction(async (tx) => {
            // Re-fetch inside transaction to prevent race conditions
            const existingTopup = await tx.walletTopup.findUnique({
                where: { id: topup.id }
            });

            if (!existingTopup) throw new BadRequestException('Transaction not found');
            
            // Critical Idempotency Check inside transaction
            if (existingTopup.status === TopupStatus.COMPLETED) {
                return { success: true, message: 'Already verified', status: 'COMPLETED' };
            }

            // Update Topup
            await tx.walletTopup.update({
                where: { id: topup.id },
                data: {
                    status: TopupStatus.COMPLETED,
                    refId: transaction_code,
                },
            });

            // Update Wallet
            let wallet = await tx.wallet.findUnique({ where: { userId: topup.userId } });
            if (!wallet) {
                wallet = await tx.wallet.create({ data: { userId: topup.userId } });
            }

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: topup.amount } },
            });

            // Add Transaction Log
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: topup.amount,
                    type: TransactionType.DEPOSIT,
                    status: TransactionStatus.COMPLETED,
                    referenceId: `eSewa:${transaction_code}`,
                    description: 'eSewa Wallet Topup',
                },
            });

            return { success: true, status: 'VERIFIED' };
        });
    }

    private generateSignature(message: string): string {
        const hmac = crypto.createHmac('sha256', this.secretKey);
        hmac.update(message);
        return hmac.digest('base64');
    }
}
