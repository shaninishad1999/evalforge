import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import ApiError from "../utils/ApiError.js";
import { performFaceMatch } from "../services/faceMatching.service.js";
import {
  getFaceVerification,
  startFaceVerification,
  saveSelfie,
} from "../services/faceVerification.service.js";

// ============================================================
// GET FACE VERIFICATION
// GET /api/users/me/face-verification
// ============================================================

export const getMyFaceVerification = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const faceVerification =
    await getFaceVerification(
      req.user.userId
    );

  res.status(200).json({
    success: true,
    message:
      "Face verification status fetched successfully",

    data: {
      faceVerification,
    },
  });
};

// ============================================================
// START FACE VERIFICATION
// POST /api/users/me/face-verification/start
// ============================================================

export const startMyFaceVerification = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const faceVerification =
    await startFaceVerification(
      req.user.userId
    );

  res.status(200).json({
    success: true,
    message:
      "Face verification started successfully",

    data: {
      faceVerification,
    },
  });
};

// ============================================================
// UPLOAD SELFIE
// POST /api/users/me/face-verification/selfie
// ============================================================

export const uploadMySelfie = async (
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
      "Selfie image is required"
    );
  }

  const faceVerification =
    await saveSelfie(
      req.user.userId,
      req.file.path
    );

  res.status(200).json({
    success: true,
    message:
      "Selfie uploaded successfully",

    data: {
      faceVerification,
    },
  });
};

// ============================================================
// PERFORM FACE MATCH
// POST /api/users/me/face-verification/match
// ============================================================

export const performMyFaceMatch = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const result = await performFaceMatch(
    req.user.userId
  );

  res.status(200).json({
    success: true,
    message: result.matched
      ? "Face matched successfully"
      : "Face does not match the reference image",

    data: {
      faceVerification: result,
    },
  });
};