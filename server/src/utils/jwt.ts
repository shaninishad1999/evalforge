import jwt from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  role: string;
}

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  return secret;
};

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: "7d",
  });
};