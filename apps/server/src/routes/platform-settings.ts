/**
 * Platform Settings routes - Frontend Developer Guide
 * Base path: /platform-settings
 */

export const publicPlatformRoutes = [
  {
    name: "Get Platform Status",
    method: "GET",
    path: "/platform-settings/status",
    description: "Check if platform is in maintenance mode",
    body: "{}",
    response: `{
  "isMaintenance": true|false,
  "message": "string"
}`,
    note: "Use this to show maintenance banner to users",
  },
] as const;

export const adminPlatformRoutes = [
  {
    name: "Set Maintenance Mode",
    method: "POST",
    path: "/platform-settings/maintenance",
    description: "Turn maintenance mode on/off",
    body: `{
  "enabled": true|false,
  "message": "optional custom message"
}`,
    response: `{ "success": true, "isMaintenance": true|false }`,
    note: "Requires admin role. When enabled, non-admin users see the maintenance page.",
  },
] as const;

export const platformSettingsRoutes = [...publicPlatformRoutes, ...adminPlatformRoutes] as const;
