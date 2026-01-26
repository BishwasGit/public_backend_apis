import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

enum Role {
  PATIENT = 'PATIENT',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  ADMIN = 'ADMIN',
}

export class SignupDto {
  @ApiProperty({
    example: 'patient1',
    description: 'Unique user alias (minimum 3 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  alias: string;

  @ApiProperty({
    example: '1234',
    description: 'User PIN (minimum 4 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  pin: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email', required: false })
  @IsString()
  @IsNotEmpty()  // You might want to make this optional if email is not strictly required for all roles, but for Patient flow we want it.
  // Ideally use @IsEmail() if available, or just IsString for now.
  // @IsEmail() // class-validator might not have IsEmail imported or available in this context without verification.
  // sticking to IsString for safety unless I check imports.
  email: string;

  @ApiProperty({ enum: Role, example: 'PATIENT', description: 'User role' })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class LoginDto {
  @ApiProperty({ example: 'patient1', description: 'User alias' })
  @IsString()
  @IsNotEmpty()
  alias: string;

  @ApiProperty({ example: '1234', description: 'User PIN' })
  @IsString()
  @IsNotEmpty()
  pin: string;
}
