import mongoose from "mongoose";

import Project, {
  ProjectStatus,
  IProject,
} from "../models/Project.js";

import { UserRole } from "../models/User.js";

import ApiError from "../utils/ApiError.js";

import {
  CreateProjectInput,
  UpdateProjectInput,
} from "../validations/project.validation.js";

// ============================================================
// PROJECT STATUS TRANSITIONS
// ============================================================

const allowedStatusTransitions: Record<
  ProjectStatus,
  ProjectStatus[]
> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ACTIVE", "DRAFT", "ARCHIVED"],
  ACTIVE: ["PAUSED", "COMPLETED"],
  PAUSED: ["ACTIVE", "COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

// ============================================================
// VALIDATE OBJECT ID
// ============================================================

const validateObjectId = (
  value: string,
  fieldName: string
) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// GET RAW USER ID FROM PROJECT REFERENCE
// ============================================================

const getReferenceId = (
  reference:
    | mongoose.Types.ObjectId
    | {
        _id: mongoose.Types.ObjectId;
      }
    | null
    | undefined
): string | null => {
  if (!reference) {
    return null;
  }

  if (
    typeof reference === "object" &&
    "_id" in reference
  ) {
    return reference._id.toString();
  }

  return String(reference);
};

// ============================================================
// CHECK PROJECT ACCESS
// ============================================================

const canManageProject = (
  project: IProject,
  userId: string,
  userRole: string
) => {
  // ==========================================================
  // SUPER ADMIN / ADMIN
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return true;
  }

  // ==========================================================
  // CLIENT OWNER
  // ==========================================================

  if (userRole === "CLIENT") {
    const clientId = getReferenceId(
      project.client
    );

    if (clientId === userId) {
      return true;
    }
  }

  // ==========================================================
  // PROJECT MANAGER
  // ==========================================================

  if (userRole === "PROJECT_MANAGER") {
    const projectManagerId = getReferenceId(
      project.projectManager
    );

    if (
      projectManagerId &&
      projectManagerId === userId
    ) {
      return true;
    }
  }

  return false;
};

// ============================================================
// CREATE PROJECT
// ============================================================

export const createProject = async (
  userId: string,
  userRole: string,
  data: CreateProjectInput
) => {
  validateObjectId(userId, "user ID");

  // ==========================================================
  // ALLOWED PROJECT CREATORS
  // ==========================================================

  const allowedRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER",
  ];

  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(
      403,
      "You are not allowed to create projects"
    );
  }

  // ==========================================================
  // DATE VALIDATION
  // ==========================================================

  if (
    data.startDate &&
    data.endDate &&
    data.endDate <= data.startDate
  ) {
    throw new ApiError(
      400,
      "End date must be after start date"
    );
  }

  // ==========================================================
  // EXPERIENCE VALIDATION
  // ==========================================================

  if (
    data.requirements?.maxExperience !== null &&
    data.requirements?.maxExperience !== undefined &&
    data.requirements.minExperience !== undefined &&
    data.requirements.maxExperience <
      data.requirements.minExperience
  ) {
    throw new ApiError(
      400,
      "Maximum experience cannot be less than minimum experience"
    );
  }

  // ==========================================================
  // QUALIFICATION VALIDATION
  // ==========================================================

  if (
    data.qualification?.required &&
    !data.qualification.qualificationId
  ) {
    throw new ApiError(
      400,
      "Qualification ID is required when qualification is mandatory"
    );
  }

  // ==========================================================
  // CREATE PROJECT
  // ==========================================================

  const project = await Project.create({
    ...data,

    // The authenticated user becomes the owner
    // when the project is created.
    client: userId,

    projectManager:
      data.projectManager ?? null,

    status: "DRAFT",
  });

  return project;
};

// ============================================================
// GET PROJECT BY ID
// ============================================================

export const getProjectById = async (
  projectId: string,
  userId?: string,
  userRole?: string
) => {
  validateObjectId(projectId, "project ID");

  const project = await Project.findById(projectId)
    .populate(
      "client",
      "name email role"
    )
    .populate(
      "projectManager",
      "name email role"
    );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // PRIVATE PROJECT ACCESS
  // ==========================================================

  if (
    userId &&
    userRole &&
    (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    )
  ) {
    return project;
  }

  // ==========================================================
  // OWNER / MANAGER ACCESS
  // ==========================================================

  if (
    userId &&
    userRole &&
    canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    return project;
  }

  // ==========================================================
  // PUBLIC PROJECT ACCESS
  // ==========================================================

  if (
    project.status !== "PUBLISHED" &&
    project.status !== "ACTIVE"
  ) {
    throw new ApiError(
      403,
      "You do not have access to this project"
    );
  }

  return project;
};

// ============================================================
// GET PROJECTS
// ============================================================

