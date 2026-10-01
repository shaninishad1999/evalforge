import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { AuthUser } from "../types/auth.js";
import { UserRole } from "../models/User.js";
import ApiError from "../utils/ApiError.js";

interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
};

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getAccessSecret()) as JwtPayload;

    if (!decoded.userId || !decoded.role) {
      return next(new ApiError(401, "Invalid access token"));
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired access token"));
  }
};