import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import ApiError from "../utils/ApiError.js";

import {
  updateProfileSchema,
  submitKycSchema,
} from "../validations/user.validation.js";

import {
  getUserProfile,
  updateUserProfile,
  getKycProfile,
  submitKyc,
  savePanDocument,
} from "../services/user.service.js";

// GET /api/users/me
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const user = await getUserProfile(
    req.user.userId
  );

  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: {
      user,
    },
  });
};

// PATCH /api/users/me
export const updateMe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const validatedData =
    updateProfileSchema.parse(req.body);

  const user = await updateUserProfile(
    req.user.userId,
    validatedData
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user,
    },
  });
};

// GET /api/users/me/kyc
export const getMyKyc = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const kycProfile = await getKycProfile(
    req.user.userId
  );

  res.status(200).json({
    success: true,
    message: "KYC profile fetched successfully",
    data: {
      kyc: kycProfile,
    },
  });
};

// POST /api/users/me/kyc
export const submitMyKyc = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const validatedData =
    submitKycSchema.parse(req.body);

  const kycProfile = await submitKyc(
    req.user.userId,
    validatedData
  );

  res.status(200).json({
    success: true,
    message:
      "KYC submitted successfully. Your verification is under review.",
    data: {
      kyc: kycProfile,
    },
  });
};

// POST /api/users/me/kyc/pan-document
export const uploadPanDocument = async (
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
      "PAN card document is required"
    );
  }

  const kycProfile = await savePanDocument(
    req.user.userId,
    req.file.path
  );

  res.status(200).json({
    success: true,
    message:
      "PAN document uploaded successfully",
    data: {
      kyc: kycProfile,
    },
  });
};