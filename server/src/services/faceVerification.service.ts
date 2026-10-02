import mongoose from "mongoose";
import FaceVerification from "../models/FaceVerification.js";
import ApiError from "../utils/ApiError.js";

// ============================================================
// GET FACE VERIFICATION
// ============================================================

export const getFaceVerification = async (
  userId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  let faceVerification =
    await FaceVerification.findOne({
      userId,
    });

  // First time ke liye automatically create
  if (!faceVerification) {
    faceVerification =
      await FaceVerification.create({
        userId,
      });
  }

  return faceVerification;
};

// ============================================================
// START FACE VERIFICATION
// ============================================================

export const startFaceVerification = async (
  userId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  let faceVerification =
    await FaceVerification.findOne({
      userId,
    });

  if (!faceVerification) {
    faceVerification =
      await FaceVerification.create({
        userId,
      });
  }

  // Already completed
  if (
    faceVerification.verificationStatus ===
    "PASSED"
  ) {
    throw new ApiError(
      409,
      "Face verification is already completed"
    );
  }

  // Maximum attempts reached
  if (
    faceVerification.verificationStatus ===
      "LOCKED" ||
    faceVerification.attempts >=
      faceVerification.maxAttempts
  ) {
    faceVerification.verificationStatus =
      "LOCKED";

    await faceVerification.save();

    throw new ApiError(
      403,
      "Maximum face verification attempts reached"
    );
  }

  // Already processing
  if (
    faceVerification.verificationStatus ===
    "PROCESSING"
  ) {
    throw new ApiError(
      409,
      "Face verification is already in progress"
    );
  }

  // Start new verification session
  faceVerification.verificationStatus =
    "PROCESSING";

  faceVerification.livenessStatus =
    "PROCESSING";

  faceVerification.startedAt =
    new Date();

  faceVerification.completedAt =
    null;

  faceVerification.rejectionReason =
    "";

  faceVerification.selfieUrl =
    "";

  faceVerification.challenges = {
    lookLeft: false,
    lookRight: false,
    lookCenter: false,
    blink: false,
  };

  faceVerification.livenessScore = 0;

  await faceVerification.save();

  return faceVerification;
};

// ============================================================
// SAVE SELFIE
// ============================================================

export const saveSelfie = async (
  userId: string,
  selfiePath: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!selfiePath) {
    throw new ApiError(
      400,
      "Selfie image is required"
    );
  }

  const faceVerification =
    await FaceVerification.findOne({
      userId,
    });

  if (!faceVerification) {
    throw new ApiError(
      404,
      "Face verification session not found"
    );
  }

  // Verification locked
  if (
    faceVerification.verificationStatus ===
    "LOCKED"
  ) {
    throw new ApiError(
      403,
      "Face verification is locked"
    );
  }

  // Already verified
  if (
    faceVerification.verificationStatus ===
    "PASSED"
  ) {
    throw new ApiError(
      409,
      "Face verification is already completed"
    );
  }

  // Liveness must be completed first
  if (
    faceVerification.livenessStatus !==
    "PASSED"
  ) {
    throw new ApiError(
      409,
      "Please complete liveness verification first"
    );
  }

  // Save selfie path
  faceVerification.selfieUrl =
    selfiePath;

  // Actual face matching is still pending
  faceVerification.verificationStatus =
    "PROCESSING";

  await faceVerification.save();

  return faceVerification;
};