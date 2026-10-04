import {
  NextFunction,
  Request,
  Response,
} from "express";

// ============================================================
// SECURITY HEADERS
// ============================================================

export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent MIME type sniffing
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  // Prevent clickjacking
  res.setHeader(
    "X-Frame-Options",
    "DENY"
  );

  // Enable browser XSS protection where supported
  res.setHeader(
    "X-XSS-Protection",
    "1; mode=block"
  );

  // Referrer policy
  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  // Restrict browser features
  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
    ].join(", ")
  );

  // Prevent browsers from guessing download content
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
    ].join("; ")
  );

  // Disable caching for authenticated API responses
  if (
    req.headers.authorization ||
    req.method !== "GET"
  ) {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );
  }

  next();
};

// ============================================================
// REQUEST SIZE PROTECTION
// ============================================================

export const requestSizeProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const contentLength =
    req.headers["content-length"];

  if (!contentLength) {
    return next();
  }

  const size = Number(contentLength);

  if (!Number.isFinite(size)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid Content-Length header",
    });
  }

  // 10 MB maximum request size
  const maxRequestSize =
    10 * 1024 * 1024;

  if (size > maxRequestSize) {
    return res.status(413).json({
      success: false,
      message:
        "Request payload is too large.",
    });
  }

  next();
};