import { Request } from "@/api";
import {
  API_KIOSK_ACTIVATE_URL,
  API_KIOSK_DEACTIVATE_URL,
  API_KIOSK_DETAILS_URL,
  API_KIOSK_ENROLL_CODES_URL,
  API_KIOSK_UNPAIR_URL,
  API_KIOSKS_URL,
} from "@rona/routes/workspace";
import type {
  Kiosk,
  KioskCreateInput,
  KioskEnrollCodeResult,
  KioskRegistrationResult,
  KioskUpdateInput,
  KioskUpdateResult,
} from "@rona/types/kiosk";

export const ApiGetKiosks = Request<Kiosk[]>("get", API_KIOSKS_URL);

export const ApiPostKiosk = Request<KioskRegistrationResult, KioskCreateInput>(
  "post",
  API_KIOSKS_URL,
);

export const ApiGetKiosk = Request<Kiosk>("get", API_KIOSK_DETAILS_URL);

export const ApiPatchKiosk = Request<KioskUpdateResult, KioskUpdateInput>(
  "patch",
  API_KIOSK_DETAILS_URL,
);

export const ApiPostKioskActivate = Request<Kiosk>(
  "post",
  API_KIOSK_ACTIVATE_URL,
);

export const ApiPostKioskDeactivate = Request<Kiosk>(
  "post",
  API_KIOSK_DEACTIVATE_URL,
);

export const ApiPostKioskUnpair = Request<Kiosk>("post", API_KIOSK_UNPAIR_URL);

export const ApiPostKioskEnrollCode = Request<KioskEnrollCodeResult>(
  "post",
  API_KIOSK_ENROLL_CODES_URL,
);
