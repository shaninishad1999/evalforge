import { z } from "zod";

const panNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    "Please enter a valid PAN number"
  );

const dateOfBirthSchema = z
  .string()
  .trim()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Please enter a valid date of birth"
  );

const pincodeSchema = z
  .string()
  .trim()
  .regex(
    /^[1-9][0-9]{5}$/,
    "Please enter a valid 6-digit pincode"
  );

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),

  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{9,14}$/,
      "Please enter a valid phone number"
    )
    .optional()
    .or(z.literal("")),

  avatar: z
    .string()
    .trim()
    .url("Please enter a valid avatar URL")
    .optional()
    .or(z.literal("")),

  skills: z
    .array(z.string().trim().min(1))
    .max(50, "You can add up to 50 skills")
    .optional(),

  languages: z
    .array(z.string().trim().min(1))
    .max(20, "You can add up to 20 languages")
    .optional(),
});

export const submitKycSchema = z.object({
  panNumber: panNumberSchema,

  panName: z
    .string()
    .trim()
    .min(2, "PAN name is required")
    .max(100, "PAN name must not exceed 100 characters"),

  dateOfBirth: dateOfBirthSchema,

  panDocumentUrl: z
    .string()
    .trim()
    .min(1, "PAN card document is required"),

  addressLine1: z
    .string()
    .trim()
    .min(3, "Address is required")
    .max(200, "Address must not exceed 200 characters"),

  addressLine2: z
    .string()
    .trim()
    .max(200, "Address must not exceed 200 characters")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City must not exceed 100 characters"),

  district: z
    .string()
    .trim()
    .min(2, "District is required")
    .max(100, "District must not exceed 100 characters"),

  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100, "State must not exceed 100 characters"),

  pincode: pincodeSchema,

  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(100, "Country must not exceed 100 characters")
    .default("India"),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;

export type SubmitKycInput = z.infer<
  typeof submitKycSchema
>;