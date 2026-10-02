import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import ApiError from "../utils/ApiError.js";
import { submitLivenessSchema } from "../validations/liveness.validation.js";
import { submitLivenessResult } from "../services/liveness.service.js";

// POST /api/users/me/face-verification/liveness
export const submitMyLiveness = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const validatedData = submitLivenessSchema.parse(
    req.body
  );

  const faceVerification = await submitLivenessResult(
    req.user.userId,
    validatedData
  );

  res.status(200).json({
    success: true,
    message: "Liveness verification completed successfully",
    data: {
      faceVerification,
    },
  });
};