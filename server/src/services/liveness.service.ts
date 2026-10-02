import mongoose from "mongoose";
import FaceVerification from "../models/FaceVerification.js";
import ApiError from "../utils/ApiError.js";

interface LivenessData {
  lookLeft: boolean;
  lookRight: boolean;
  lookCenter: boolean;
  blink: boolean;
  livenessScore: number;
}

export const submitLivenessResult = async (
  userId: string,
  data: LivenessData
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const faceVerification = await FaceVerification.findOne({
    userId,
  });

  if (!faceVerification) {
    throw new ApiError(
      404,
      "Face verification session not found"
    );
  }

  if (faceVerification.verificationStatus === "LOCKED") {
    throw new ApiError(
      403,
      "Face verification is locked"
    );
  }

  if (faceVerification.verificationStatus === "PASSED") {
    throw new ApiError(
      409,
      "Face verification is already completed"
    );
  }

  if (faceVerification.verificationStatus !== "PROCESSING") {
    throw new ApiError(
      409,
      "Please start face verification first"
    );
  }

  // Validate liveness score
  if (
    !Number.isFinite(data.livenessScore) ||
    data.livenessScore < 0 ||
    data.livenessScore > 100
  ) {
    throw new ApiError(
      400,
      "Liveness score must be between 0 and 100"
    );
  }

  // All required challenges must be completed
  const allChallengesPassed =
    data.lookLeft &&
    data.lookRight &&
    data.lookCenter &&
    data.blink;

  if (!allChallengesPassed) {
    throw new ApiError(
      400,
      "All liveness challenges must be completed"
    );
  }

  // Save challenge results
  faceVerification.challenges = {
    lookLeft: data.lookLeft,
    lookRight: data.lookRight,
    lookCenter: data.lookCenter,
    blink: data.blink,
  };

  faceVerification.livenessScore =
    data.livenessScore;

  faceVerification.livenessStatus = "PASSED";

  // Identity verification abhi baaki hai
  faceVerification.verificationStatus =
    "PROCESSING";

  await faceVerification.save();

  return faceVerification;
};