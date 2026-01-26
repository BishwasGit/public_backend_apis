import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, TransactionStatus, TransactionType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/folder.dto';

@Injectable()
export class MediaManagerService {
  constructor(private readonly prisma: PrismaService) { }

  async createFolder(userId: string, dto: CreateFolderDto) {
    // Check limit?
    const count = await this.prisma.mediaFolder.count({
      where: { psychologistId: userId },
    });
    if (count >= 20)
      throw new BadRequestException('Folder limit reached (20 maximum)');

    return this.prisma.mediaFolder.create({
      data: {
        name: dto.name,
        psychologistId: userId,
      },
      include: { _count: { select: { files: true } } },
    });
  }

  async listFolders(userId: string) {
    return this.prisma.mediaFolder.findMany({
      where: { psychologistId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { files: true } },
        files: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { filename: true, type: true },
        }, // Preview
      },
    });
  }

  async getFolder(userId: string, folderId: string) {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id: folderId },
      include: { files: { orderBy: { createdAt: 'desc' } } },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.psychologistId !== userId)
      throw new ForbiddenException('Access denied');

    return folder;
  }

  async renameFolder(userId: string, folderId: string, name: string) {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.psychologistId !== userId)
      throw new ForbiddenException('Access denied');

    return this.prisma.mediaFolder.update({
      where: { id: folderId },
      data: { name },
    });
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.psychologistId !== userId)
      throw new ForbiddenException('Access denied');

    // Cascade delete handles files in DB, but we should physically delete them too ideally.
    // For MVP, we'll relay on DB cascade and orphaned file cleanup later (or assume storage is cheap).

    return this.prisma.mediaFolder.delete({ where: { id: folderId } });
  }

  async addFile(
    userId: string,
    folderId: string,
    file: Express.Multer.File,
    isLocked: boolean = false,
    unlockPrice: number = 0,
  ) {
    // 1. Check folder ownership
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.psychologistId !== userId)
      throw new ForbiddenException('Access denied');

    // 2. Determine type
    const type = file.mimetype.startsWith('video')
      ? MediaType.VIDEO
      : MediaType.IMAGE;

    // 3. Save to DB (File is already on disk via Multer)
    return this.prisma.mediaFile.create({
      data: {
        filename: file.filename,
        type: type,
        folderId: folderId,
        isLocked: isLocked,
        unlockPrice: isLocked ? unlockPrice : 0,
      },
    });
  }

  async updateFileLockStatus(
    userId: string,
    fileId: string,
    isLocked: boolean,
    unlockPrice: number = 0,
  ) {
    // Get file with folder to check ownership
    const file = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
      include: { folder: true },
    });

    if (!file) throw new NotFoundException('File not found');
    if (file.folder.psychologistId !== userId)
      throw new ForbiddenException('Access denied');

    return this.prisma.mediaFile.update({
      where: { id: fileId },
      data: {
        isLocked,
        unlockPrice: isLocked ? unlockPrice : 0,
      },
    });
  }

  async unlockFile(patientId: string, fileId: string) {
    const file = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
      include: {
        folder: true,
        unlockedBy: {
          where: { patientId },
        },
      },
    });

    if (!file) throw new NotFoundException('File not found');
    if (!file.isLocked) throw new BadRequestException('File is not locked');

    // Check if already unlocked
    if (file.unlockedBy.length > 0) {
      return { message: 'Already unlocked', file };
    }

    // Check patient wallet balance
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
      include: { wallet: true },
    });

    if (!patient?.wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const price = file.unlockPrice || 0;
    if (patient.wallet.balance < price) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // FIND PROVIDER WALLET BEFORE TRANSACTION
    let providerWallet = await this.prisma.wallet.findUnique({
      where: { userId: file.folder.psychologistId }
    });
    if (!providerWallet) {
      providerWallet = await this.prisma.wallet.create({
        data: { userId: file.folder.psychologistId }
      });
    }

    const platformFee = price * 0.1;
    const providerEarnings = price * 0.9;

    return this.prisma.$transaction([
      // 1. Deduct from Patient
      this.prisma.wallet.update({
        where: { id: patient.wallet.id },
        data: { balance: { decrement: price } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: patient.wallet.id,
          amount: -price,
          type: 'MEDIA_UNLOCK' as any, // Cast to avoid enum mismatch if strict
          status: TransactionStatus.COMPLETED,
          description: `Unlocked media: ${file.filename}`,
        },
      }),
      this.prisma.mediaUnlock.create({
        data: {
          mediaId: fileId,
          patientId: patientId,
          amount: price,
        },
      }),
      // 2. Credit Psychologist
      this.prisma.wallet.update({
        where: { id: providerWallet.id },
        data: { balance: { increment: providerEarnings } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: providerWallet.id,
          amount: providerEarnings,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          description: `Earnings from media unlock: ${file.filename} (Fee: ${platformFee})`,
        },
      }),
    ]);

    return { message: 'File unlocked successfully', file };
  }

  async getPublicGallery(psychologistId: string, viewerId?: string) {
    const folders = await this.prisma.mediaFolder.findMany({
      where: { psychologistId },
      include: {
        files: {
          include: {
            unlockedBy: viewerId ? { where: { patientId: viewerId } } : false,
          },
        },
      },
    });

    return folders.flatMap((folder) =>
      folder.files.map((file) => ({
        id: file.id,
        filename: file.filename,
        type: file.type,
        folder: folder.name,
        isLocked: file.isLocked,
        unlockPrice: file.unlockPrice,
        isUnlockedByViewer: viewerId
          ? file.unlockedBy && file.unlockedBy.length > 0
          : false,
      })),
    );
  }
}
