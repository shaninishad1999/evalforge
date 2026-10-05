import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// TASK TYPES
// ============================================================

export type TaskStatus =
  | "CREATED"
  | "AVAILABLE"
  | "CLAIMED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION";

export type TaskType =
  | "TEXT_CLASSIFICATION"
  | "TEXT_RANKING"
  | "TEXT_EVALUATION"
  | "TEXT_REWRITE"
  | "IMAGE_CLASSIFICATION"
  | "IMAGE_BOUNDING_BOX"
  | "IMAGE_EVALUATION"
  | "AUDIO_TRANSCRIPTION"
  | "AUDIO_EVALUATION"
  | "VIDEO_EVALUATION"
  | "CODE_REVIEW"
  | "CODE_EVALUATION";

// ============================================================
// TASK DOCUMENT INTERFACE
// ============================================================

export interface ITask extends Document {
  project: mongoose.Types.ObjectId;

  dataset: mongoose.Types.ObjectId;

  datasetItem: mongoose.Types.ObjectId;

  type: TaskType;

  title: string;

  instructions: string;

  prompt: string;

  evaluationCriteria: string[];

  configuration: {
    maxAttempts: number;
    timeLimitMinutes: number | null;
    reviewRequired: boolean;

    // Maximum pause duration allowed for this task.
    // Client decides this value.
    // Minimum allowed value is 1 second.
    maxPauseSeconds: number;
  };

  reward: {
    amount: number;
    currency: string;
  };

  status: TaskStatus;

  claimedBy: mongoose.Types.ObjectId | null;

  claimedAt: Date | null;

  startedAt: Date | null;

  // ==========================================================
  // PAUSE TRACKING
  // ==========================================================

  // Time when the current pause started.
  pauseStartedAt: Date | null;

  // Time when the current pause must automatically expire.
  pauseExpiresAt: Date | null;

  // Total accumulated pause duration for this task.
  totalPausedSeconds: number;

  // Number of times this task has been paused.
  pauseCount: number;

  submittedAt: Date | null;

  reviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// TASK SCHEMA
// ============================================================

const taskSchema = new Schema<ITask>(
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
    // DATASET
    // ========================================================

    dataset: {
      type: Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      index: true,
    },

    // ========================================================
    // DATASET ITEM
    // ========================================================

    datasetItem: {
      type: Schema.Types.ObjectId,
      ref: "DatasetItem",
      required: true,
      index: true,
    },

    // ========================================================
    // TASK TYPE
    // ========================================================

    type: {
      type: String,
      enum: [
        "TEXT_CLASSIFICATION",
        "TEXT_RANKING",
        "TEXT_EVALUATION",
        "TEXT_REWRITE",
        "IMAGE_CLASSIFICATION",
        "IMAGE_BOUNDING_BOX",
        "IMAGE_EVALUATION",
        "AUDIO_TRANSCRIPTION",
        "AUDIO_EVALUATION",
        "VIDEO_EVALUATION",
        "CODE_REVIEW",
        "CODE_EVALUATION",
      ],
      required: true,
      index: true,
    },

    // ========================================================
    // TITLE
    // ========================================================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },

    // ========================================================
    // INSTRUCTIONS
    // ========================================================

    instructions: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 30000,
    },

    // ========================================================
    // PROMPT
    // ========================================================

    prompt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30000,
    },

    // ========================================================
    // EVALUATION CRITERIA
    // ========================================================

    evaluationCriteria: {
      type: [String],
      default: [],
    },

    // ========================================================
    // TASK CONFIGURATION
    // ========================================================

    configuration: {
      maxAttempts: {
        type: Number,
        default: 3,
        min: 1,
      },

      timeLimitMinutes: {
        type: Number,
        default: null,
        min: 1,
      },

      reviewRequired: {
        type: Boolean,
        default: true,
      },

      // ======================================================
      // MAXIMUM PAUSE DURATION
      // ======================================================
      //
      // Client decides the maximum pause duration.
      //
      // Examples:
      // 1     = 1 second
      // 60    = 1 minute
      // 300   = 5 minutes
      // 600   = 10 minutes
      // 1800  = 30 minutes
      //
      // Minimum allowed value = 1 second.
      // ======================================================

      maxPauseSeconds: {
        type: Number,
        required: true,
        default: 600,
        min: 1,
      },
    },

    // ========================================================
    // REWARD
    // ========================================================

    reward: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        default: "INR",
        uppercase: true,
        trim: true,
      },
    },

    // ========================================================
    // TASK STATUS
    // ========================================================

    status: {
      type: String,
      enum: [
        "CREATED",
        "AVAILABLE",
        "CLAIMED",
        "IN_PROGRESS",
        "PAUSED",
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "REVISION",
      ],
      default: "CREATED",
      index: true,
    },

    // ========================================================
    // CLAIMED BY
    // ========================================================

    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ========================================================
    // CLAIMED AT
    // ========================================================

    claimedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // STARTED AT
    // ========================================================

    startedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // PAUSE STARTED AT
    // ========================================================

    pauseStartedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // PAUSE EXPIRES AT
    // ========================================================

    pauseExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ========================================================
    // TOTAL PAUSED SECONDS
    // ========================================================

    totalPausedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // PAUSE COUNT
    // ========================================================

    pauseCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // SUBMITTED AT
    // ========================================================

    submittedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // REVIEWED AT
    // ========================================================

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

taskSchema.index({
  project: 1,
  status: 1,
});

taskSchema.index({
  dataset: 1,
  status: 1,
});

taskSchema.index({
  claimedBy: 1,
  status: 1,
});

taskSchema.index({
  type: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const Task = mongoose.model<ITask>(
  "Task",
  taskSchema
);

export default Task;