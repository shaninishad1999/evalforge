import bcrypt from "bcryptjs";
import crypto from "crypto";

import AuthSession from "../models/AuthSession.js";
import User, { UserRole } from "../models/User.js";
import ApiError from "../utils/ApiError.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

interface RegisterData {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

// Register User
export const registerUser = async (
  data: RegisterData
) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    role,
  } = data;

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    12
  );

  const user = await User.create({
    name,
    email,
    phoneNumber: phoneNumber || "",
    password: hashedPassword,
    role,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    role: user.role,
    avatar: user.avatar,
    skills: user.skills,
    languages: user.languages,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

// Login User
export const loginUser = async (
  data: LoginData
) => {
  const { email, password } = data;

  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account is inactive"
    );
  }

  const isPasswordValid =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!isPasswordValid) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  const accessToken =
    generateAccessToken(tokenPayload);

  const refreshToken =
    generateRefreshToken(tokenPayload);

  await createAuthSession(
    user._id.toString(),
    refreshToken
  );

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      role: user.role,
      avatar: user.avatar,
      skills: user.skills,
      languages: user.languages,
      isVerified: user.isVerified,
      isActive: user.isActive,
    },
    accessToken,
    refreshToken,
  };
};

// Create Auth Session
export const createAuthSession = async (
  userId: string,
  refreshToken: string
) => {
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() +
      7 * 24 * 60 * 60 * 1000
  );

  await AuthSession.create({
    userId,
    refreshTokenHash,
    expiresAt,
  });
};

// Find Auth Session
export const findAuthSession = async (
  refreshToken: string
) => {
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return AuthSession.findOne({
    refreshTokenHash,
    expiresAt: {
      $gt: new Date(),
    },
  });
};

// Delete Auth Session
export const deleteAuthSession = async (
  refreshToken: string
) => {
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await AuthSession.deleteOne({
    refreshTokenHash,
  });
};