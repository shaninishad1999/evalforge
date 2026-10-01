import { UserRole } from "../models/User.js";

export interface AuthUser {
  userId: string;
  role: UserRole;
}