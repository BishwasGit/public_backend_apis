import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { MediaManagerService } from './media-manager.service';

describe('MediaManagerService', () => {
    let service: MediaManagerService;
    let prisma: any;

    const mockPrismaService = {
        mediaFolder: {
            count: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        mediaFile: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MediaManagerService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<MediaManagerService>(MediaManagerService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createFolder', () => {
        it('should create a folder if limit not reached', async () => {
            prisma.mediaFolder.count.mockResolvedValue(5);
            prisma.mediaFolder.create.mockResolvedValue({ id: '1', name: 'New Folder' });

            const result = await service.createFolder('user-1', { name: 'New Folder' });
            expect(result).toEqual({ id: '1', name: 'New Folder' });
            expect(prisma.mediaFolder.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException if limit reached', async () => {
            prisma.mediaFolder.count.mockResolvedValue(20);
            await expect(service.createFolder('user-1', { name: 'New Folder' }))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getFolder', () => {
        it('should return folder if owned by user', async () => {
            const folder = { id: 'f1', psychologistId: 'user-1', files: [] };
            prisma.mediaFolder.findUnique.mockResolvedValue(folder);

            const result = await service.getFolder('user-1', 'f1');
            expect(result).toEqual(folder);
        });

        it('should throw ForbiddenException if not owned by user', async () => {
            const folder = { id: 'f1', psychologistId: 'user-2', files: [] };
            prisma.mediaFolder.findUnique.mockResolvedValue(folder);

            await expect(service.getFolder('user-1', 'f1'))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('addFile', () => {
        it('should add image file correctly', async () => {
            const folder = { id: 'f1', psychologistId: 'user-1' };
            prisma.mediaFolder.findUnique.mockResolvedValue(folder);

            const file: any = { filename: 'test.jpg', mimetype: 'image/jpeg' };
            prisma.mediaFile.create.mockResolvedValue({ id: 'file1', type: MediaType.IMAGE });

            const result = await service.addFile('user-1', 'f1', file);
            expect(prisma.mediaFile.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ type: MediaType.IMAGE })
            }));
        });

        it('should add video file correctly', async () => {
            const folder = { id: 'f1', psychologistId: 'user-1' };
            prisma.mediaFolder.findUnique.mockResolvedValue(folder);

            const file: any = { filename: 'test.mp4', mimetype: 'video/mp4' };
            prisma.mediaFile.create.mockResolvedValue({ id: 'file2', type: MediaType.VIDEO });

            const result = await service.addFile('user-1', 'f1', file);
            expect(prisma.mediaFile.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ type: MediaType.VIDEO })
            }));
        });
    });
});
