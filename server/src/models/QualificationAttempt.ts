import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// ATTEMPT TYPES
// ============================================================

export type QualificationAttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "SUBMITTED"
  | "PASSED"
  | "FAILED";

export type QualificationAnswerStatus =
  | "UNANSWERED"
  | "ANSWERED"
  | "CORRECT"
  | "INCORRECT";

// ============================================================
// ANSWER INTERFACE
// ============================================================

export interface IQualificationAnswer {
  questionId: mongoose.Types.ObjectId;

  answer: string | string[] | null;

  attemptsUsed: number;

  attemptsAllowed: number;

  status: QualificationAnswerStatus;

  pointsAwarded: number;

  maxPoints: number;

  answeredAt: Date | null;

  lastAttemptAt: Date | null;
}

// ============================================================
// ATTEMPT INTERFACE
// ============================================================

export interface IQualificationAttempt
  extends Document {

  user: mongoose.Types.ObjectId;

  qualification: mongoose.Types.ObjectId;

  project: mongoose.Types.ObjectId | null;

  attemptNumber: number;

  status: QualificationAttemptStatus;

  questionIds: mongoose.Types.ObjectId[];

  answers: IQualificationAnswer[];

  totalQuestions: number;

  answeredQuestions: number;

  correctQuestions: number;

  incorrectQuestions: number;

  totalPoints: number;

  obtainedPoints: number;

  percentage: number;

  passingScore: number;

  result:
    | "PENDING"
    | "PASS"
    | "FAIL";

  totalActiveTimeSeconds: number;

  pauseCount: number;

  startedAt: Date | null;

  lastResumedAt: Date | null;

  lastPausedAt: Date | null;

  submittedAt: Date | null;

  projectAssigned: boolean;

  projectAssignedAt: Date | null;

  projectAssignmentId:
    | mongoose.Types.ObjectId
    | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// ANSWER SCHEMA
// ============================================================

const qualificationAnswerSchema =
  new Schema<IQualificationAnswer>(
    {
      questionId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      answer: {
        type: Schema.Types.Mixed,
        default: null,
      },

      attemptsUsed: {
        type: Number,
        default: 0,
        min: 0,
      },

      attemptsAllowed: {
        type: Number,
        required: true,
        min: 1,
      },

      status: {
        type: String,
        enum: [
          "UNANSWERED",
          "ANSWERED",
          "CORRECT",
          "INCORRECT",
        ],
        default: "UNANSWERED",
      },

      pointsAwarded: {
        type: Number,
        default: 0,
        min: 0,
      },

      maxPoints: {
        type: Number,
        required: true,
        min: 0,
      },

      answeredAt: {
        type: Date,
        default: null,
      },

      lastAttemptAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

// ============================================================
// ATTEMPT SCHEMA
// ============================================================

const qualificationAttemptSchema =
  new Schema<IQualificationAttempt>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      qualification: {
        type: Schema.Types.ObjectId,
        ref: "Qualification",
        required: true,
        index: true,
      },

      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        default: null,
        index: true,
      },

      attemptNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      status: {
        type: String,
        enum: [
          "NOT_STARTED",
          "IN_PROGRESS",
          "PAUSED",
          "SUBMITTED",
          "PASSED",
          "FAILED",
        ],
        default: "NOT_STARTED",
        index: true,
      },

      questionIds: {
        type: [
          {
            type: Schema.Types.ObjectId,
          },
        ],
        default: [],
      },

      answers: {
        type: [qualificationAnswerSchema],
        default: [],
      },

      totalQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      answeredQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      correctQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      incorrectQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalPoints: {
        type: Number,
        default: 0,
        min: 0,
      },

      obtainedPoints: {
        type: Number,
        default: 0,
        min: 0,
      },

      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      passingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 80,
      },

      result: {
        type: String,
        enum: [
          "PENDING",
          "PASS",
          "FAIL",
        ],
        default: "PENDING",
      },

      // ========================================================
      // PAUSE / RESUME TRACKING
      // ========================================================

      totalActiveTimeSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },

      pauseCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      lastResumedAt: {
        type: Date,
        default: null,
      },

      lastPausedAt: {
        type: Date,
        default: null,
      },

      submittedAt: {
        type: Date,
        default: null,
      },

      // ========================================================
      // PROJECT ASSIGNMENT
      // ========================================================

      projectAssigned: {
        type: Boolean,
        default: false,
      },

      projectAssignedAt: {
        type: Date,
        default: null,
      },

      projectAssignmentId: {
        type: Schema.Types.ObjectId,
        ref: "ProjectAssignment",
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

qualificationAttemptSchema.index({
  user: 1,
  qualification: 1,
});

qualificationAttemptSchema.index({
  project: 1,
  user: 1,
});

qualificationAttemptSchema.index({
  user: 1,
  qualification: 1,
  attemptNumber: -1,
});



// ============================================================
// MODEL
// ============================================================

const QualificationAttempt =
  mongoose.model<IQualificationAttempt>(
    "QualificationAttempt",
    qualificationAttemptSchema
  );

export default QualificationAttempt;