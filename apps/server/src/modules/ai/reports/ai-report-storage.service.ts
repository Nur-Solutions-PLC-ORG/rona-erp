import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { AI_REPORT_OUTPUT_DIR } from '@rona/config/ai';

@Injectable()
export class AiReportStorageService {
  private readonly logger = new Logger(AiReportStorageService.name);
  private readonly root: string;

  constructor() {
    this.root = path.resolve(
      process.env.AI_REPORT_OUTPUT_DIR ?? AI_REPORT_OUTPUT_DIR,
    );
  }

  async put(key: string, data: Buffer): Promise<string> {
    const target = path.resolve(this.root, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
    return target;
  }

  async get(storageKey: string): Promise<Buffer> {
    return readFile(storageKey);
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(storageKey);
    } catch (error) {
      this.logger.warn(`Failed to delete report file: ${String(error)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await mkdir(this.root, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}
