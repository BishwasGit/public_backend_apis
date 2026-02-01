import { Body, Controller, Delete, Get, Param, Post, Request, UploadedFile, UseGuards, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalService } from './withdrawal.service';

const qrCodeStorage = diskStorage({
    destination: './private_uploads',
    filename: (req, file, cb) => {
        const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
        const ext = extname(file.originalname).toLowerCase();
        return cb(null, `qr_${randomName}${ext}`);
    },
});

const imageFileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'), false);
    }
    cb(null, true);
};

@ApiTags('payout-methods')
@ApiBearerAuth()
@Controller('payout-methods')
export class PayoutMethodsController {
    constructor(private withdrawalService: WithdrawalService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get my payout methods' })
    async getPayoutMethods(@Request() req) {
        return this.withdrawalService.getPayoutMethods(req.user.id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Add a payout method' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('qrCode', {
        storage: qrCodeStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'ESEWA' },
                details: { type: 'string', example: '{"mobileNumber": "9800000000"}' },
                isDefault: { type: 'boolean' },
                qrCode: { type: 'string', format: 'binary' }
            }
        }
    })
    async addPayoutMethod(
        @Request() req,
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        let details = body.details;
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details);
            } catch (e) {
                // handle error or leave as is
            }
        }

        if (file) {
            details = { ...details, qrCode: file.filename };
        }

        return this.withdrawalService.addPayoutMethod(
            req.user.id,
            body.type,
            details,
            body.isDefault === 'true' || body.isDefault === true,
        );
    }

    @Get('qr/:filename')
    @ApiOperation({ summary: 'Get payout method QR code' })
    async getQrCode(@Param('filename') filename: string, @Request() req, @Res() res) {
        return res.sendFile(filename, { root: './private_uploads' });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete a payout method' })
    async deletePayoutMethod(@Request() req, @Param('id') id: string) {
        return this.withdrawalService.deletePayoutMethod(req.user.id, id);
    }
}
