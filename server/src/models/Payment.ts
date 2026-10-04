import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// PAYMENT TYPES
// ============================================================

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentProvider =
  | "RAZORPAY"
  | "BANK_TRANSFER"
  | "UPI"
  | "PAYPAL"
  | "AIRTm"
  | "MANUAL";

export type PaymentType =
  | "WITHDRAWAL"
  | "REFUND"
  | "ADJUSTMENT";

// ============================================================
// PAYMENT DOCUMENT INTERFACE
// ============================================================

export interface IPayment
  extends Document {
  contributor:
    | mongoose.Types.ObjectId
    | null;

  withdrawal:
    | mongoose.Types.ObjectId
    | null;

  wallet:
    | mongoose.Types.ObjectId
    | null;

  type: PaymentType;

  provider: PaymentProvider;

  amount: number;

  currency: string;

  status: PaymentStatus;

  transactionId: string | null;

  providerPaymentId: string | null;

  providerOrderId: string | null;

  providerResponse: Record<
    string,
    unknown
  >;

  failureReason: string;

  processedBy:
    | mongoose.Types.ObjectId
    | null;

  initiatedAt: Date;

  processedAt: Date | null;

  completedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// PAYMENT SCHEMA
// ============================================================

const paymentSchema =
  new Schema<IPayment>(
    {
      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      withdrawal: {
        type: Schema.Types.ObjectId,
        ref: "Withdrawal",
        default: null,
        index: true,
      },

      wallet: {
        type: Schema.Types.ObjectId,
        ref: "Wallet",
        default: null,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "WITHDRAWAL",
          "REFUND",
          "ADJUSTMENT",
        ],
        required: true,
        index: true,
      },

      provider: {
        type: String,
        enum: [
          "RAZORPAY",
          "BANK_TRANSFER",
          "UPI",
          "PAYPAL",
          "AIRTm",
          "MANUAL",
        ],
        required: true,
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
          "PROCESSING",
          "SUCCESS",
          "FAILED",
          "REFUNDED",
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
        index: true,
      },

      providerPaymentId: {
        type: String,
        default: null,
        trim: true,
        maxlength: 300,
        index: true,
      },

      providerOrderId: {
        type: String,
        default: null,
        trim: true,
        maxlength: 300,
        index: true,
      },

      providerResponse: {
        type: Schema.Types.Mixed,
        default: {},
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

      initiatedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      processedAt: {
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

// ============================================================
// INDEXES
// ============================================================

paymentSchema.index({
  contributor: 1,
  status: 1,
});

paymentSchema.index({
  withdrawal: 1,
  status: 1,
});

paymentSchema.index({
  provider: 1,
  status: 1,
});

paymentSchema.index({
  status: 1,
  initiatedAt: -1,
});

// ============================================================
// MODEL
// ============================================================

const Payment =
  mongoose.model<IPayment>(
    "Payment",
    paymentSchema
  );

export default Payment;