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
// MONGOOSE DOCUMENT TYPES
// ============================================================

interface QualificationDocument {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  title?: string;
  status?: string;
}

interface QualificationAttemptDocument {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  qualification: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId | null;
  status: string;
}

// ============================================================
// OBJECT ID VALIDATION
// ============================================================

const validateObjectId = (
  value: string,
  fieldName: string
): void => {
  if (
    !mongoose.isValidObjectId(
      value
    )
  ) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// GET PROJECT
// ============================================================

const getProjectOrThrow =
  async (
    projectId: string
  ) => {
    validateObjectId(
      projectId,
      "project ID"
    );

    const project =
      await Project.findById(
        projectId
      );

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

const getContributorOrThrow =
  async (
    contributorId: string
  ) => {
    validateObjectId(
      contributorId,
      "contributor ID"
    );

    const contributor =
      await User.findById(
        contributorId
      );

    if (!contributor) {
      throw new ApiError(
        404,
        "Contributor not found"
      );
    }

    if (
      contributor.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        400,
        "Selected user is not a contributor"
      );
    }

    if (
      !contributor.isActive
    ) {
      throw new ApiError(
        400,
        "Selected contributor account is inactive"
      );
    }

    return contributor;
  };

// ============================================================
// PROJECT MANAGEMENT AUTHORIZATION
// ============================================================

const canManageProjectAssignment =
  (
    project: {
      client:
        mongoose.Types.ObjectId;

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
      userRole ===
        "SUPER_ADMIN" ||
      userRole ===
        "ADMIN"
    ) {
      return true;
    }

    // ========================================================
    // CLIENT ACCESS
    // ========================================================

    if (
      userRole ===
      "CLIENT"
    ) {
      return (
        project.client.toString() ===
        userId
      );
    }

    // ========================================================
    // PROJECT MANAGER ACCESS
    // ========================================================

    if (
      userRole ===
      "PROJECT_MANAGER"
    ) {
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
    validateObjectId(
      userId,
      "user ID"
    );

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
      project.status ===
        "ARCHIVED" ||
      project.status ===
        "COMPLETED"
    ) {
      throw new ApiError(
        400,
        "Contributors cannot be assigned to an archived or completed project"
      );
    }

    // ========================================================
    // STATUS CHECK
    //
    // New assignments can only start as:
    //
    // PENDING
    // ACTIVE
    //
    // They cannot be created directly as:
    // PAUSED / COMPLETED / REMOVED
    // ========================================================

    const initialStatus =
      data.status ??
      "ACTIVE";

    if (
      initialStatus !==
        "PENDING" &&
      initialStatus !==
        "ACTIVE"
    ) {
      throw new ApiError(
        400,
        "New project assignment can only start as PENDING or ACTIVE"
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

    let qualification:
      | QualificationDocument
      | null = null;

    if (
      data.qualification
    ) {
      validateObjectId(
        data.qualification,
        "qualification ID"
      );

      const Qualification =
        mongoose.model<QualificationDocument>(
          "Qualification"
        );

      qualification =
        await Qualification.findById(
          data.qualification
        );

      if (!qualification) {
        throw new ApiError(
          404,
          "Qualification not found"
        );
      }

      // ======================================================
      // QUALIFICATION MUST BELONG TO PROJECT
      // ======================================================

      if (
        qualification.project.toString() !==
        data.project
      ) {
        throw new ApiError(
          400,
          "Qualification does not belong to the selected project"
        );
      }
    }

    // ========================================================
    // VALIDATE QUALIFICATION ATTEMPT
    // ========================================================

    let qualificationAttempt:
      | QualificationAttemptDocument
      | null = null;

    if (
      data.qualificationAttempt
    ) {
      validateObjectId(
        data.qualificationAttempt,
        "qualification attempt ID"
      );

      const QualificationAttempt =
        mongoose.model<QualificationAttemptDocument>(
          "QualificationAttempt"
        );

      qualificationAttempt =
        await QualificationAttempt.findById(
          data.qualificationAttempt
        );

      if (
        !qualificationAttempt
      ) {
        throw new ApiError(
          404,
          "Qualification attempt not found"
        );
      }

      // ======================================================
      // ATTEMPT MUST BELONG TO CONTRIBUTOR
      // ======================================================

      if (
        qualificationAttempt.user.toString() !==
        data.contributor
      ) {
        throw new ApiError(
          400,
          "Qualification attempt does not belong to the selected contributor"
        );
      }

      // ======================================================
      // ATTEMPT MUST MATCH QUALIFICATION
      // ======================================================

      if (
        data.qualification &&
        qualificationAttempt.qualification.toString() !==
          data.qualification
      ) {
        throw new ApiError(
          400,
          "Qualification attempt does not belong to the selected qualification"
        );
      }

      // ======================================================
      // ATTEMPT MUST BE PASSED
      // ======================================================

      if (
        qualificationAttempt.status !==
        "PASSED"
      ) {
        throw new ApiError(
          400,
          "Qualification attempt must be passed before project assignment"
        );
      }

      // ======================================================
      // ATTEMPT PROJECT CHECK
      // ======================================================

      if (
        qualificationAttempt.project &&
        qualificationAttempt.project.toString() !==
          data.project
      ) {
        throw new ApiError(
          400,
          "Qualification attempt does not belong to the selected project"
        );
      }
    }

    // ========================================================
    // CHECK PROJECT QUALIFICATION REQUIREMENT
    // ========================================================

    if (
      project.qualification?.required
    ) {
      if (
        !data.qualification
      ) {
        throw new ApiError(
          400,
          "This project requires a qualification before assignment"
        );
      }

      if (
        project.qualification.qualificationId &&
        project.qualification.qualificationId.toString() !==
          data.qualification
      ) {
        throw new ApiError(
          400,
          "Selected qualification does not match the project's required qualification"
        );
      }

      if (
        !data.qualificationAttempt
      ) {
        throw new ApiError(
          400,
          "A passed qualification attempt is required for this project"
        );
      }
    }

    // ========================================================
    // CHECK EXISTING ASSIGNMENT
    // ========================================================

    const existingAssignment =
      await ProjectAssignment.findOne({
        project:
          data.project,

        contributor:
          data.contributor,
      });

    if (
      existingAssignment
    ) {
      // ======================================================
      // EXISTING REMOVED ASSIGNMENT
      //
      // Because the ProjectAssignment model has a unique
      // project + contributor index, a new document cannot be
      // created for the same contributor/project.
      //
      // Instead of creating a duplicate assignment, reactivate
      // the existing removed assignment.
      // ======================================================

      if (
        existingAssignment.status ===
        "REMOVED"
      ) {
        existingAssignment.status =
          initialStatus;

        existingAssignment.assignedBy =
          new mongoose.Types.ObjectId(
            userId
          );

        existingAssignment.assignedAt =
          new Date();

        existingAssignment.removedAt =
          null;

        existingAssignment.completedAt =
          null;

        existingAssignment.startedAt =
          initialStatus ===
          "ACTIVE"
            ? new Date()
            : null;

        existingAssignment.qualification =
          data.qualification
            ? new mongoose.Types.ObjectId(
                data.qualification
              )
            : null;

        existingAssignment.qualificationAttempt =
          data.qualificationAttempt
            ? new mongoose.Types.ObjectId(
                data.qualificationAttempt
              )
            : null;

        await existingAssignment.save();

        // ====================================================
        // NOTIFICATION
        // ====================================================

        try {
          await createNotification({
            user:
              data.contributor,

            type:
              "PROJECT",

            title:
              "Project assignment reactivated",

            message:
              `You have been assigned to project "${project.title}".`,

            link:
              `/projects/${data.project}`,

            metadata: {
              projectId:
                data.project,

              assignmentId:
                existingAssignment._id.toString(),
            },
          });
        } catch (error) {
          console.error(
            "Project assignment notification failed:",
            error
          );
        }

        return ProjectAssignment.findById(
          existingAssignment._id
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
      }

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
        project:
          new mongoose.Types.ObjectId(
            data.project
          ),

        contributor:
          new mongoose.Types.ObjectId(
            data.contributor
          ),

        qualification:
          data.qualification
            ? new mongoose.Types.ObjectId(
                data.qualification
              )
            : null,

        qualificationAttempt:
          data.qualificationAttempt
            ? new mongoose.Types.ObjectId(
                data.qualificationAttempt
              )
            : null,

        assignedBy:
          new mongoose.Types.ObjectId(
            userId
          ),

        status:
          initialStatus,

        assignedAt:
          new Date(),

        startedAt:
          initialStatus ===
          "ACTIVE"
            ? new Date()
            : null,

        completedAt:
          null,

        removedAt:
          null,
      });

    // ========================================================
    // NOTIFICATION
    // ========================================================

    try {
      await createNotification({
        user:
          data.contributor,

        type:
          "PROJECT",

        title:
          "New project assigned",

        message:
          `You have been assigned to project "${project.title}".`,

        link:
          `/projects/${data.project}`,

        metadata: {
          projectId:
            data.project,

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

    validateObjectId(
      userId,
      "user ID"
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
      userRole ===
        "SUPER_ADMIN" ||
      userRole ===
        "ADMIN"
    ) {
      return assignment;
    }

    // ========================================================
    // CONTRIBUTOR ACCESS
    // ========================================================

    if (
      userRole ===
      "CONTRIBUTOR"
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
        client:
          mongoose.Types.ObjectId;

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
    validateObjectId(
      userId,
      "user ID"
    );

    const filter: {
      contributor: string;

      status?:
        ProjectAssignmentStatus;
    } = {
      contributor:
        userId,
    };

    if (
      status
    ) {
      filter.status =
        status;
    }

    return ProjectAssignment.find(
      filter
    )
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
    validateObjectId(
      userId,
      "user ID"
    );

    const project =
      await getProjectOrThrow(
        projectId
      );

    // ========================================================
    // CONTRIBUTOR CANNOT VIEW ALL ASSIGNMENTS
    // ========================================================

    if (
      userRole ===
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Contributors cannot view all assignments for a project"
      );
    }

    // ========================================================
    // MANAGEMENT ACCESS
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

      status?:
        ProjectAssignmentStatus;
    } = {
      project:
        projectId,
    };

    if (
      status
    ) {
      filter.status =
        status;
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
// UPDATE ASSIGNMENT
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

    validateObjectId(
      userId,
      "user ID"
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
    // STATUS REQUIRED
    // ========================================================

    if (
      !data.status
    ) {
      throw new ApiError(
        400,
        "Assignment status is required"
      );
    }

    const currentStatus =
      assignment.status;

    const nextStatus =
      data.status;

    // ========================================================
    // CONTRIBUTOR STATUS CONTROL
    // ========================================================

    if (
      userRole ===
      "CONTRIBUTOR"
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

      // ======================================================
      // CONTRIBUTOR CANNOT COMPLETE / REMOVE ASSIGNMENT
      // ======================================================

      if (
        nextStatus ===
          "COMPLETED" ||
        nextStatus ===
          "REMOVED" ||
        nextStatus ===
          "PENDING"
      ) {
        throw new ApiError(
          403,
          "Contributor cannot set this assignment status"
        );
      }

      // ======================================================
      // CONTRIBUTOR CAN ONLY PAUSE / RESUME
      // ======================================================

      if (
        ![
          "ACTIVE",
          "PAUSED",
        ].includes(
          nextStatus
        )
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
      currentStatus !==
        nextStatus &&
      !allowedTransitions[
        currentStatus
      ].includes(
        nextStatus
      )
    ) {
      throw new ApiError(
        400,
        `Cannot change assignment status from ${currentStatus} to ${nextStatus}`
      );
    }

    // ========================================================
    // CONTRIBUTOR EXTRA PROTECTION
    //
    // A contributor cannot pause an assignment that is already
    // completed or removed.
    //
    // The transition map above already blocks it, but this
    // explicit protection keeps the business rule clear.
    // ========================================================

    if (
      userRole ===
        "CONTRIBUTOR" &&
      currentStatus !==
        "ACTIVE" &&
      currentStatus !==
        "PAUSED"
    ) {
      throw new ApiError(
        400,
        "Only active or paused assignments can be changed by a contributor"
      );
    }

    // ========================================================
    // UPDATE STATUS
    // ========================================================

    assignment.status =
      nextStatus;

    // ========================================================
    // UPDATE START DATE
    // ========================================================

    if (
      nextStatus ===
        "ACTIVE" &&
      !assignment.startedAt
    ) {
      assignment.startedAt =
        new Date();
    }

    // ========================================================
    // UPDATE COMPLETION DATE
    // ========================================================

    if (
      nextStatus ===
      "COMPLETED"
    ) {
      assignment.completedAt =
        new Date();
    }

    // ========================================================
    // UPDATE REMOVAL DATE
    // ========================================================

    if (
      nextStatus ===
      "REMOVED"
    ) {
      assignment.removedAt =
        new Date();
    }

    // ========================================================
    // CLEAR REMOVAL DATE WHEN REACTIVATED
    // ========================================================

    if (
      nextStatus ===
        "ACTIVE" &&
      currentStatus ===
        "REMOVED"
    ) {
      assignment.removedAt =
        null;
    }

    // ========================================================
    // SAVE
    // ========================================================

    await assignment.save();

    // ========================================================
    // NOTIFICATION
    // ========================================================

    try {
      if (
        currentStatus !==
        nextStatus
      ) {
        await createNotification({
          user:
            assignment.contributor.toString(),

          type:
            "PROJECT",

          title:
            "Project assignment updated",

          message:
            `Your project assignment status is now ${nextStatus}.`,

          link:
            `/projects/${assignment.project.toString()}`,

          metadata: {
            projectId:
              assignment.project.toString(),

            assignmentId:
              assignment._id.toString(),

            status:
              nextStatus,
          },
        });
      }
    } catch (error) {
      console.error(
        "Project assignment status notification failed:",
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
// REMOVE ASSIGNMENT
// ============================================================
//
// Only management roles can remove an assignment.
//
// Contributor cannot use this method because the status
// protection inside updateProjectAssignment() blocks REMOVED.
//
// ============================================================

export const removeProjectAssignment =
  async (
    assignmentId: string,
    userId: string,
    userRole: UserRole
  ) => {
    if (
      userRole ===
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Contributor cannot remove a project assignment"
      );
    }

    return updateProjectAssignment(
      assignmentId,
      userId,
      userRole,
      {
        status:
          "REMOVED",
      }
    );
  };