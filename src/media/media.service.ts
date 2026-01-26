import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MediaService {
  private readonly uploadPath = 'private_uploads';

  constructor() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  getFilePath(filename: string): string {
    const path = join(process.cwd(), this.uploadPath, filename);
    if (!existsSync(path)) {
      throw new NotFoundException('File not found');
    }
    return path;
  }

  getFileStream(filename: string): StreamableFile {
    const path = this.getFilePath(filename);
    const file = createReadStream(path);
    return new StreamableFile(file);
  }
}
