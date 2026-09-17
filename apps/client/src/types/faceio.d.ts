declare module "@faceio/fiojs" {
  interface FaceIoEnrollParams {
    locale?: string;
    payload?: unknown;
    showAbortBtn?: boolean;
    idleTimeout?: number;
    permissionTimeout?: number;
  }

  interface FaceIoEnrollResult {
    facialId: string;
    timestamp: string;
    details: { gender: string; age: number };
  }

  interface FaceIoAuthenticateParams {
    locale?: string;
    idleTimeout?: number;
    permissionTimeout?: number;
  }

  interface FaceIoAuthenticateResult {
    facialId: string;
    payload?: unknown;
  }

  interface FaceIoError {
    status: string;
    code?: number;
    reason?: string;
    fioErrorCode?: Record<string, number>;
  }

  export default class FaceIO {
    constructor(publicId: string);
    enroll(params?: FaceIoEnrollParams): Promise<FaceIoEnrollResult>;
    authenticate(
      params?: FaceIoAuthenticateParams,
    ): Promise<FaceIoAuthenticateResult>;
    restartSession(): boolean;
    fetchAllErrorCodes(): Record<string, number>;
  }
}