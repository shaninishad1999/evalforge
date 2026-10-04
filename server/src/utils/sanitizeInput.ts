import mongoose from "mongoose";

// ============================================================
// INPUT SANITIZATION
// ============================================================

// MongoDB operator keys that should never come directly
// from untrusted user input.
const dangerousKeys = new Set([
  "$where",
  "$regex",
  "$expr",
  "$function",
  "$accumulator",
]);

// ============================================================
// HTML SANITIZER
// ============================================================

const sanitizeString = (
  value: string
): string => {
  return value
    .replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    )
    .replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      ""
    )
    .replace(
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      ""
    )
    .replace(
      /<embed\b[^>]*>/gi,
      ""
    )
    .replace(
      /javascript\s*:/gi,
      ""
    )
    .replace(
      /on[a-z]+\s*=/gi,
      ""
    );
};

// ============================================================
// MONGODB OBJECT ID CHECK
// ============================================================

const isObjectId = (
  value: string
): boolean => {
  return mongoose.isValidObjectId(value);
};

// ============================================================
// RECURSIVE SANITIZER
// ============================================================

export const sanitizeInput = <T>(
  value: T
): T => {
  // ----------------------------------------------------------
  // Strings
  // ----------------------------------------------------------

  if (typeof value === "string") {
    // Do not modify valid MongoDB ObjectIds.
    if (isObjectId(value)) {
      return value as T;
    }

    return sanitizeString(value) as T;
  }

  // ----------------------------------------------------------
  // Arrays
  // ----------------------------------------------------------

  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeInput(item)
    ) as T;
  }

  // ----------------------------------------------------------
  // Objects
  // ----------------------------------------------------------

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const input =
      value as Record<string, unknown>;

    const sanitized: Record<
      string,
      unknown
    > = {};

    for (const [
      key,
      childValue,
    ] of Object.entries(input)) {
      // ------------------------------------------------------
      // Block MongoDB operator injection
      // ------------------------------------------------------

      if (
        dangerousKeys.has(key) ||
        key.startsWith("$") ||
        key.includes(".")
      ) {
        continue;
      }

      sanitized[key] =
        sanitizeInput(childValue);
    }

    return sanitized as T;
  }

  // ----------------------------------------------------------
  // Numbers / Booleans / null / undefined
  // ----------------------------------------------------------

  return value;
};

// ============================================================
// SANITIZE OBJECT
// ============================================================

export const sanitizeObject = <
  T extends Record<string, unknown>
>(
  value: T
): T => {
  return sanitizeInput(value);
};

// ============================================================
// SANITIZE BODY
// ============================================================

export const sanitizeBody = <
  T extends Record<string, unknown>
>(
  body: T
): T => {
  return sanitizeInput(body);
};