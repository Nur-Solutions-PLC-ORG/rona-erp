// Tenant workspace

export const API_ME_MEMBERSHIPS_URL = "/api/me/memberships";

export const API_ORGANIZATION_URL = "/api/organization";

export const API_ORGANIZATION_UPDATE_URL = "/api/organization";

export const API_ORGANIZATION_SETTINGS_URL = "/api/organization/settings";

export const API_MEMBERSHIPS_URL = "/api/organization/memberships";

export const API_MEMBERSHIPS_CREATE_URL = "/api/organization/memberships";

export const API_MEMBERSHIP_DETAILS_URL = "/api/organization/memberships/:id";

export const API_ORGANIZATION_USER_CANDIDATES_URL =
  "/api/organization/users";

export const API_ORGANIZATION_MEMBERS_CREATE_URL =
  "/api/organization/members";

export const API_MEMBERSHIP_UPDATE_URL = "/api/organization/memberships/:id";

export const API_MEMBERSHIP_DELETE_URL = "/api/organization/memberships/:id";

export const API_ROLES_URL = "/api/organization/roles";

export const API_ROLE_UPDATE_URL = "/api/organization/roles/:id";

export const API_AUDIT_LOGS_URL = "/api/organization/audit-logs";

export const API_INVENTORY_ITEMS_URL = "/api/inventory/items";

export const API_INVENTORY_ITEM_DETAILS_URL = "/api/inventory/items/:id";

export const API_INVENTORY_ITEM_ARCHIVE_URL = "/api/inventory/items/:id/archive";

export const API_INVENTORY_UNITS_OF_MEASURE_URL =
  "/api/inventory/items/units-of-measure";

export const API_INVENTORY_WAREHOUSES_URL = "/api/inventory/warehouses";

export const API_INVENTORY_WAREHOUSE_DETAILS_URL =
  "/api/inventory/warehouses/:id";

export const API_INVENTORY_WAREHOUSE_LOCATIONS_URL =
  "/api/inventory/warehouses/:id/locations";

export const API_INVENTORY_LOCATION_DETAILS_URL =
  "/api/inventory/warehouses/locations/:id";

export const API_INVENTORY_LOTS_URL = "/api/inventory/lots";

export const API_INVENTORY_LOT_DETAILS_URL = "/api/inventory/lots/:id";

export const API_INVENTORY_LOT_QUALITY_STATUS_URL =
  "/api/inventory/lots/:id/quality-status";

export const API_INVENTORY_STOCK_URL = "/api/inventory/stock";

export const API_INVENTORY_MOVEMENTS_URL = "/api/inventory/stock/movements";

export const API_INVENTORY_ITEM_ON_HAND_URL =
  "/api/inventory/stock/items/:itemId/on-hand";

export const API_INVENTORY_STOCK_RECEIVE_URL = "/api/inventory/stock/receive";

export const API_INVENTORY_STOCK_ISSUE_URL = "/api/inventory/stock/issue";

export const API_INVENTORY_STOCK_TRANSFER_URL = "/api/inventory/stock/transfer";

export const API_INVENTORY_STOCK_ADJUST_URL = "/api/inventory/stock/adjust";

export const API_INVENTORY_STOCK_RETURN_URL = "/api/inventory/stock/return";

export const API_INVENTORY_RESERVATIONS_URL = "/api/inventory/reservations";

export const API_INVENTORY_RESERVATION_DETAILS_URL =
  "/api/inventory/reservations/:id";

export const API_INVENTORY_RESERVATION_RELEASE_URL =
  "/api/inventory/reservations/:id/release";

export const API_INVENTORY_RESERVATION_CONSUME_URL =
  "/api/inventory/reservations/:id/consume";

export const API_MANUFACTURING_BOMS_URL = "/api/manufacturing/boms";

export const API_MANUFACTURING_BOM_DETAILS_URL = "/api/manufacturing/boms/:id";

export const API_MANUFACTURING_BOM_VERSIONS_URL =
  "/api/manufacturing/boms/:id/versions";

export const API_MANUFACTURING_BOM_VERSION_DETAILS_URL =
  "/api/manufacturing/boms/versions/:versionId";

export const API_MANUFACTURING_BOM_VERSION_LINES_URL =
  "/api/manufacturing/boms/versions/:versionId/lines";

export const API_MANUFACTURING_BOM_VERSION_APPROVE_URL =
  "/api/manufacturing/boms/versions/:versionId/approve";

export const API_MANUFACTURING_BOM_VERSION_RETIRE_URL =
  "/api/manufacturing/boms/versions/:versionId/retire";

export const API_MANUFACTURING_PRODUCTION_ORDERS_URL =
  "/api/manufacturing/production-orders";

export const API_MANUFACTURING_PRODUCTION_ORDER_DETAILS_URL =
  "/api/manufacturing/production-orders/:id";

export const API_MANUFACTURING_PRODUCTION_ORDER_MATERIALS_URL =
  "/api/manufacturing/production-orders/:id/materials";

