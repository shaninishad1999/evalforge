import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import ApiError from "../utils/ApiError.js";

const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  console.error("❌ Error:", error);

  // Zod validation error
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // Custom API error
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  // Unknown error
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorHandler;