import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { platformSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PlatformSettingsService {
  async getSetting(key: string): Promise<string | null> {
    const result = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return result[0]?.value || null;}
  async setSetting(key: string, value: string) {
    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    if (existing[0]) {
      await db.update(platformSettings).set({ value, updated_at: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value });
    }
    return { success: true };}
  async isMaintenanceMode(): Promise<boolean> {
    const value = await this.getSetting('maintenance_mode');
    return value === 'true';
  }
  async getMaintenanceMessage(): Promise<string> {
    const value = await this.getSetting('maintenance_message');
    return value || 'System is under maintenance Please try again later.';
  }
}
