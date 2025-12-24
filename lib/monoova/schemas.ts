// ==============================
// File: lib/monoova/schemas.ts
// ==============================
import { z } from "zod";

export const emailAddressSchema = z.object({
  address: z.string().email("Invalid email"),
});

export const emailDetailSchema = z.object({
  toAddress: z.array(emailAddressSchema).optional(),
  bccAddress: z.array(emailAddressSchema).optional(),
});

export const webhookDetailSchema = z.object({
  callbackUrl: z.string().url("Invalid URL"),
});

export const subscriptionCreateSchema = z.object({
  subscriptionName: z.string().min(1),
  eventName: z.string().min(1),
  webhookDetail: webhookDetailSchema.optional(),
  emailDetail: emailDetailSchema.optional(),
  isActive: z.boolean().optional(),
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.partial();

export const subscriptionSchema = z.object({
  subscriptionId: z.string(),
  subscriptionName: z.string(),
  eventName: z.string(),
  webhookDetail: webhookDetailSchema.optional(),
  emailDetail: emailDetailSchema.optional(),
  isActive: z.boolean(),
  createdDateTime: z.string().optional(),
  updatedDateTime: z.string().optional(),
});

export const subscriptionArraySchema = z.array(subscriptionSchema);