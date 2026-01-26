import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const mockUsersService = {
  findOneByAlias: jest.fn(),
  create: jest.fn(),
};
const mockJwtService = {
  sign: jest.fn(() => 'token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without hashedPin if pin matches', async () => {
      const pin = '1234';
      const hashedPin = await bcrypt.hash(pin, 10);
      const user = { id: '1', alias: 'test', hashedPin, role: 'PATIENT' };
      mockUsersService.findOneByAlias.mockResolvedValue(user);

      const result = await service.validateUser('test', pin);
      expect(result).toHaveProperty('id');
      expect(result).not.toHaveProperty('hashedPin');
      expect(result.alias).toBe('test');
    });

    it('should return null if pin does not match', async () => {
      const pin = '1234';
      const hashedPin = await bcrypt.hash(pin, 10);
      const user = { id: '1', alias: 'test', hashedPin };
      mockUsersService.findOneByAlias.mockResolvedValue(user);

      const result = await service.validateUser('test', 'wrong');
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should hash pin and create user', async () => {
      const pin = '1234';
      mockUsersService.create.mockImplementation(async (dto) => {
        return { id: '1', ...dto };
      });

      await service.register('test', pin, 'PATIENT');
      expect(mockUsersService.create).toHaveBeenCalled();
      const calledArg = mockUsersService.create.mock.calls[0][0]; // { alias, role, hashedPin }
      expect(calledArg.alias).toBe('test');
      expect(await bcrypt.compare(pin, calledArg.hashedPin)).toBe(true);
    });
  });
});
