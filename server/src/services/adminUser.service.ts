import mongoose from "mongoose";

import User, {
  UserRole,
} from "../models/User.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// VALIDATE OBJECT ID
// ============================================================

const validateObjectId = (
  value: string,
  fieldName: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(value)
  ) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// CHECK ADMIN ACCESS TO TARGET USER
// ============================================================

const canManageTargetUser = (
  currentUserId: string,
  currentUserRole: UserRole,
  targetUser: {
    _id: mongoose.Types.ObjectId;
    role: UserRole;
  }
): boolean => {
  // ========================================================
  // SUPER ADMIN
  // ========================================================

  if (
    currentUserRole === "SUPER_ADMIN"
  ) {
    return true;
  }

  // ========================================================
  // ADMIN
  //
  // ADMIN cannot manage SUPER_ADMIN.
  // ADMIN can manage ADMIN and other users.
  // ========================================================

  if (
    currentUserRole === "ADMIN"
  ) {
    if (
      targetUser.role ===
      "SUPER_ADMIN"
    ) {
      return false;
    }

    return true;
  }

  return false;
};

// ============================================================
// GET USERS
// ============================================================

export const getAdminUsers = async (
  currentUserId: string,
  currentUserRole: UserRole,
  filters: {
    search?: string;
    role?: UserRole;
    isActive?: string;
    isVerified?: string;
    page: number;
    limit: number;
  }
) => {
  // ========================================================
  // ADMIN CHECK
  // ========================================================

  if (
    currentUserRole !==
      "SUPER_ADMIN" &&
    currentUserRole !== "ADMIN"
  ) {
    throw new ApiError(
      403,
      "You do not have permission to access user management"
    );
  }

  validateObjectId(
    currentUserId,
    "user ID"
  );

  // ========================================================
  // BUILD FILTER
  // ========================================================

  const query: Record<
    string,
    unknown
  > = {};

  // ========================================================
  // SEARCH
  // ========================================================

  if (filters.search) {
    query.$or = [
      {
        name: {
          $regex: filters.search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: filters.search,
          $options: "i",
        },
      },
    ];
  }

  // ========================================================
  // ROLE FILTER
  // ========================================================

  if (filters.role) {
    query.role = filters.role;
  }

  // ========================================================
  // ACTIVE FILTER
  // ========================================================

  if (
    filters.isActive !== undefined
  ) {
    query.isActive =
      filters.isActive === "true";
  }

  // ========================================================
  // VERIFIED FILTER
  // ========================================================

  if (
    filters.isVerified !== undefined
  ) {
    query.isVerified =
      filters.isVerified === "true";
  }

  // ========================================================
  // SECURITY
  //
  // ADMIN should not see SUPER_ADMIN
  // records in the normal user list.
  // ========================================================

  if (
    currentUserRole === "ADMIN"
  ) {
    query.role = query.role
      ? query.role
      : {
          $ne: "SUPER_ADMIN",
        };
  }

  // ========================================================
  // PAGINATION
  // ========================================================

  const skip =
    (filters.page - 1) *
    filters.limit;

  // ========================================================
  // FETCH USERS
  // ========================================================

  const [users, total] =
    await Promise.all([
      User.find(query)
        .select("-password")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(filters.limit),

      User.countDocuments(query),
    ]);

  return {
    users,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(
        total / filters.limit
      ),
    },
  };
};

// ============================================================
// GET USER BY ID
// ============================================================

export const getAdminUserById =
  async (
    currentUserId: string,
    currentUserRole: UserRole,
    targetUserId: string
  ) => {
    // ========================================================
    // ADMIN CHECK
    // ========================================================

    if (
      currentUserRole !==
        "SUPER_ADMIN" &&
      currentUserRole !== "ADMIN"
    ) {
      throw new ApiError(
        403,
        "You do not have permission to access user management"
      );
    }

    validateObjectId(
      currentUserId,
      "current user ID"
    );

    validateObjectId(
      targetUserId,
      "user ID"
    );

    const user =
      await User.findById(
        targetUserId
      ).select("-password");

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    // ========================================================
    // ADMIN CANNOT ACCESS SUPER ADMIN
    // ========================================================

    if (
      !canManageTargetUser(
        currentUserId,
        currentUserRole,
        user
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to manage this user"
      );
    }

    return user;
  };

