import mongoose from "mongoose";

import ProjectAssignment, {
  ProjectAssignmentStatus,
} from "../models/ProjectAssignment.js";

import Project from "../models/Project.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";

import {
  createNotification,
} from "./notification.service.js";

import {
  UserRole,
} from "../models/User.js";

// ============================================================
// TYPES
// ============================================================

interface CreateProjectAssignmentData {
  project: string;
  contributor: string;
  qualification?: string | null;
  qualificationAttempt?: string | null;
  status?: ProjectAssignmentStatus;
}

interface UpdateProjectAssignmentData {
  status?: ProjectAssignmentStatus;
}

// ============================================================
// OBJECT ID VALIDATION
// ============================================================

const validateObjectId = (
  value: string,
  fieldName: string
): void => {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// GET PROJECT
// ============================================================

const getProjectOrThrow = async (
  projectId: string
) => {
  validateObjectId(projectId, "project ID");

  const project =
    await Project.findById(projectId);

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  return project;
};

// ============================================================
// GET CONTRIBUTOR
// ============================================================

const getContributorOrThrow = async (
  contributorId: string
) => {
  validateObjectId(
    contributorId,
    "contributor ID"
  );

  const contributor =
    await User.findById(contributorId);

  if (!contributor) {
    throw new ApiError(
      404,
      "Contributor not found"
    );
  }

  if (contributor.role !== "CONTRIBUTOR") {
    throw new ApiError(
      400,
      "Selected user is not a contributor"
    );
  }

  return contributor;
};

// ============================================================
// PROJECT MANAGEMENT AUTHORIZATION
// ============================================================

const canManageProjectAssignment = (
  project: {
    client: mongoose.Types.ObjectId;
    projectManager:
      | mongoose.Types.ObjectId
      | null;
  },
  userId: string,
  userRole: UserRole
): boolean => {
  // ========================================================
  // ADMIN ACCESS
  // ========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return true;
  }

  // ========================================================
  // CLIENT ACCESS
  // ========================================================

  if (userRole === "CLIENT") {
    return (
      project.client.toString() === userId
    );
  }

  // ========================================================
  // PROJECT MANAGER ACCESS
  // ========================================================

  if (userRole === "PROJECT_MANAGER") {
    return (
      project.projectManager?.toString() ===
      userId
    );
  }

  return false;
};

// ============================================================
// CREATE ASSIGNMENT
// ============================================================

export const createProjectAssignment =
  async (
    userId: string,
    userRole: UserRole,
    data: CreateProjectAssignmentData
  ) => {
    // ========================================================
    // VALIDATE PROJECT
    // ========================================================

    const project =
      await getProjectOrThrow(
        data.project
      );

    // ========================================================
    // CHECK PROJECT MANAGEMENT ACCESS
    // ========================================================

    if (
      !canManageProjectAssignment(
        project,
        userId,
        userRole
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to assign contributors to this project"
      );
    }

    // ========================================================
    // PROJECT STATUS CHECK
    // ========================================================

    if (
      project.status === "ARCHIVED" ||
      project.status === "COMPLETED"
    ) {
      throw new ApiError(
        400,
        "Contributors cannot be assigned to an archived or completed project"
      );
    }

    // ========================================================
    // VALIDATE CONTRIBUTOR
    // ========================================================

    await getContributorOrThrow(
      data.contributor
    );

    // ========================================================
    // VALIDATE QUALIFICATION
    // ========================================================

    if (data.qualification) {
      validateObjectId(
        data.qualification,
        "qualification ID"
      );

      const Qualification =
        mongoose.model("Qualification");

      const qualification =
        await Qualification.findById(
          data.qualification
        );

      if (!qualification) {
        throw new ApiError(
          404,
          "Qualification not found"
        );
      }

      if (
        qualification.project &&
        qualification.project.toString() !==
          data.project
      ) {
        throw new ApiError(
          400,
          "Qualification does not belong to this project"
        );
      }
    }

    // ========================================================
    // VALIDATE QUALIFICATION ATTEMPT
    // ========================================================

    if (data.qualificationAttempt) {
      validateObjectId(
        data.qualificationAttempt,
        "qualification attempt ID"
      );

      const QualificationAttempt =
        mongoose.model(
          "QualificationAttempt"
        );

      const attempt =
        await QualificationAttempt.findById(
          data.qualificationAttempt
        );

      if (!attempt) {
        throw new ApiError(
          404,
          "Qualification attempt not found"
        );
      }

      if (
        attempt.user?.toString() !==
        data.contributor
      ) {
        throw new ApiError(
          400,
          "Qualification attempt does not belong to this contributor"
        );
      }

      if (
        data.qualification &&
        attempt.qualification?.toString() !==
          data.qualification
      ) {
        throw new ApiError(
          400,
          "Qualification attempt does not belong to the selected qualification"
        );
      }
    }

    // ========================================================
    // CHECK EXISTING ASSIGNMENT
    // ========================================================

    const existingAssignment =
      await ProjectAssignment.findOne({
        project: data.project,
        contributor: data.contributor,
      });

    if (existingAssignment) {
      throw new ApiError(
        409,
        "Contributor is already assigned to this project"
      );
    }

    // ========================================================
    // CREATE ASSIGNMENT
    // ========================================================

    const assignment =
      await ProjectAssignment.create({
        project: data.project,
        contributor: data.contributor,
        qualification:
          data.qualification ?? null,
        qualificationAttempt:
          data.qualificationAttempt ?? null,
        assignedBy: userId,
        status:
          data.status ?? "ACTIVE",
      });

    // ========================================================
    // NOTIFICATION
    // ========================================================

    try {
      await createNotification({
        user: data.contributor,
        type: "PROJECT",
        title: "New project assigned",
        message: `You have been assigned to project "${project.title}".`,
        link: `/projects/${data.project}`,
        metadata: {
          projectId: data.project,
          assignmentId:
            assignment._id.toString(),
        },
      });
    } catch (error) {
      console.error(
        "Project assignment notification failed:",
        error
      );
    }

    // ========================================================
    // RETURN POPULATED ASSIGNMENT
    // ========================================================

    return ProjectAssignment.findById(
      assignment._id
    )
      .populate(
        "project",
        "title description status"
      )
      .populate(
        "contributor",
        "name email role"
      )
      .populate(
        "qualification",
        "title status"
      )
      .populate(
        "assignedBy",
        "name email role"
      );
  };

