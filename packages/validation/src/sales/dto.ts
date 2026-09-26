import z from "zod";
import {
  COMMISSION_STATUS_LIST,
  CUSTOMER_STATUS_LIST,
  PAYMENT_TERMS_LIST,
  SALES_ORDER_STATUS_LIST,
} from "@rona/config/sales";

export const customerDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  vatNumber: z.string().nullable(),
  salespersonUserId: z.string().nullable(),
  status: z.enum(CUSTOMER_STATUS_LIST),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const customerContactDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  customerId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  title: z.string().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.date(),
});

export const customerAddressDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  customerId: z.string(),
  label: z.string().nullable(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.date(),
});

export const customerDetailDto = customerDto.extend({
  contacts: z.array(customerContactDto),
  addresses: z.array(customerAddressDto),
});

export const salesOrderLineDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderId: z.string(),
  itemId: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
  discountPercent: z.string(),
  vatPercent: z.string(),
  lineNet: z.string(),
  lineVat: z.string(),
  lineTotal: z.string(),
});

export const salesOrderDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  salespersonUserId: z.string().nullable(),
  warehouseId: z.string(),
  status: z.enum(SALES_ORDER_STATUS_LIST),
  paymentTerms: z.enum(PAYMENT_TERMS_LIST).nullable(),
  reservationId: z.string().nullable(),
  orderDate: z.date(),
  subtotal: z.string(),
  discountTotal: z.string(),
  vatTotal: z.string(),
  total: z.string(),
  notes: z.string().nullable(),
  confirmedAt: z.date().nullable(),
  fulfilledAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const salesOrderDetailDto = salesOrderDto.extend({
  lines: z.array(salesOrderLineDto),
  reservationStatus: z.string().nullable(),
});

export const sellableLotDto = z.object({
  lotId: z.string(),
  lotNumber: z.string(),
  expiryDate: z.date().nullable(),
  onHand: z.string(),
  reserved: z.string(),
  available: z.string(),
});

export const stockAvailabilityDto = z.object({
  itemId: z.string(),
  warehouseId: z.string(),
  lots: z.array(sellableLotDto),
  totalAvailable: z.string(),
});

export const commissionRuleDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  salespersonUserId: z.string(),
  salespersonName: z.string().nullable(),
  commissionPercent: z.string(),
  itemId: z.string().nullable(),
  itemCategory: z.string().nullable(),
  minimumMarginPercent: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const commissionRecordDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  ruleId: z.string(),
  ruleName: z.string().nullable(),
  salespersonUserId: z.string(),
  salespersonName: z.string().nullable(),
  salesOrderId: z.string(),
  orderNumber: z.string().nullable(),
  invoiceId: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  status: z.enum(COMMISSION_STATUS_LIST),
  commissionPercent: z.string(),
  amount: z.string(),
  approvedAt: z.date().nullable(),
  paidAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
