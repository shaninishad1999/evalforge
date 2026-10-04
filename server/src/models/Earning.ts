import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// EARNING TYPES
// ============================================================

export type EarningStatus =
  | "PENDING"
  | "AVAILABLE"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type EarningSource =
  | "TASK"
  | "BONUS"
  | "ADJUSTMENT";

// ============================================================
// EARNING DOCUMENT INTERFACE
// ============================================================

export interface IEarning
  extends Document {
  contributor: mongoose.Types.ObjectId;

  task: mongoose.Types.ObjectId | null;

  submission:
    | mongoose.Types.ObjectId
    | null;

  project: mongoose.Types.ObjectId;

  source: EarningSource;

  amount: number;

  currency: string;

  status: EarningStatus;

  description: string;

  availableAt: Date | null;

  paidAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// EARNING SCHEMA
// ============================================================

const earningSchema =
  new Schema<IEarning>(
    {
      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      task: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        default: null,
      },

      submission: {
        type: Schema.Types.ObjectId,
        ref: "TaskSubmission",
        default: null,
      },

      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },

      source: {
        type: String,
        enum: [
          "TASK",
          "BONUS",
          "ADJUSTMENT",
        ],
        default: "TASK",
        index: true,
      },

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
        minlength: 3,
        maxlength: 10,
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "AVAILABLE",
          "PROCESSING",
          "PAID",
          "FAILED",
          "CANCELLED",
        ],
        default: "PENDING",
        index: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      availableAt: {
        type: Date,
        default: null,
      },

      paidAt: {
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

earningSchema.index({
  contributor: 1,
  status: 1,
});

earningSchema.index({
  contributor: 1,
  createdAt: -1,
});

earningSchema.index({
  project: 1,
  status: 1,
});

earningSchema.index({
  task: 1,
});

earningSchema.index({
  submission: 1,
});

// ============================================================
// MODEL
// ============================================================

const Earning =
  mongoose.model<IEarning>(
    "Earning",
    earningSchema
  );

export default Earning;