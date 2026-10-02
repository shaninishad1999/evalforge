import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import ApiError from "../utils/ApiError.js";

import {
  getFaceReference,
  saveFaceReference,
} from "../services/faceReference.service.js";

// ============================================================
// GET FACE REFERENCE
// GET /api/users/me/face-reference
// ============================================================

export const getMyFaceReference = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const faceReference =
    await getFaceReference(
      req.user.userId
    );

  res.status(200).json({
    success: true,
    message:
      "Face reference fetched successfully",

    data: {
      faceReference,
    },
  });
};

// ============================================================
// UPLOAD FACE REFERENCE
// POST /api/users/me/face-reference
// ============================================================

export const uploadMyFaceReference = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  if (!req.file) {
    throw new ApiError(
      400,
      "Reference face image is required"
    );
  }

  const faceReference =
    await saveFaceReference(
      req.user.userId,
      req.file.path
    );

  res.status(200).json({
    success: true,
    message:
      "Face reference uploaded successfully",

    data: {
      faceReference,
    },
  });
};