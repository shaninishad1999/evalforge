import { NextFunction, Response } from "express";

import { UserRole } from "../models/User.js";
import { AuthenticatedRequest } from "./auth.middleware.js";
import ApiError from "../utils/ApiError.js";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to access this resource")
      );
    }

    next();
  };
};