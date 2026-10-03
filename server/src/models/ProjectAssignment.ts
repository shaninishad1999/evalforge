import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// PROJECT ASSIGNMENT TYPES
// ============================================================

export type ProjectAssignmentStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "REMOVED";

// ============================================================
// PROJECT ASSIGNMENT INTERFACE
// ============================================================

export interface IProjectAssignment
  extends Document {

  project: mongoose.Types.ObjectId;

  contributor: mongoose.Types.ObjectId;

  qualification:
    | mongoose.Types.ObjectId
    | null;

  qualificationAttempt:
    | mongoose.Types.ObjectId
    | null;

  assignedBy:
    | mongoose.Types.ObjectId
    | null;

  assignedAt: Date;

  startedAt: Date | null;

  completedAt: Date | null;

  removedAt: Date | null;

  status: ProjectAssignmentStatus;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// PROJECT ASSIGNMENT SCHEMA
// ============================================================

const projectAssignmentSchema =
  new Schema<IProjectAssignment>(
    {
      // ========================================================
      // PROJECT
      // ========================================================

      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },

      // ========================================================
      // CONTRIBUTOR
      // ========================================================

      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // ========================================================
      // QUALIFICATION
      // ========================================================

      qualification: {
        type: Schema.Types.ObjectId,
        ref: "Qualification",
        default: null,
      },

      // ========================================================
      // QUALIFICATION ATTEMPT
      // ========================================================

      qualificationAttempt: {
        type: Schema.Types.ObjectId,
        ref: "QualificationAttempt",
        default: null,
      },

      // ========================================================
      // ASSIGNED BY
      //
      // Null means automatic assignment through qualification.
      // ========================================================

      assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      // ========================================================
      // DATES
      // ========================================================

      assignedAt: {
        type: Date,
        default: Date.now,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      removedAt: {
        type: Date,
        default: null,
      },

      // ========================================================
      // STATUS
      // ========================================================

      status: {
        type: String,
        enum: [
          "PENDING",
          "ACTIVE",
          "PAUSED",
          "COMPLETED",
          "REMOVED",
        ],
        default: "ACTIVE",
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================================
// INDEXES
// ============================================================

// One contributor should not receive duplicate active
// assignments for the same project.

projectAssignmentSchema.index(
  {
    project: 1,
    contributor: 1,
  },
  {
    unique: true,
  }
);

projectAssignmentSchema.index({
  contributor: 1,
  status: 1,
});

projectAssignmentSchema.index({
  project: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const ProjectAssignment =
  mongoose.model<IProjectAssignment>(
    "ProjectAssignment",
    projectAssignmentSchema
  );

export default ProjectAssignment;