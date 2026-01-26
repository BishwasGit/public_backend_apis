import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from './wallet.service';

const mockPrisma = {
  wallet: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma }
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return existing wallet', async () => {
      const wallet = { id: '1', balance: 100, userId: 'user1' };
      mockPrisma.wallet.findUnique.mockResolvedValue(wallet);
      const result = await service.getBalance('user1');
      expect(result).toBe(wallet);
    });

    it('should create wallet if not exists', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      const newWallet = { id: '1', balance: 0, userId: 'user1' };
      mockPrisma.wallet.create.mockResolvedValue(newWallet);

      const result = await service.getBalance('user1');
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith({ data: { userId: 'user1' } });
      expect(result).toBe(newWallet);
    });
  });

  describe('deposit', () => {
    it('should increment balance and create transaction', async () => {
      const wallet = { id: '1', balance: 0, userId: 'user1' };
      mockPrisma.wallet.findUnique.mockResolvedValue(wallet);
      mockPrisma.wallet.update.mockResolvedValue({ ...wallet, balance: 100 });

      await service.deposit('user1', 100);

      expect(mockPrisma.wallet.update).toHaveBeenCalled();
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
      const txArgs = mockPrisma.transaction.create.mock.calls[0][0];
      expect(txArgs.data.amount).toBe(100);
      expect(txArgs.data.type).toBe('DEPOSIT');
    });
  });
});
