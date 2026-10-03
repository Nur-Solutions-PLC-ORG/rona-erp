import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { KIOSK_SESSION_COOKIE } from '@rona/config/kiosk';
import { KioskService } from './kiosk.service';

interface KioskRequest extends Request {
  kiosk?: {
    kioskId: string;
    deviceId: string;
    organizationId: string;
  };
}

@Injectable()
export class KioskSessionGuard implements CanActivate {
  constructor(private readonly kioskService: KioskService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<KioskRequest>();
    const sessionToken: unknown = request.cookies?.[KIOSK_SESSION_COOKIE];

    const device = await this.kioskService.resolveActiveDevice(
      typeof sessionToken === 'string' ? sessionToken : '',
    );

    request.kiosk = device;

    await this.kioskService.touchLastSeen(
      device.kioskId,
      device.organizationId,
    );

    return true;
  }
}
