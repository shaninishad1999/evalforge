export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "PROJECT_MANAGER"
  | "REVIEWER"
  | "CONTRIBUTOR";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export const authStorage = {
  setAccessToken(token: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "evalforge_access_token",
        token
      );
    }
  },

  getAccessToken() {
    if (typeof window === "undefined") {
      return null;
    }

    return sessionStorage.getItem(
      "evalforge_access_token"
    );
  },

  clearAccessToken() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(
        "evalforge_access_token"
      );
    }
  },
};