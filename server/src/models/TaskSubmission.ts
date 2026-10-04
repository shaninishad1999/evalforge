import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// TASK SUBMISSION TYPES
// ============================================================

export type TaskSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION";

// ============================================================
// TASK SUBMISSION DOCUMENT INTERFACE
// ============================================================

export interface ITaskSubmission
  extends Document {
  task: mongoose.Types.ObjectId;

  project: mongoose.Types.ObjectId;

  dataset: mongoose.Types.ObjectId;

  datasetItem: mongoose.Types.ObjectId;

  contributor: mongoose.Types.ObjectId;

  attemptNumber: number;

  response: {
    answer: string;

    selectedLabel: string;

    ranking: string[];

    rewrittenText: string;

    transcription: string;

    code: string;

    boundingBoxes: Array<{
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;

    evaluation: {
      score: number | null;
      criteria: Array<{
        criterion: string;
        score: number;
        feedback: string;
      }>;
    };
  };

  feedback: string;

  status: TaskSubmissionStatus;

  submittedAt: Date | null;

  reviewedAt: Date | null;

  revisionRequestedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// TASK SUBMISSION SCHEMA
// ============================================================

const taskSubmissionSchema =
  new Schema<ITaskSubmission>(
    {
      // ========================================================
      // TASK
      // ========================================================

      task: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        required: true,
        index: true,
      },

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
      // CONTRIBUTOR
      // ========================================================

      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // ========================================================
      // ATTEMPT NUMBER
      // ========================================================

      attemptNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      // ========================================================
      // RESPONSE
      // ========================================================

      response: {
        // ======================================================
        // GENERAL ANSWER
        // ======================================================

        answer: {
          type: String,
          default: "",
        },

        // ======================================================
        // CLASSIFICATION
        // ======================================================

        selectedLabel: {
          type: String,
          default: "",
        },

        // ======================================================
        // RANKING
        // ======================================================

        ranking: {
          type: [String],
          default: [],
        },

        // ======================================================
        // TEXT REWRITE
        // ======================================================

        rewrittenText: {
          type: String,
          default: "",
        },

        // ======================================================
        // AUDIO TRANSCRIPTION
        // ======================================================

        transcription: {
          type: String,
          default: "",
        },

        // ======================================================
        // CODE
        // ======================================================

        code: {
          type: String,
          default: "",
        },

        // ======================================================
        // IMAGE BOUNDING BOX
        // ======================================================

        boundingBoxes: {
          type: [
            {
              label: {
                type: String,
                default: "",
              },

              x: {
                type: Number,
                min: 0,
              },

              y: {
                type: Number,
                min: 0,
              },

              width: {
                type: Number,
                min: 0,
              },

              height: {
                type: Number,
                min: 0,
              },
            },
          ],
          default: [],
        },

        // ======================================================
        // EVALUATION
        // ======================================================

        evaluation: {
          score: {
            type: Number,
            default: null,
            min: 0,
            max: 100,
          },

          criteria: {
            type: [
              {
                criterion: {
                  type: String,
                  required: true,
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
                },
              },
            ],
            default: [],
          },
        },
      },

      // ========================================================
      // CONTRIBUTOR FEEDBACK
      // ========================================================

      feedback: {
        type: String,
        default: "",
        maxlength: 10000,
      },

      // ========================================================
      // SUBMISSION STATUS
      // ========================================================

      status: {
        type: String,
        enum: [
          "DRAFT",
          "SUBMITTED",
          "UNDER_REVIEW",
          "APPROVED",
          "REJECTED",
          "REVISION",
        ],
        default: "DRAFT",
        index: true,
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

      // ========================================================
      // REVISION REQUESTED AT
      // ========================================================

      revisionRequestedAt: {
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

taskSubmissionSchema.index({
  task: 1,
  contributor: 1,
});

taskSubmissionSchema.index({
  contributor: 1,
  status: 1,
});

taskSubmissionSchema.index({
  project: 1,
  status: 1,
});

taskSubmissionSchema.index({
  task: 1,
  attemptNumber: 1,
});

// ============================================================
// MODEL
// ============================================================

const TaskSubmission =
  mongoose.model<ITaskSubmission>(
    "TaskSubmission",
    taskSubmissionSchema
  );

export default TaskSubmission;