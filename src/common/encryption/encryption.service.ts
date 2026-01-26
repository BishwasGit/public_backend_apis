
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly ivLength = 16;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY');
    // Ensure key is 32 bytes. If not, hash it or pad it. 
    // For simple demo/robustness, we'll hash the secret to get 32 bytes.
    this.key = crypto.createHash('sha256').update(String(secret || 'default-secret-key-do-not-use')).digest();
  }

  encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text: string): string {
    if (!text) return text;
    try {
      const textParts = text.split(':');
      if (textParts.length < 2) return text; 
      const ivPart = textParts.shift();
      if (!ivPart) return text;
      const iv = Buffer.from(ivPart, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      // Return original text if decryption fails (backward compatibility or error)
      return text;
    }
  }
}