export const API_MANUFACTURING_PRODUCTION_ORDER_BATCHES_URL =
  "/api/manufacturing/production-orders/:id/batches";

export const API_MANUFACTURING_PRODUCTION_ORDER_APPROVE_URL =
  "/api/manufacturing/production-orders/:id/approve";

export const API_MANUFACTURING_PRODUCTION_ORDER_START_URL =
  "/api/manufacturing/production-orders/:id/start";

export const API_MANUFACTURING_PRODUCTION_ORDER_COMPLETE_URL =
  "/api/manufacturing/production-orders/:id/complete";

export const API_MANUFACTURING_PRODUCTION_ORDER_CANCEL_URL =
  "/api/manufacturing/production-orders/:id/cancel";

export const API_MANUFACTURING_BATCHES_URL = "/api/manufacturing/batches";

export const API_MANUFACTURING_BATCH_DETAILS_URL =
  "/api/manufacturing/batches/:id";

export const API_MANUFACTURING_BATCH_CONSUMPTIONS_URL =
  "/api/manufacturing/batches/:id/consumptions";

export const API_MANUFACTURING_BATCH_RETURNS_URL =
  "/api/manufacturing/batches/:id/returns";

export const API_MANUFACTURING_BATCH_OUTPUTS_URL =
  "/api/manufacturing/batches/:id/outputs";

export const API_MANUFACTURING_BATCH_CONSUME_URL =
  "/api/manufacturing/batches/:id/consume";

export const API_MANUFACTURING_BATCH_RETURN_URL =
  "/api/manufacturing/batches/:id/return";

export const API_MANUFACTURING_BATCH_OUTPUT_URL =
  "/api/manufacturing/batches/:id/output";

export const API_MANUFACTURING_BATCH_COMPLETE_URL =
  "/api/manufacturing/batches/:id/complete";

export const API_QUALITY_INSPECTIONS_URL = "/api/quality/inspections";

export const API_QUALITY_INSPECTION_DETAILS_URL = "/api/quality/inspections/:id";

export const API_QUALITY_INSPECTION_TESTS_URL =
  "/api/quality/inspections/:id/tests";

export const API_QUALITY_TEST_RESULT_URL =
  "/api/quality/inspections/:id/tests/:testId/results";

export const API_QUALITY_INSPECTION_COMPLETE_URL =
  "/api/quality/inspections/:id/complete";

export const API_QUALITY_INSPECTION_RELEASE_URL =
  "/api/quality/inspections/:id/release";

export const API_QUALITY_INSPECTION_REJECT_URL =
  "/api/quality/inspections/:id/reject";

export const API_TRACEABILITY_LOT_URL = "/api/traceability/lots/:lotId";

export const API_TRACEABILITY_FORWARD_URL = "/api/traceability/lots/:lotId/forward";

export const API_TRACEABILITY_REVERSE_URL = "/api/traceability/lots/:lotId/reverse";

export const API_HR_EMPLOYEES_URL = "/api/hr/employees";

export const API_HR_EMPLOYEE_DETAILS_URL = "/api/hr/employees/:id";

export const API_HR_EMPLOYEE_ARCHIVE_URL = "/api/hr/employees/:id/archive";

export const API_HR_EMPLOYEE_RESTORE_URL = "/api/hr/employees/:id/restore";

export const API_HR_EMPLOYEE_CONTACTS_URL =
  "/api/hr/employees/:id/emergency-contacts";

export const API_HR_EMPLOYEE_CONTACT_DETAILS_URL =
  "/api/hr/employees/:id/emergency-contacts/:contactId";

export const API_HR_EMPLOYEE_SHIFTS_URL = "/api/hr/employees/:id/shifts";

export const API_HR_EMPLOYEE_SHIFT_END_URL =
  "/api/hr/employees/:id/shifts/:assignmentId/end";

export const API_HR_DEPARTMENTS_URL = "/api/hr/departments";

export const API_HR_DEPARTMENT_DETAILS_URL = "/api/hr/departments/:id";

export const API_HR_POSITIONS_URL = "/api/hr/departments/positions";

export const API_HR_POSITION_DETAILS_URL = "/api/hr/departments/positions/:id";

export const API_HR_POSITION_ARCHIVE_URL =
  "/api/hr/departments/positions/:id/archive";

export const API_HR_POSITION_RESTORE_URL =
  "/api/hr/departments/positions/:id/restore";

export const API_HR_ATTENDANCE_URL = "/api/hr/attendance";

export const API_HR_ATTENDANCE_SELF_URL = "/api/hr/attendance/self";

export const API_HR_ATTENDANCE_STATUS_URL = "/api/hr/attendance/status";

export const API_HR_ATTENDANCE_EMPLOYEE_STATUS_URL =
  "/api/hr/attendance/status/:employeeId";

export const API_HR_ATTENDANCE_MANAGE_URL = "/api/hr/attendance";

export const API_HR_SHIFTS_URL = "/api/hr/shifts";