// ============================================================
// UPDATE USER ROLE
// ============================================================

export const updateAdminUserRole =
  async (
    currentUserId: string,
    currentUserRole: UserRole,
    targetUserId: string,
    newRole: UserRole
  ) => {
    // ========================================================
    // ADMIN CHECK
    // ========================================================

    if (
      currentUserRole !==
        "SUPER_ADMIN" &&
      currentUserRole !== "ADMIN"
    ) {
      throw new ApiError(
        403,
        "You do not have permission to manage users"
      );
    }

    validateObjectId(
      currentUserId,
      "current user ID"
    );

    validateObjectId(
      targetUserId,
      "user ID"
    );

    // ========================================================
    // PREVENT SELF ROLE CHANGE
    // ========================================================

    if (
      currentUserId === targetUserId
    ) {
      throw new ApiError(
        400,
        "You cannot change your own role"
      );
    }

    const user =
      await User.findById(
        targetUserId
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    // ========================================================
    // TARGET USER AUTHORIZATION
    // ========================================================

    if (
      !canManageTargetUser(
        currentUserId,
        currentUserRole,
        user
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to change this user's role"
      );
    }

    // ========================================================
    // ADMIN CANNOT CREATE SUPER ADMIN
    // ========================================================

    if (
      newRole === "SUPER_ADMIN" &&
      currentUserRole !==
        "SUPER_ADMIN"
    ) {
      throw new ApiError(
        403,
        "Only a Super Admin can assign the Super Admin role"
      );
    }

    // ========================================================
    // UPDATE ROLE
    // ========================================================

    user.role = newRole;

    await user.save();

    return User.findById(
      targetUserId
    ).select("-password");
  };

// ============================================================
// UPDATE USER ACTIVE STATUS
// ============================================================

export const updateAdminUserActiveStatus =
  async (
    currentUserId: string,
    currentUserRole: UserRole,
    targetUserId: string,
    isActive: boolean
  ) => {
    // ========================================================
    // ADMIN CHECK
    // ========================================================

    if (
      currentUserRole !==
        "SUPER_ADMIN" &&
      currentUserRole !== "ADMIN"
    ) {
      throw new ApiError(
        403,
        "You do not have permission to manage users"
      );
    }

    validateObjectId(
      currentUserId,
      "current user ID"
    );

    validateObjectId(
      targetUserId,
      "user ID"
    );

    // ========================================================
    // PREVENT SELF DEACTIVATION
    // ========================================================

    if (
      currentUserId === targetUserId
    ) {
      throw new ApiError(
        400,
        "You cannot change your own active status"
      );
    }

    const user =
      await User.findById(
        targetUserId
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    // ========================================================
    // TARGET USER AUTHORIZATION
    // ========================================================

    if (
      !canManageTargetUser(
        currentUserId,
        currentUserRole,
        user
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to change this user's active status"
      );
    }

    // ========================================================
    // UPDATE STATUS
    // ========================================================

    user.isActive = isActive;

    await user.save();

    return User.findById(
      targetUserId
    ).select("-password");
  };

// ============================================================
// UPDATE USER VERIFICATION STATUS
// ============================================================

export const updateAdminUserVerification =
  async (
    currentUserId: string,
    currentUserRole: UserRole,
    targetUserId: string,
    isVerified: boolean
  ) => {
    // ========================================================
    // ADMIN CHECK
    // ========================================================

    if (
      currentUserRole !==
        "SUPER_ADMIN" &&
      currentUserRole !== "ADMIN"
    ) {
      throw new ApiError(
        403,
        "You do not have permission to manage users"
      );
    }

    validateObjectId(
      currentUserId,
      "current user ID"
    );

    validateObjectId(
      targetUserId,
      "user ID"
    );

    const user =
      await User.findById(
        targetUserId
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    // ========================================================
    // TARGET USER AUTHORIZATION
    // ========================================================

    if (
      !canManageTargetUser(
        currentUserId,
        currentUserRole,
        user
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to change this user's verification status"
      );
    }

    // ========================================================
    // UPDATE VERIFICATION
    // ========================================================

    user.isVerified =
      isVerified;

    await user.save();

    return User.findById(
      targetUserId
    ).select("-password");
  };