import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    try {
      // Hash the PIN
      const hashedPin = await bcrypt.hash(createUserDto.pin, 10);

      return await this.prisma.user.create({
        data: {
          alias: createUserDto.alias,
          email: createUserDto.email,
          phoneNumber: createUserDto.phoneNumber,
          role: createUserDto.role || 'PATIENT',
          hashedPin,
          dateOfBirth: createUserDto.dateOfBirth
            ? new Date(createUserDto.dateOfBirth)
            : undefined,
          hasAcceptedTerms: false,
          gender: createUserDto.gender,
          sexualOrientation: createUserDto.sexualOrientation,
        },
        select: {
          id: true,
          alias: true,
          email: true,
          phoneNumber: true,
          role: true,
          dateOfBirth: true,
          gender: true,
          sexualOrientation: true,
          isVerified: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Alias already taken');
      }
      throw error;
    }
  }

  async updateStatus(id: string, isOnline: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isOnline },
    });
  }

  async findAll(
    pagination: { page?: number; limit?: number },
    role?: any,
    filters?: {
      gender?: string;
      sexualOrientation?: string;
      minAge?: number;
      maxAge?: number;
      search?: string;
    },
  ) {
    const where: any = role ? { role } : {};

    if (filters) {
      if (filters.search) {
        where.OR = [
          { alias: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters.gender) where.gender = filters.gender;
      if (filters.sexualOrientation)
        where.sexualOrientation = filters.sexualOrientation;

      if (filters.minAge || filters.maxAge) {
        const today = new Date();
        where.dateOfBirth = {};

        if (filters.minAge) {
          // To be minAge, DOB must be <= (today - minYears)
          const maxDob = new Date(
            today.getFullYear() - filters.minAge,
            today.getMonth(),
            today.getDate(),
          );
          where.dateOfBirth.lte = maxDob;
        }

        if (filters.maxAge) {
          // To be maxAge, DOB must be >= (today - maxYears - 1) roughly
          const minDob = new Date(
            today.getFullYear() - filters.maxAge - 1,
            today.getMonth(),
            today.getDate(),
          );
          where.dateOfBirth.gte = minDob;
        }
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          alias: true,
          role: true,
          email: true,
          phoneNumber: true,
          dateOfBirth: true,
          isOnline: true,
          isVerified: true,
          createdAt: true,
          deletedAt: true,
          specialties: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
    };
  }

  async verifyUser(id: string, isVerified: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified },
    });
  }

  async findOneByAlias(alias: string) {
    return this.prisma.user.findUnique({
      where: { alias },
    });
  }

  async findOneByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { alias: identifier },
          { email: identifier },
          { phoneNumber: identifier },
        ],
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        alias: true,
        email: true,
        phoneNumber: true,
        role: true,
        dateOfBirth: true,
        gender: true,
        sexualOrientation: true,
        isOnline: true,
        isVerified: true,
        createdAt: true,
        deletedAt: true,
        specialties: true,
        // hashedPin: false // Excluded by default
      },
    });
  }

  async findOneWithSecrets(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = {};

    if (updateUserDto.alias !== undefined) data.alias = updateUserDto.alias;
    if (updateUserDto.email !== undefined) data.email = updateUserDto.email;
    if (updateUserDto.phoneNumber !== undefined)
      data.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.role !== undefined) data.role = updateUserDto.role;
    if (updateUserDto.gender !== undefined) data.gender = updateUserDto.gender;
    if (updateUserDto.sexualOrientation !== undefined)
      data.sexualOrientation = updateUserDto.sexualOrientation;
    if (updateUserDto.dateOfBirth !== undefined)
      data.dateOfBirth = new Date(updateUserDto.dateOfBirth);
    if (updateUserDto.isVerified !== undefined)
      data.isVerified = updateUserDto.isVerified;
    if (updateUserDto.bio !== undefined) data.bio = updateUserDto.bio;

    // Hash PIN if provided
    if (updateUserDto.pin) {
      data.hashedPin = await bcrypt.hash(updateUserDto.pin, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        alias: true,
        email: true,
        phoneNumber: true,
        role: true,
        dateOfBirth: true,
        gender: true,
        sexualOrientation: true,
        isOnline: true,
        isVerified: true,
        bio: true,
        createdAt: true,
        deletedAt: true,
      },
    });
  }

  // Internal method for security-related updates (login attempts, lockout)
  async updateLoginAttempts(
    id: string,
    data: { failedLoginAttempts?: number; lockoutUntil?: Date | null },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
