import { z } from "zod";

// ============================================================
// USER ROLE
// ============================================================

const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "CLIENT",
  "PROJECT_MANAGER",
  "REVIEWER",
  "CONTRIBUTOR",
]);

// ============================================================
// GET USERS QUERY
// ============================================================

export const getAdminUsersQuerySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    role: userRoleSchema.optional(),

    isActive: z
      .enum(["true", "false"])
      .optional(),

    isVerified: z
      .enum(["true", "false"])
      .optional(),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  });

// ============================================================
// USER ID PARAM
// ============================================================

export const adminUserIdParamSchema =
  z.object({
    userId: z
      .string()
      .min(1, "User ID is required"),
  });

// ============================================================
// UPDATE USER ROLE
// ============================================================

export const updateAdminUserRoleSchema =
  z
    .object({
      role: userRoleSchema,
    })
    .strict();

// ============================================================
// UPDATE USER ACTIVE STATUS
// ============================================================

export const updateAdminUserActiveStatusSchema =
  z
    .object({
      isActive: z.boolean(),
    })
    .strict();

// ============================================================
// UPDATE USER VERIFICATION STATUS
// ============================================================

export const updateAdminUserVerificationSchema =
  z
    .object({
      isVerified: z.boolean(),
    })
    .strict();