export const getProjects = async (
  userId: string,
  userRole: string
) => {
  validateObjectId(userId, "user ID");

  // ==========================================================
  // ADMIN
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return Project.find()
      .populate(
        "client",
        "name email role"
      )
      .populate(
        "projectManager",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // CLIENT
  // ==========================================================

  if (userRole === "CLIENT") {
    return Project.find({
      client: userId,
    })
      .populate(
        "projectManager",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // PROJECT MANAGER
  // ==========================================================

  if (
    userRole === "PROJECT_MANAGER"
  ) {
    return Project.find({
      projectManager: userId,
    })
      .populate(
        "client",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // OTHER USERS
  // ==========================================================

  return Project.find({
    status: {
      $in: ["PUBLISHED", "ACTIVE"],
    },
  })
    .populate(
      "client",
      "name email role"
    )
    .populate(
      "projectManager",
      "name email role"
    )
    .sort({
      createdAt: -1,
    });
};

// ============================================================
// UPDATE PROJECT
// ============================================================

export const updateProject = async (
  projectId: string,
  userId: string,
  userRole: string,
  data: UpdateProjectInput
) => {
  validateObjectId(projectId, "project ID");
  validateObjectId(userId, "user ID");

  const project =
    await Project.findById(projectId);

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  if (
    !canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    throw new ApiError(
      403,
      "You are not allowed to update this project"
    );
  }

  // ==========================================================
  // ARCHIVED PROJECT
  // ==========================================================

  if (
    project.status === "ARCHIVED"
  ) {
    throw new ApiError(
      400,
      "Archived projects cannot be updated"
    );
  }

  // ==========================================================
  // COMPLETED PROJECT
  // ==========================================================

  if (
    project.status === "COMPLETED"
  ) {
    throw new ApiError(
      400,
      "Completed projects cannot be updated"
    );
  }

  // ==========================================================
  // DATE VALIDATION
  // ==========================================================

  const startDate =
    data.startDate !== undefined
      ? data.startDate
      : project.startDate;

  const endDate =
    data.endDate !== undefined
      ? data.endDate
      : project.endDate;

  if (
    startDate &&
    endDate &&
    endDate <= startDate
  ) {
    throw new ApiError(
      400,
      "End date must be after start date"
    );
  }

  // ==========================================================
  // EXPERIENCE VALIDATION
  // ==========================================================

  const minExperience =
    data.requirements?.minExperience ??
    project.requirements.minExperience;

  const maxExperience =
    data.requirements?.maxExperience !==
    undefined
      ? data.requirements.maxExperience
      : project.requirements.maxExperience;

  if (
    maxExperience !== null &&
    maxExperience !== undefined &&
    maxExperience < minExperience
  ) {
    throw new ApiError(
      400,
      "Maximum experience cannot be less than minimum experience"
    );
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  Object.assign(project, data);

  await project.save();

  return project;
};

// ============================================================
// CHANGE PROJECT STATUS
// ============================================================

export const changeProjectStatus = async (
  projectId: string,
  userId: string,
  userRole: string,
  newStatus: ProjectStatus
) => {
  validateObjectId(projectId, "project ID");
  validateObjectId(userId, "user ID");

  const project =
    await Project.findById(projectId);

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  if (
    !canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    throw new ApiError(
      403,
      "You are not allowed to change this project's status"
    );
  }

  // ==========================================================
  // SAME STATUS
  // ==========================================================

  if (
    project.status === newStatus
  ) {
    throw new ApiError(
      400,
      `Project is already ${newStatus}`
    );
  }

  // ==========================================================
  // CHECK TRANSITION
  // ==========================================================

  const allowedTransitions =
    allowedStatusTransitions[
      project.status
    ];

  if (
    !allowedTransitions.includes(
      newStatus
    )
  ) {
    throw new ApiError(
      400,
      `Project cannot move from ${project.status} to ${newStatus}`
    );
  }

  // ==========================================================
  // PUBLISH VALIDATION
  // ==========================================================

  if (
    newStatus === "PUBLISHED"
  ) {
    if (
      !project.title ||
      !project.description
    ) {
      throw new ApiError(
        400,
        "Project title and description are required before publishing"
      );
    }

    if (
      project.taskConfiguration.taskTypes
        .length === 0
    ) {
      throw new ApiError(
        400,
        "At least one task type is required before publishing"
      );
    }

    if (
      project.rewardConfiguration.rewardAmount <=
      0
    ) {
      throw new ApiError(
        400,
        "A valid reward amount is required before publishing"
      );
    }
  }

  // ==========================================================
  // ACTIVATE VALIDATION
  // ==========================================================

  if (
    newStatus === "ACTIVE" &&
    project.status !== "PUBLISHED" &&
    project.status !== "PAUSED"
  ) {
    throw new ApiError(
      400,
      "Only published or paused projects can be activated"
    );
  }

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  project.status = newStatus;

  await project.save();

  return project;
};

// ============================================================
// DELETE / ARCHIVE PROJECT
// ============================================================

export const archiveProject = async (
  projectId: string,
  userId: string,
  userRole: string
) => {
  validateObjectId(projectId, "project ID");
  validateObjectId(userId, "user ID");

  const project =
    await Project.findById(projectId);

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  if (
    !canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    throw new ApiError(
      403,
      "You are not allowed to archive this project"
    );
  }

  // ==========================================================
  // ALREADY ARCHIVED
  // ==========================================================

  if (
    project.status === "ARCHIVED"
  ) {
    throw new ApiError(
      400,
      "Project is already archived"
    );
  }

  // ==========================================================
  // ARCHIVE
  // ==========================================================

  project.status = "ARCHIVED";

  await project.save();

  return project;
};