import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomCacheKey } from '../common/decorators/cache-key.decorator';
import { CustomCacheInterceptor } from '../common/interceptors/cache.interceptor';
import { ProfileService } from './profile.service';

// Multer config for profile image upload
const profileImageStorage = diskStorage({
  destination: './private_uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const ext = extname(file.originalname).toLowerCase();
    return cb(null, `profile_${randomName}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'), false);
  }
  cb(null, true);
};

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateProfile(@Request() req, @Body() body: any) {
    // Whitelist allowed fields to prevent overwriting sensitive data (like role, id, password)
    const allowedFields = [
      'alias', 'bio', 'specialties', 'languages',
      'experience', 'education', 'price', 'hourlyRate',
      'email', 'phoneNumber', 'gender', 'dateOfBirth',
      'notificationPreferences', 'theme', 'sessionTimeout', 'status',
      'isProfileVisible', 'sexualOrientation'
    ];

    const filteredBody = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    return this.profileService.updateProfile(req.user.id, filteredBody);
  }

  // Profile image upload endpoint
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: profileImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    }),
  )
  async uploadProfileImage(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    return this.profileService.updateProfileImage(req.user.id, file.filename);
  }

  // Public endpoint to find psychologists
  @Get('psychologists')
  @UseInterceptors(CustomCacheInterceptor)
  @CustomCacheKey('psychologists_search')
  searchPsychologists() {
    return this.profileService.searchPsychologists();
  }

  @Get('psychologists/:id')
  @UseInterceptors(CustomCacheInterceptor)
  @CustomCacheKey('psychologist_public_profile')
  getPublicProfile(@Param('id') id: string) {
    return this.profileService.getPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reviews')
  getMyReviews(@Request() req) {
    return this.profileService.getReviews(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:reviewId/toggle-visibility')
  toggleReviewVisibility(@Request() req, @Param('reviewId') reviewId: string) {
    return this.profileService.toggleReviewVisibility(req.user.id, reviewId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/verify')
  async verifyPsychologist(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { isVerified: boolean },
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized'); // NestJS Exception Filter will handle or use UnauthorizedException
    }
    return this.profileService.verifyPsychologist(id, body.isVerified);
  }
}
