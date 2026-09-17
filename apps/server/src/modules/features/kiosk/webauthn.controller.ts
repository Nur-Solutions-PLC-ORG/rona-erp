import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import { webauthnAuthenticationOptionsSchema, webauthnAuthenticationVerifySchema, webauthnRegistrationOptionsSchema, webauthnRegistrationVerifySchema } from '@rona/validation/kiosk';
import { KIOSK_EMPLOYEE_GRANT_COOKIE, KIOSK_EMPLOYEE_GRANT_DURATION } from '@rona/config/kiosk';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { WebAuthnService } from './webauthn.service';
import { KioskSessionGuard } from './kiosk-session.guard';
import type { KioskDeviceContext } from './kiosk.service';

const result = <T>(data: T) => ({ success: true, statusCode: 200, message: 'WebAuthn request completed.', data });

@Controller('kiosk/webauthn/authentication')
@UseGuards(KioskSessionGuard)
export class WebAuthnAuthenticationController {
  constructor(private readonly webauthn: WebAuthnService) {}

  @Post('options')
  @HttpCode(200)
  async options(@Req() request: Request & { kiosk: KioskDeviceContext },
    @Body(new ZodValidationPipe(webauthnAuthenticationOptionsSchema)) body: z.infer<typeof webauthnAuthenticationOptionsSchema>,
    @Res({ passthrough: true }) res: Response) {
    res.clearCookie(KIOSK_EMPLOYEE_GRANT_COOKIE, { path: '/api/kiosk' });
    res.setHeader('Cache-Control', 'no-store');
    return result(await this.webauthn.authenticationOptions(request.kiosk, body.eid));
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Req() request: Request & { kiosk: KioskDeviceContext },
    @Body(new ZodValidationPipe(webauthnAuthenticationVerifySchema)) body: z.infer<typeof webauthnAuthenticationVerifySchema>,
    @Res({ passthrough: true }) res: Response) {
    res.clearCookie(KIOSK_EMPLOYEE_GRANT_COOKIE, { path: '/api/kiosk' });
    res.setHeader('Cache-Control', 'no-store');
    const { grantToken, ...data } = await this.webauthn.authenticationVerify(request.kiosk, body.challengeId, body.response);
    res.cookie(KIOSK_EMPLOYEE_GRANT_COOKIE, grantToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', path: '/api/kiosk', maxAge: KIOSK_EMPLOYEE_GRANT_DURATION });
    return result(data);
  }
}

@Controller('kiosk/webauthn/employees/:employeeId')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class WebAuthnEnrollmentController {
  constructor(private readonly webauthn: WebAuthnService) {}

  @Get('credentials')
  @RequirePermissions('hr.employee.read')
  async list(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return result(await this.webauthn.list(employeeId));
  }

  @Post('registration/options')
  @HttpCode(200)
  @RequirePermissions('hr.employee.update')
  async options(@Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body(new ZodValidationPipe(webauthnRegistrationOptionsSchema)) body: z.infer<typeof webauthnRegistrationOptionsSchema>) {
    return result(await this.webauthn.registrationOptions(employeeId, body.deviceName));
  }

  @Post('registration/verify')
  @HttpCode(200)
  @RequirePermissions('hr.employee.update')
  async verify(@Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body(new ZodValidationPipe(webauthnRegistrationVerifySchema)) body: z.infer<typeof webauthnRegistrationVerifySchema>) {
    return result(await this.webauthn.registrationVerify(employeeId, body.challengeId, body.response));
  }

  @Post('credentials/:credentialId/revoke')
  @HttpCode(200)
  @RequirePermissions('hr.employee.update')
  async revoke(@Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('credentialId', ParseUUIDPipe) credentialId: string) {
    return result(await this.webauthn.revoke(employeeId, credentialId));
  }
}
