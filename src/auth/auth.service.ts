import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(identifier: string, pin: string): Promise<any> {
    const user = await this.usersService.findOneByIdentifier(identifier);

    if (!user) return null;

    // Check Lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException(
        'Account locked due to too many failed attempts. Please try again in 15 minutes.',
      );
    }

    // Multi-Identifier Verification Check
    if (user.email === identifier && !user.isEmailVerified) return null;
    if (user.phoneNumber === identifier && !user.isPhoneVerified) return null;

    if (await bcrypt.compare(pin, user.hashedPin)) {
      // Success: Reset attempts
      if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
        await this.usersService.updateLoginAttempts(user.id, {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        });
      }
      const { hashedPin, ...result } = user;
      return result;
    } else {
      // Failure: Increment attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      const updateData: { failedLoginAttempts: number; lockoutUntil?: Date } = {
        failedLoginAttempts: attempts,
      };

      if (attempts >= MAX_ATTEMPTS) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      }

      await this.usersService.updateLoginAttempts(user.id, updateData);
      return null;
    }
  }

  async login(user: any) {
    const payload = {
      username: user.alias,
      sub: user.id,
      role: user.role,
      alias: user.alias, // Add alias explicitly for LiveKit participant name
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        alias: user.alias,
        role: user.role,
        id: user.id,
      },
    };
  }

  async register(alias: string, pin: string, role?: any, dateOfBirth?: string, email?: string) {
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const ageDifMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDifMs); // miliseconds from epoch
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      if (age < 18) {
        throw new Error(
          'Registration Rejected: You must be 18 or older to use this platform.',
        );
      }
      // Pass raw pin, let usersService hash it
      return this.usersService.create({
        alias,
        role,
        pin,
        dateOfBirth: dob.toISOString(),
        email,
      });
    }

    // For legacy/dev flows without DOB (optional for now, but strictly warned)
    return this.usersService.create({ alias, role, pin, email });
  }

  async changePassword(userId: string, currentPin: string, newPin: string) {
    const user = await this.usersService.findOneWithSecrets(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(currentPin, user.hashedPin);
    if (!isMatch) {
      throw new UnauthorizedException('Current password incorrect');
    }

    return this.usersService.update(userId, { pin: newPin });
  }
}
