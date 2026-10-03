import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// QUALIFICATION TYPES
// ============================================================

export type QualificationStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACTIVE"
  | "PAUSED"
  | "ARCHIVED";

export type QualificationDifficulty =
  | "EASY"
  | "MEDIUM"
  | "HARD";

export type QualificationQuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "TEXT_ANSWER";

export type QualificationQuestionCategory =
  | "ACCURACY"
  | "RELEVANCE"
  | "LANGUAGE"
  | "REASONING"
  | "SAFETY"
  | "INSTRUCTION_FOLLOWING"
  | "DOMAIN_KNOWLEDGE";

// ============================================================
// OPTION INTERFACE
// ============================================================

export interface IQualificationOption {
  label: string;
  text: string;
}

// ============================================================
// QUESTION INTERFACE
// ============================================================

export interface IQualificationQuestion {
  _id?: mongoose.Types.ObjectId;

  question: string;

  type: QualificationQuestionType;

  category: QualificationQuestionCategory;

  difficulty: QualificationDifficulty;

  options: IQualificationOption[];

  correctAnswer: string | string[];

  referenceAnswer?: string | null;

  keywords: string[];

  points: number;

  attemptsAllowed: number;

  order: number;

  isActive: boolean;
}

// ============================================================
// LEARNING MATERIAL INTERFACE
// ============================================================

export interface IQualificationLearningSection {
  title: string;
  content: string;
  order: number;
}

export interface IQualificationLearningMaterial {
  title: string;
  content: string;
  sections: IQualificationLearningSection[];
}

// ============================================================
// ELIGIBILITY INTERFACE
// ============================================================

export interface IQualificationEligibility {
  skills: string[];

  languages: string[];

  minimumExperience: number;

  maximumExperience: number | null;

  countries: string[];

  requirements: string[];
}

// ============================================================
// ASSESSMENT INTERFACE
// ============================================================

export interface IQualificationAssessment {
  durationMinutes: number;

  maxAttempts: number;

  questionCount: number;

  randomizeQuestions: boolean;

  randomizeOptions: boolean;

  allowBackNavigation: boolean;

  autoSubmit: boolean;
}

// ============================================================
// SCORING INTERFACE
// ============================================================

export interface IQualificationScoring {
  passingScore: number;

  autoEvaluation: boolean;

  humanReviewRequired: boolean;
}

// ============================================================
// QUALIFICATION INTERFACE
// ============================================================

export interface IQualification
  extends Document {

  title: string;

  description: string;

  instructions: string;

  project:
    | mongoose.Types.ObjectId
    | null;

  createdBy: mongoose.Types.ObjectId;

  learningMaterial:
    IQualificationLearningMaterial;

  eligibility:
    IQualificationEligibility;

  assessment:
    IQualificationAssessment;

  scoring:
    IQualificationScoring;

  questions:
    IQualificationQuestion[];

  status:
    QualificationStatus;

  publishedAt: Date | null;

  activatedAt: Date | null;

  pausedAt: Date | null;

  archivedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// OPTION SCHEMA
// ============================================================

const qualificationOptionSchema =
  new Schema<IQualificationOption>(
    {
      label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10,
      },

      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },
    },
    {
      _id: false,
    }
  );

// ============================================================
// QUESTION SCHEMA
// ============================================================

const qualificationQuestionSchema =
  new Schema<IQualificationQuestion>(
    {
      question: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 10000,
      },

      type: {
        type: String,
        enum: [
          "SINGLE_CHOICE",
          "MULTIPLE_CHOICE",
          "TRUE_FALSE",
          "TEXT_ANSWER",
        ],
        required: true,
      },

      category: {
        type: String,
        enum: [
          "ACCURACY",
          "RELEVANCE",
          "LANGUAGE",
          "REASONING",
          "SAFETY",
          "INSTRUCTION_FOLLOWING",
          "DOMAIN_KNOWLEDGE",
        ],
        required: true,
      },

      difficulty: {
        type: String,
        enum: [
          "EASY",
          "MEDIUM",
          "HARD",
        ],
        default: "MEDIUM",
      },

      options: {
        type: [qualificationOptionSchema],
        default: [],
      },

      // ========================================================
      // CORRECT ANSWER
      //
      // SINGLE_CHOICE / TRUE_FALSE:
      // string
      //
      // MULTIPLE_CHOICE:
      // string[]
      //
      // TEXT_ANSWER:
      // referenceAnswer / keywords can also be used.
      // ========================================================

      correctAnswer: {
        type: Schema.Types.Mixed,
        required: true,
      },

      referenceAnswer: {
        type: String,
        default: null,
        trim: true,
        maxlength: 10000,
      },

      keywords: {
        type: [String],
        default: [],
      },

      points: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },

      // ========================================================
      // EACH QUESTION CAN HAVE ITS OWN ATTEMPT LIMIT
      // ========================================================

      attemptsAllowed: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 1,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      _id: true,
    }
  );

