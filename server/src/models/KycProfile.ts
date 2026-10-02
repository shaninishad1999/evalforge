import mongoose, { Document, Schema } from "mongoose";

export type KycVerificationStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED"
  | "LOCKED";

export type OcrStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface IKycProfile extends Document {
  userId: mongoose.Types.ObjectId;

  // PAN Details
  panNumber: string;
  panName: string;
  dateOfBirth: Date | null;
  panDocumentUrl: string;

  // OCR Extracted Data
  ocrData: {
    panNumber: string;
    name: string;
    dateOfBirth: string;
    confidence: number;
  };

  ocrStatus: OcrStatus;

  // Address Details
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;

  // Verification
  verificationStatus: KycVerificationStatus;
  verificationAttempts: number;
  maxVerificationAttempts: number;

  rejectionReason: string;

  submittedAt: Date | null;
  verifiedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const kycProfileSchema = new Schema<IKycProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // =========================
    // PAN DETAILS
    // =========================

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    panName: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    panDocumentUrl: {
      type: String,
      default: "",
    },

    // =========================
    // OCR DATA
    // =========================

    ocrData: {
      panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },

      name: {
        type: String,
        trim: true,
        default: "",
      },

      dateOfBirth: {
        type: String,
        trim: true,
        default: "",
      },

      confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    ocrStatus: {
      type: String,
      enum: [
        "NOT_STARTED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "NOT_STARTED",
    },

    // =========================
    // ADDRESS DETAILS
    // =========================

    addressLine1: {
      type: String,
      trim: true,
      default: "",
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    district: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },

    // =========================
    // VERIFICATION
    // =========================

    verificationStatus: {
      type: String,
      enum: [
        "NOT_STARTED",
        "PROCESSING",
        "APPROVED",
        "REJECTED",
        "LOCKED",
      ],
      default: "NOT_STARTED",
      index: true,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },

    maxVerificationAttempts: {
      type: Number,
      default: 3,
      min: 1,
      max: 3,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const KycProfile = mongoose.model<IKycProfile>(
  "KycProfile",
  kycProfileSchema
);

export default KycProfile;