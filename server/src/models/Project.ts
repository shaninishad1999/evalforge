import mongoose, { Document, Schema } from "mongoose";

// ============================================================
// PROJECT TYPES
// ============================================================

export type ProjectStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type RewardType = "PER_TASK" | "PER_HOUR" | "FIXED";

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
// PROJECT DOCUMENT INTERFACE
// ============================================================

export interface IProject extends Document {
  title: string;
  description: string;

  client: mongoose.Types.ObjectId;
  projectManager: mongoose.Types.ObjectId | null;

  requirements: {
    skills: string[];
    languages: string[];
    minExperience: number;
    maxExperience: number | null;
    eligibility: string[];
  };

  guidelines: {
    instructions: string;
    qualityRules: string[];
  };

  taskConfiguration: {
    taskTypes: TaskType[];
    reviewRequired: boolean;
  };

  rewardConfiguration: {
    rewardType: RewardType;
    rewardAmount: number;
    currency: string;
  };

  qualification: {
    required: boolean;
    qualificationId: mongoose.Types.ObjectId | null;
    passingScore: number;
  };

  status: ProjectStatus;

  startDate: Date | null;
  endDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PROJECT SCHEMA
// ============================================================

const projectSchema = new Schema<IProject>(
  {
    // ========================================================
    // BASIC INFORMATION
    // ========================================================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 10000,
    },

    // ========================================================
    // PROJECT OWNERSHIP
    // ========================================================

    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    projectManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ========================================================
    // PROJECT REQUIREMENTS
    // ========================================================

    requirements: {
      skills: {
        type: [String],
        default: [],
      },

      languages: {
        type: [String],
        default: [],
      },

      minExperience: {
        type: Number,
        default: 0,
        min: 0,
      },

      maxExperience: {
        type: Number,
        default: null,
        min: 0,
      },

      eligibility: {
        type: [String],
        default: [],
      },
    },

    // ========================================================
    // PROJECT GUIDELINES
    // ========================================================

    guidelines: {
      instructions: {
        type: String,
        default: "",
        maxlength: 30000,
      },

      qualityRules: {
        type: [String],
        default: [],
      },
    },

    // ========================================================
    // TASK CONFIGURATION
    // ========================================================

    taskConfiguration: {
      taskTypes: {
        type: [String],
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
        default: [],
      },

      reviewRequired: {
        type: Boolean,
        default: true,
      },
    },

    // ========================================================
    // REWARD CONFIGURATION
    // ========================================================

    rewardConfiguration: {
      rewardType: {
        type: String,
        enum: ["PER_TASK", "PER_HOUR", "FIXED"],
        default: "PER_TASK",
      },

      rewardAmount: {
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
    // QUALIFICATION REQUIREMENT
    // ========================================================

    qualification: {
      required: {
        type: Boolean,
        default: false,
      },

      qualificationId: {
        type: Schema.Types.ObjectId,
        ref: "Qualification",
        default: null,
      },

      passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100,
      },
    },

    // ========================================================
    // PROJECT STATUS
    // ========================================================

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PUBLISHED",
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
        "ARCHIVED",
      ],
      default: "DRAFT",
      index: true,
    },

    // ========================================================
    // PROJECT DATES
    // ========================================================

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
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

projectSchema.index({
  client: 1,
  status: 1,
});

projectSchema.index({
  projectManager: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const Project = mongoose.model<IProject>(
  "Project",
  projectSchema
);

export default Project;