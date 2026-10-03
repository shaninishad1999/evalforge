import mongoose, { Document, Schema } from "mongoose";

export type FaceVerificationStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "PASSED"
  | "FAILED"
  | "LOCKED";

export type LivenessStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "PASSED"
  | "FAILED";

export type FaceMatchStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "MATCHED"
  | "NOT_MATCHED"
  | "FAILED";

export interface IFaceVerification extends Document {
  userId: mongoose.Types.ObjectId;

  selfieUrl: string;

  livenessStatus: LivenessStatus;
  verificationStatus: FaceVerificationStatus;

  challenges: {
    lookLeft: boolean;
    lookRight: boolean;
    lookCenter: boolean;
    blink: boolean;
  };

  livenessScore: number;

  // ============================================================
  // FACE MATCHING
  // ============================================================

  matchStatus: FaceMatchStatus;

  matchScore: number;

  matchThreshold: number;

  faceMatchAttempts: number;

  maxFaceMatchAttempts: number;

  matchedAt: Date | null;

  // ============================================================
  // VERIFICATION ATTEMPTS
  // ============================================================

  attempts: number;
  maxAttempts: number;

  rejectionReason: string;

  startedAt: Date | null;
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const faceVerificationSchema =
  new Schema<IFaceVerification>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      selfieUrl: {
        type: String,
        default: "",
      },

      livenessStatus: {
        type: String,
        enum: [
          "NOT_STARTED",
          "PROCESSING",
          "PASSED",
          "FAILED",
        ],
        default: "NOT_STARTED",
      },

      verificationStatus: {
        type: String,
        enum: [
          "NOT_STARTED",
          "PROCESSING",
          "PASSED",
          "FAILED",
          "LOCKED",
        ],
        default: "NOT_STARTED",
        index: true,
      },

      challenges: {
        lookLeft: {
          type: Boolean,
          default: false,
        },

        lookRight: {
          type: Boolean,
          default: false,
        },

        lookCenter: {
          type: Boolean,
          default: false,
        },

        blink: {
          type: Boolean,
          default: false,
        },
      },

      livenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      // ============================================================
      // FACE MATCHING
      // ============================================================

      matchStatus: {
        type: String,
        enum: [
          "NOT_STARTED",
          "PROCESSING",
          "MATCHED",
          "NOT_MATCHED",
          "FAILED",
        ],
        default: "NOT_STARTED",
        index: true,
      },

      matchScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      matchThreshold: {
        type: Number,
        default: 60,
        min: 0,
        max: 100,
      },

      faceMatchAttempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      maxFaceMatchAttempts: {
        type: Number,
        default: 3,
        min: 1,
        max: 5,
      },

      matchedAt: {
        type: Date,
        default: null,
      },

      // ============================================================
      // VERIFICATION ATTEMPTS
      // ============================================================

      attempts: {
        type: Number,
        default: 0,
        min: 0,
      },

      maxAttempts: {
        type: Number,
        default: 3,
        min: 1,
        max: 5,
      },

      rejectionReason: {
        type: String,
        default: "",
        trim: true,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

const FaceVerification =
  mongoose.model<IFaceVerification>(
    "FaceVerification",
    faceVerificationSchema
  );

export default FaceVerification;