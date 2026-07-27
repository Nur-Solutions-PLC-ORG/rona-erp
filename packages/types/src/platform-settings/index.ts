export type PlatformSettingsInput = {
  key: string;
  value: string;
};

export type MaintenanceModeInput = {
  enabled: boolean;
  message?: string;
};

export type StatusResponse = {
  isMaintenance: boolean;
  message: string;
};