export const API_HR_SHIFT_DETAILS_URL = "/api/hr/shifts/:id";

export const API_KIOSKS_URL = "/api/kiosks";

export const API_KIOSK_DETAILS_URL = "/api/kiosks/:id";

export const API_KIOSK_ACTIVATE_URL = "/api/kiosks/:id/activate";

export const API_KIOSK_DEACTIVATE_URL = "/api/kiosks/:id/deactivate";

export const API_KIOSK_AUTHENTICATE_URL = "/api/kiosk/authenticate";

export const API_KIOSK_SIGN_OUT_URL = "/api/kiosk/sign-out";

export const API_KIOSK_ATTENDANCE_URL = "/api/kiosk/attendance";

export const API_KIOSK_WEBAUTHN_AUTH_OPTIONS_URL =
  "/api/kiosk/webauthn/authentication/options";

export const API_KIOSK_WEBAUTHN_AUTH_VERIFY_URL =
  "/api/kiosk/webauthn/authentication/verify";

export const API_KIOSK_WEBAUTHN_CREDENTIALS_URL =
  "/api/kiosk/webauthn/employees/:employeeId/credentials";

export const API_KIOSK_WEBAUTHN_REG_OPTIONS_URL =
  "/api/kiosk/webauthn/employees/:employeeId/registration/options";

export const API_KIOSK_WEBAUTHN_REG_VERIFY_URL =
  "/api/kiosk/webauthn/employees/:employeeId/registration/verify";

export const API_KIOSK_WEBAUTHN_CREDENTIAL_REVOKE_URL =
  "/api/kiosk/webauthn/employees/:employeeId/credentials/:credentialId/revoke";

export const API_SALES_CUSTOMERS_URL = "/api/sales/customers";

export const API_SALES_CUSTOMER_DETAILS_URL = "/api/sales/customers/:id";

export const API_SALES_CUSTOMER_CONTACTS_URL = "/api/sales/customers/:id/contacts";

export const API_SALES_CUSTOMER_CONTACT_DETAILS_URL =
  "/api/sales/customers/:id/contacts/:contactId";

export const API_SALES_CUSTOMER_ADDRESSES_URL =
  "/api/sales/customers/:id/addresses";

export const API_SALES_CUSTOMER_ADDRESS_DETAILS_URL =
  "/api/sales/customers/:id/addresses/:addressId";

export const API_SALES_ORDERS_URL = "/api/sales/orders";

export const API_SALES_ORDER_DETAILS_URL = "/api/sales/orders/:id";

export const API_SALES_ORDER_CONFIRM_URL = "/api/sales/orders/:id/confirm";

export const API_SALES_ORDER_FULFILL_URL = "/api/sales/orders/:id/fulfill";

export const API_SALES_ORDER_CANCEL_URL = "/api/sales/orders/:id/cancel";

export const API_SALES_ORDER_AVAILABILITY_URL = "/api/sales/orders/availability";

export const API_SALES_COMMISSION_RULES_URL = "/api/sales/commissions/rules";

export const API_SALES_COMMISSION_RULE_DETAILS_URL =
  "/api/sales/commissions/rules/:id";

export const API_SALES_COMMISSION_RECORDS_URL = "/api/sales/commissions/records";

export const API_SALES_COMMISSION_APPROVE_URL =
  "/api/sales/commissions/records/:id/approve";

export const API_SALES_COMMISSION_MARK_PAID_URL =
  "/api/sales/commissions/records/:id/mark-paid";

export const API_FINANCE_INVOICES_URL = "/api/finance/invoices";

export const API_FINANCE_INVOICE_DETAILS_URL = "/api/finance/invoices/:id";

export const API_FINANCE_INVOICE_ISSUE_URL = "/api/finance/invoices/:id/issue";

export const API_FINANCE_INVOICE_VOID_URL = "/api/finance/invoices/:id/void";

export const API_FINANCE_INVOICE_PAYMENTS_URL =
  "/api/finance/invoices/:id/payments";

export const API_FINANCE_PAYMENTS_URL = "/api/finance/payments";

export const API_FINANCE_PAYMENT_DETAILS_URL = "/api/finance/payments/:id";

export const API_FINANCE_COSTS_URL = "/api/finance/costs";

export const API_FINANCE_COST_DETAILS_URL = "/api/finance/costs/:id";

export const API_FINANCE_COST_CENTERS_URL = "/api/finance/cost-centers";

export const API_FINANCE_COST_CENTER_DETAILS_URL =
  "/api/finance/cost-centers/:id";

export const API_AI_CHAT_URL = "/api/ai/chat";

export const API_AI_SUMMARY_URL = "/api/ai/summary";

export const API_AI_HEALTH_URL = "/api/ai/health";

export const API_AI_REPORT_EXPORT_URL = "/api/ai/reports/export";

export const API_AI_REPORT_STATUS_URL = "/api/ai/reports/:reportId";

export const API_AI_REPORT_DOWNLOAD_URL = "/api/ai/reports/:reportId/download";
