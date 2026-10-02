import mongoose from "mongoose";
import FaceReference from "../models/FaceReference.js";
import ApiError from "../utils/ApiError.js";

// ============================================================
// GET FACE REFERENCE
// ============================================================

export const getFaceReference = async (
  userId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const faceReference =
    await FaceReference.findOne({
      userId,
    });

  return faceReference;
};

// ============================================================
// SAVE FACE REFERENCE
// ============================================================

export const saveFaceReference = async (
  userId: string,
  imagePath: string
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!imagePath) {
    throw new ApiError(
      400,
      "Reference face image is required"
    );
  }

  const existingReference =
    await FaceReference.findOne({
      userId,
    });

  if (existingReference) {
    existingReference.imageUrl =
      imagePath;

    existingReference.source =
      "OTHER";

    existingReference.status =
      "READY";

    await existingReference.save();

    return existingReference;
  }

  const faceReference =
    await FaceReference.create({
      userId,
      imageUrl: imagePath,
      source: "OTHER",
      status: "READY",
    });

  return faceReference;
};