// ============================================================
// QUALIFICATION SCHEMA
// ============================================================

const qualificationSchema =
  new Schema<IQualification>(
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

      instructions: {
        type: String,
        default: "",
        trim: true,
        maxlength: 30000,
      },

      // ========================================================
      // PROJECT
      // ========================================================

      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        default: null,
        index: true,
      },

      // ========================================================
      // CREATOR
      // ========================================================

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // ========================================================
      // THEORY / LEARNING MATERIAL
      // ========================================================

      learningMaterial: {
        title: {
          type: String,
          default: "",
          trim: true,
          maxlength: 200,
        },

        content: {
          type: String,
          default: "",
          trim: true,
          maxlength: 100000,
        },

        sections: {
          type: [
            {
              title: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200,
              },

              content: {
                type: String,
                required: true,
                trim: true,
                maxlength: 30000,
              },

              order: {
                type: Number,
                required: true,
                min: 1,
              },
            },
          ],
          default: [],
        },
      },

      // ========================================================
      // ELIGIBILITY
      // ========================================================

      eligibility: {
        skills: {
          type: [String],
          default: [],
        },

        languages: {
          type: [String],
          default: [],
        },

        minimumExperience: {
          type: Number,
          default: 0,
          min: 0,
        },

        maximumExperience: {
          type: Number,
          default: null,
          min: 0,
        },

        countries: {
          type: [String],
          default: [],
        },

        requirements: {
          type: [String],
          default: [],
        },
      },

      // ========================================================
      // ASSESSMENT CONFIGURATION
      //
      // durationMinutes is the displayed/reference duration.
      //
      // It is NOT a hard expiration deadline.
      //
      // Contributor can:
      //
      // Start
      //   ↓
      // Work
      //   ↓
      // Pause
      //   ↓
      // Leave
      //   ↓
      // Return later
      //   ↓
      // Resume
      //
      // Actual active time is tracked in
      // QualificationAttempt.
      // ========================================================

      assessment: {
        durationMinutes: {
          type: Number,
          required: true,
          min: 1,
          default: 30,
        },

        maxAttempts: {
          type: Number,
          required: true,
          min: 1,
          max: 20,
          default: 3,
        },

        questionCount: {
          type: Number,
          required: true,
          min: 1,
          default: 10,
        },

        randomizeQuestions: {
          type: Boolean,
          default: true,
        },

        randomizeOptions: {
          type: Boolean,
          default: true,
        },

        allowBackNavigation: {
          type: Boolean,
          default: true,
        },

        autoSubmit: {
          type: Boolean,
          default: false,
        },
      },

      // ========================================================
      // SCORING
      // ========================================================

      scoring: {
        passingScore: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
          default: 80,
        },

        autoEvaluation: {
          type: Boolean,
          default: true,
        },

        // Qualification is automatically evaluated.
        // Human review is intentionally disabled.
        humanReviewRequired: {
          type: Boolean,
          default: false,
        },
      },

      // ========================================================
      // QUESTIONS
      // ========================================================

      questions: {
        type: [qualificationQuestionSchema],
        default: [],
      },

      // ========================================================
      // STATUS
      // ========================================================

      status: {
        type: String,
        enum: [
          "DRAFT",
          "PUBLISHED",
          "ACTIVE",
          "PAUSED",
          "ARCHIVED",
        ],
        default: "DRAFT",
        index: true,
      },

      publishedAt: {
        type: Date,
        default: null,
      },

      activatedAt: {
        type: Date,
        default: null,
      },

      pausedAt: {
        type: Date,
        default: null,
      },

      archivedAt: {
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

qualificationSchema.index({
  project: 1,
  status: 1,
});


// ============================================================
// MODEL
// ============================================================

const Qualification =
  mongoose.model<IQualification>(
    "Qualification",
    qualificationSchema
  );

export default Qualification;