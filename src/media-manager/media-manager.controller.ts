import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFolderDto, RenameFolderDto } from './dto/folder.dto';
import { MediaManagerService } from './media-manager.service';

// Allowed file types (whitelist)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer Config with Security
const storage = diskStorage({
  destination: './private_uploads',
  filename: (req, file, cb) => {
    // Generate secure random filename
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    // Sanitize extension
    const ext = extname(file.originalname).toLowerCase();
    return cb(null, `${randomName}${ext}`);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      ),
      false,
    );
  }
  cb(null, true);
};

@Controller('media-manager')
@UseGuards(JwtAuthGuard)
@ApiTags('media-manager')
@ApiBearerAuth()
export class MediaManagerController {
  constructor(private readonly service: MediaManagerService) { }

  @Post('folders')
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({ status: 201, description: 'Folder created successfully' })
  createFolder(@Request() req, @Body() dto: CreateFolderDto) {
    return this.service.createFolder(req.user.id, dto);
  }

  @Get('folders')
  @ApiOperation({ summary: 'List all folders for the user' })
  @ApiResponse({ status: 200, description: 'List of folders' })
  listFolders(@Request() req) {
    return this.service.listFolders(req.user.id);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get folder details' })
  @ApiResponse({ status: 200, description: 'Folder details' })
  getFolder(@Request() req, @Param('id') id: string) {
    return this.service.getFolder(req.user.id, id);
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Rename a folder' })
  @ApiResponse({ status: 200, description: 'Folder renamed successfully' })
  renameFolder(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RenameFolderDto,
  ) {
    return this.service.renameFolder(req.user.id, id, dto.name);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  deleteFolder(@Request() req, @Param('id') id: string) {
    return this.service.deleteFolder(req.user.id, id);
  }

  @Post('folders/:id/upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage,
      fileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @ApiOperation({ summary: 'Upload files to a folder' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        isLocked: { type: 'string' },
        unlockPrice: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadFiles(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { isLocked?: string; unlockPrice?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const isLocked = body.isLocked === 'true';
    const unlockPrice = parseFloat(body.unlockPrice || '0') || 0;

    const results: any[] = [];
    for (const file of files) {
      const res = await this.service.addFile(
        req.user.id,
        id,
        file,
        isLocked,
        unlockPrice,
      );
      results.push(res);
    }
    return results;
  }

  @Patch('files/:id/lock')
  @ApiOperation({ summary: 'Update file lock status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isLocked: { type: 'boolean' },
        unlockPrice: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'File lock status updated' })
  async updateFileLock(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { isLocked: boolean; unlockPrice?: number },
  ) {
    return this.service.updateFileLockStatus(
      req.user.id,
      id,
      body.isLocked,
      body.unlockPrice || 0,
    );
  }

  @Post('files/:id/unlock')
  @ApiOperation({ summary: 'Unlock a file (purchase)' })
  @ApiResponse({ status: 200, description: 'File unlocked successfully' })
  async unlockFile(@Request() req, @Param('id') id: string) {
    return this.service.unlockFile(req.user.id, id);
  }

  @Get('public-gallery/:psychologistId')
  @ApiOperation({ summary: 'Get public gallery of a psychologist' })
  @ApiResponse({ status: 200, description: 'Public gallery content' })
  async getPublicGallery(
    @Param('psychologistId') psychologistId: string,
    @Query('viewerId') viewerId?: string,
  ) {
    return this.service.getPublicGallery(psychologistId, viewerId);
  }
}