// ============================================================
// GET ASSIGNMENT BY ID
// ============================================================

export const getProjectAssignmentById =
  async (
    assignmentId: string,
    userId: string,
    userRole: UserRole
  ) => {
    validateObjectId(
      assignmentId,
      "assignment ID"
    );

    const assignment =
      await ProjectAssignment.findById(
        assignmentId
      )
        .populate(
          "project",
          "title description status client projectManager"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .populate(
          "qualification",
          "title status"
        )
        .populate(
          "qualificationAttempt"
        )
        .populate(
          "assignedBy",
          "name email role"
        );

    if (!assignment) {
      throw new ApiError(
        404,
        "Project assignment not found"
      );
    }

    // ========================================================
    // ADMIN ACCESS
    // ========================================================

    if (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    ) {
      return assignment;
    }

    // ========================================================
    // CONTRIBUTOR ACCESS
    // ========================================================

    if (
      userRole === "CONTRIBUTOR"
    ) {
      if (
        assignment.contributor._id.toString() !==
        userId
      ) {
        throw new ApiError(
          403,
          "You do not have permission to access this assignment"
        );
      }

      return assignment;
    }

    // ========================================================
    // PROJECT OWNER / MANAGER ACCESS
    // ========================================================

    const project =
      assignment.project as unknown as {
        client: mongoose.Types.ObjectId;
        projectManager:
          | mongoose.Types.ObjectId
          | null;
      };

    if (
      !canManageProjectAssignment(
        project,
        userId,
        userRole
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to access this assignment"
      );
    }

    return assignment;
  };

// ============================================================
// GET MY ASSIGNMENTS
// ============================================================

export const getMyProjectAssignments =
  async (
    userId: string,
    status?: ProjectAssignmentStatus
  ) => {
    const filter: {
      contributor: string;
      status?: ProjectAssignmentStatus;
    } = {
      contributor: userId,
    };

    if (status) {
      filter.status = status;
    }

    return ProjectAssignment.find(filter)
      .populate(
        "project",
        "title description status"
      )
      .populate(
        "qualification",
        "title status"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// GET PROJECT ASSIGNMENTS
// ============================================================

export const getProjectAssignments =
  async (
    projectId: string,
    userId: string,
    userRole: UserRole,
    status?: ProjectAssignmentStatus
  ) => {
    const project =
      await getProjectOrThrow(
        projectId
      );

    // ========================================================
    // CONTRIBUTOR CANNOT VIEW ALL PROJECT ASSIGNMENTS
    // ========================================================

    if (
      userRole === "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Contributors cannot view all assignments for a project"
      );
    }

    // ========================================================
    // CHECK MANAGEMENT ACCESS
    // ========================================================

    if (
      !canManageProjectAssignment(
        project,
        userId,
        userRole
      )
    ) {
      throw new ApiError(
        403,
        "You do not have permission to access project assignments"
      );
    }

    const filter: {
      project: string;
      status?: ProjectAssignmentStatus;
    } = {
      project: projectId,
    };

    if (status) {
      filter.status = status;
    }

    return ProjectAssignment.find(
      filter
    )
      .populate(
        "contributor",
        "name email role"
      )
      .populate(
        "qualification",
        "title status"
      )
      .populate(
        "assignedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// UPDATE ASSIGNMENT STATUS
// ============================================================

export const updateProjectAssignment =
  async (
    assignmentId: string,
    userId: string,
    userRole: UserRole,
    data: UpdateProjectAssignmentData
  ) => {
    validateObjectId(
      assignmentId,
      "assignment ID"
    );

    const assignment =
      await ProjectAssignment.findById(
        assignmentId
      );

    if (!assignment) {
      throw new ApiError(
        404,
        "Project assignment not found"
      );
    }

    const project =
      await getProjectOrThrow(
        assignment.project.toString()
      );

    // ========================================================
    // CONTRIBUTOR STATUS CONTROL
    // ========================================================

    if (
      userRole === "CONTRIBUTOR"
    ) {
      if (
        assignment.contributor.toString() !==
        userId
      ) {
        throw new ApiError(
          403,
          "You do not have permission to update this assignment"
        );
      }

      if (!data.status) {
        throw new ApiError(
          400,
          "Assignment status is required"
        );
      }

      // Contributor can only control working states.
      if (
        ![
          "ACTIVE",
          "PAUSED",
          "COMPLETED",
        ].includes(data.status)
      ) {
        throw new ApiError(
          403,
          "Contributor cannot set this assignment status"
        );
      }
    } else {
      // ======================================================
      // MANAGEMENT ACCESS
      // ======================================================

      if (
        !canManageProjectAssignment(
          project,
          userId,
          userRole
        )
      ) {
        throw new ApiError(
          403,
          "You do not have permission to update this assignment"
        );
      }
    }

    // ========================================================
    // STATUS TRANSITIONS
    // ========================================================

    const currentStatus =
      assignment.status;

    const nextStatus =
      data.status;

    if (!nextStatus) {
      throw new ApiError(
        400,
        "Assignment status is required"
      );
    }

    const allowedTransitions:
      Record<
        ProjectAssignmentStatus,
        ProjectAssignmentStatus[]
      > = {
        PENDING: [
          "ACTIVE",
          "REMOVED",
        ],
        ACTIVE: [
          "PAUSED",
          "COMPLETED",
          "REMOVED",
        ],
        PAUSED: [
          "ACTIVE",
          "COMPLETED",
          "REMOVED",
        ],
        COMPLETED: [],
        REMOVED: [],
      };

    if (
      currentStatus !== nextStatus &&
      !allowedTransitions[
        currentStatus
      ].includes(nextStatus)
    ) {
      throw new ApiError(
        400,
        `Cannot change assignment status from ${currentStatus} to ${nextStatus}`
      );
    }

    // ========================================================
    // UPDATE DATES
    // ========================================================

    assignment.status =
      nextStatus;

    if (
      nextStatus === "ACTIVE" &&
      !assignment.startedAt
    ) {
      assignment.startedAt =
        new Date();
    }

    if (
      nextStatus === "COMPLETED"
    ) {
      assignment.completedAt =
        new Date();
    }

    if (
      nextStatus === "REMOVED"
    ) {
      assignment.removedAt =
        new Date();
    }

    // ========================================================
    // SAVE
    // ========================================================

    await assignment.save();

    // ========================================================
    // RETURN
    // ========================================================

    return ProjectAssignment.findById(
      assignment._id
    )
      .populate(
        "project",
        "title description status"
      )
      .populate(
        "contributor",
        "name email role"
      )
      .populate(
        "qualification",
        "title status"
      )
      .populate(
        "assignedBy",
        "name email role"
      );
  };

// ============================================================
// REMOVE ASSIGNMENT
// ============================================================

export const removeProjectAssignment =
  async (
    assignmentId: string,
    userId: string,
    userRole: UserRole
  ) => {
    return updateProjectAssignment(
      assignmentId,
      userId,
      userRole,
      {
        status: "REMOVED",
      }
    );
  };