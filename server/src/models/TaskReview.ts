import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// TASK REVIEW TYPES
// ============================================================

export type TaskReviewDecision =
  | "APPROVED"
  | "REJECTED"
  | "REVISION";

export type TaskReviewStatus =
  | "PENDING"
  | "COMPLETED";

// ============================================================
// TASK REVIEW DOCUMENT INTERFACE
// ============================================================

export interface ITaskReview
  extends Document {
  task: mongoose.Types.ObjectId;
  submission: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  contributor: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;

  decision: TaskReviewDecision;

  score: number | null;

  feedback: string;

  criteria: Array<{
    criterion: string;
    score: number;
    feedback: string;
  }>;

  status: TaskReviewStatus;

  reviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// TASK REVIEW SCHEMA
// ============================================================

const taskReviewSchema =
  new Schema<ITaskReview>(
    {
      task: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        required: true,
        index: true,
      },

      submission: {
        type: Schema.Types.ObjectId,
        ref: "TaskSubmission",
        required: true,
        index: true,
      },

      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },

      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      reviewer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      decision: {
        type: String,
        enum: [
          "APPROVED",
          "REJECTED",
          "REVISION",
        ],
        required: true,
        index: true,
      },

      score: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },

      feedback: {
        type: String,
        default: "",
        maxlength: 10000,
      },

      criteria: {
        type: [
          {
            criterion: {
              type: String,
              required: true,
              trim: true,
            },

            score: {
              type: Number,
              required: true,
              min: 0,
              max: 100,
            },

            feedback: {
              type: String,
              default: "",
              maxlength: 10000,
            },
          },
        ],
        default: [],
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "COMPLETED",
        ],
        default: "COMPLETED",
        index: true,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================================
// INDEXES
// ============================================================

taskReviewSchema.index({
  task: 1,
  createdAt: -1,
});

taskReviewSchema.index({
  submission: 1,
  createdAt: -1,
});

taskReviewSchema.index({
  reviewer: 1,
  status: 1,
});

taskReviewSchema.index({
  contributor: 1,
  decision: 1,
});

taskReviewSchema.index({
  project: 1,
  decision: 1,
});

// ============================================================
// MODEL
// ============================================================

const TaskReview =
  mongoose.model<ITaskReview>(
    "TaskReview",
    taskReviewSchema
  );

export default TaskReview;