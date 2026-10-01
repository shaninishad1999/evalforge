import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "../validations/auth.validation.js";

import {
  registerUser,
  loginUser,
  findAuthSession,
  deleteAuthSession,
} from "../services/auth.service.js";

import { generateAccessToken } from "../utils/jwt.js";

// Register
export const register = async (
  req: Request,
  res: Response
) => {
  const validatedData = registerSchema.parse(req.body);

  const user = await registerUser(validatedData);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: {
      user,
    },
  });
};

// Login
export const login = async (
  req: Request,
  res: Response
) => {
  const validatedData = loginSchema.parse(req.body);

  const {
    user,
    accessToken,
    refreshToken,
  } = await loginUser(validatedData);

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
};

// Get Current User
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authenticated user not found"
    );
  }

  const user = await User.findById(
    req.user.userId
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: {
      user,
    },
  });
};

// Refresh Access Token
export const refreshAccessToken = async (
  req: Request,
  res: Response
) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required"
    );
  }

  const refreshSecret =
    process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined"
    );
  }

  let decoded: {
    userId: string;
    role: string;
  };

  try {
    decoded = jwt.verify(
      refreshToken,
      refreshSecret
    ) as typeof decoded;
  } catch {
    throw new ApiError(
      401,
      "Invalid or expired refresh token"
    );
  }

  const session = await findAuthSession(
    refreshToken
  );

  if (!session) {
    throw new ApiError(
      401,
      "Refresh session not found or expired"
    );
  }

  const user = await User.findById(
    decoded.userId
  );

  if (!user || !user.isActive) {
    throw new ApiError(
      401,
      "User account is unavailable"
    );
  }

  const newAccessToken =
    generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    data: {
      accessToken: newAccessToken,
    },
  });
};

// Logout
export const logout = async (
  req: Request,
  res: Response
) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await deleteAuthSession(refreshToken);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};