import { z } from "zod";

export const submitLivenessSchema = z.object({
  lookLeft: z.boolean(),
  lookRight: z.boolean(),
  lookCenter: z.boolean(),
  blink: z.boolean(),

  livenessScore: z
    .number()
    .min(0, "Liveness score cannot be less than 0")
    .max(100, "Liveness score cannot be greater than 100"),
});