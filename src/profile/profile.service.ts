import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }, // Optional: include wallet info
    });
    if (!user) throw new NotFoundException('User not found');
    const { hashedPin, ...result } = user;
    return result;
  }

  async getPublicProfile(psychologistId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: psychologistId },
      include: {
        serviceOptions: {
          where: { isEnabled: true, deletedAt: null },
        },
        receivedReviews: {
          where: { isHidden: false },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            patient: { select: { alias: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!user || user.role !== Role.PSYCHOLOGIST) {
      throw new NotFoundException('Psychologist not found');
    }

    const reviews = user.receivedReviews || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Only return safe public info
    return {
      id: user.id,
      alias: user.alias,
      bio: user.bio,
      specialties: user.specialties,
      languages: user.languages,
      services: user.serviceOptions, // Map to services property
      hourlyRate: user.hourlyRate,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      status: user.status,
      reviews,
      averageRating,
      reviewCount: reviews.length
    };
  }

  async getReviews(psychologistId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { psychologistId },
      include: {
        patient: { select: { alias: true } },
        session: {
          select: {
            startTime: true,
            endTime: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reviews;
  }

  async toggleReviewVisibility(psychologistId: string, reviewId: string) {
    // Verify the review belongs to this psychologist
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.psychologistId !== psychologistId) {
      throw new NotFoundException('You do not have permission to modify this review');
    }

    // Toggle visibility
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: !review.isHidden }
    });
  }

  async updateProfile(userId: string, data: any) {
    // Build update object with only defined values
    const updateData: any = {};
    
    if (data.alias !== undefined) updateData.alias = data.alias;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.specialties !== undefined) updateData.specialties = data.specialties;
    if (data.languages !== undefined) updateData.languages = data.languages;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.isProfileVisible !== undefined) updateData.isProfileVisible = data.isProfileVisible;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sexualOrientation !== undefined) updateData.sexualOrientation = data.sexualOrientation;
    
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async verifyPsychologist(id: string, isVerified: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified },
    });
  }

  async updateProfileImage(userId: string, filename: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: filename },
      select: { id: true, profileImage: true },
    });
  }

  async searchPsychologists() {
    return this.prisma.user.findMany({
      where: {
        role: 'PSYCHOLOGIST',
        serviceOptions: {
          some: {
            isEnabled: true,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        alias: true,
        bio: true,
        specialties: true,
        languages: true,
        hourlyRate: true,
        createdAt: true,
        isVerified: true,
        profileImage: true, // Include profile image
      },
    });
  }
}
