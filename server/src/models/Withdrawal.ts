import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// WITHDRAWAL TYPES
// ============================================================

export type WithdrawalStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type WithdrawalMethod =
  | "BANK_TRANSFER"
  | "UPI"
  | "PAYPAL"
  | "AIRTm";

// ============================================================
// WITHDRAWAL DOCUMENT INTERFACE
// ============================================================

export interface IWithdrawal
  extends Document {
  contributor: mongoose.Types.ObjectId;

  wallet: mongoose.Types.ObjectId;

  amount: number;

  currency: string;

  method: WithdrawalMethod;

  paymentDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    paypalEmail: string;
  };

  status: WithdrawalStatus;

  transactionId: string | null;

  failureReason: string;

  processedBy:
    | mongoose.Types.ObjectId
    | null;

  requestedAt: Date;

  processedAt: Date | null;

  paidAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// WITHDRAWAL SCHEMA
// ============================================================

const withdrawalSchema =
  new Schema<IWithdrawal>(
    {
      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      wallet: {
        type: Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 1,
      },

      currency: {
        type: String,
        default: "INR",
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 10,
      },

      method: {
        type: String,
        enum: [
          "BANK_TRANSFER",
          "UPI",
          "PAYPAL",
          "AIRTm",
        ],
        required: true,
        index: true,
      },

      paymentDetails: {
        accountHolderName: {
          type: String,
          default: "",
          trim: true,
          maxlength: 200,
        },

        accountNumber: {
          type: String,
          default: "",
          trim: true,
          maxlength: 100,
        },

        ifscCode: {
          type: String,
          default: "",
          trim: true,
          uppercase: true,
          maxlength: 20,
        },

        upiId: {
          type: String,
          default: "",
          trim: true,
          maxlength: 200,
        },

        paypalEmail: {
          type: String,
          default: "",
          trim: true,
          lowercase: true,
          maxlength: 320,
        },
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "PROCESSING",
          "PAID",
          "FAILED",
          "CANCELLED",
        ],
        default: "PENDING",
        index: true,
      },

      transactionId: {
        type: String,
        default: null,
        trim: true,
        maxlength: 300,
      },

      failureReason: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
      },

      processedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      requestedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      processedAt: {
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

withdrawalSchema.index({
  contributor: 1,
  status: 1,
});

withdrawalSchema.index({
  wallet: 1,
  status: 1,
});

withdrawalSchema.index({
  status: 1,
  requestedAt: -1,
});

withdrawalSchema.index({
  processedBy: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const Withdrawal =
  mongoose.model<IWithdrawal>(
    "Withdrawal",
    withdrawalSchema
  );

export default Withdrawal;