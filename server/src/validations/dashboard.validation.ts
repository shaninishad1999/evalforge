import { z } from "zod";

// ============================================================
// DASHBOARD QUERY VALIDATION
// ============================================================

export const dashboardQuerySchema = z.object({
  recentLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),
});

export type DashboardQueryInput = z.infer<
  typeof dashboardQuerySchema
>;