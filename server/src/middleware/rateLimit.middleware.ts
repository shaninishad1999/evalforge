import rateLimit from "express-rate-limit";

// ============================================================
// GENERAL API RATE LIMITER
// ============================================================

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 300,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests from this IP. Please try again later.",
  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many requests from this IP. Please try again later.",
    });
  },
});

// ============================================================
// AUTH RATE LIMITER
// ============================================================

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many authentication attempts. Please try again later.",
    });
  },
});

// ============================================================
// STRICT WRITE RATE LIMITER
// ============================================================

export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 100,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many write requests. Please try again later.",
  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many write requests. Please try again later.",
    });
  },
});