import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// WALLET TYPES
// ============================================================

export type WalletStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "CLOSED";

// ============================================================
// WALLET DOCUMENT INTERFACE
// ============================================================

export interface IWallet
  extends Document {
  contributor: mongoose.Types.ObjectId;

  currency: string;

  balance: {
    totalEarnings: number;
    pending: number;
    available: number;
    processing: number;
    paid: number;
  };

  status: WalletStatus;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// WALLET SCHEMA
// ============================================================

const walletSchema =
  new Schema<IWallet>(
    {
      contributor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      currency: {
        type: String,
        default: "INR",
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 10,
      },

      balance: {
        totalEarnings: {
          type: Number,
          default: 0,
          min: 0,
        },

        pending: {
          type: Number,
          default: 0,
          min: 0,
        },

        available: {
          type: Number,
          default: 0,
          min: 0,
        },

        processing: {
          type: Number,
          default: 0,
          min: 0,
        },

        paid: {
          type: Number,
          default: 0,
          min: 0,
        },
      },

      status: {
        type: String,
        enum: [
          "ACTIVE",
          "SUSPENDED",
          "CLOSED",
        ],
        default: "ACTIVE",
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================================
// INDEXES
// ============================================================

walletSchema.index({
  contributor: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const Wallet =
  mongoose.model<IWallet>(
    "Wallet",
    walletSchema
  );

export default Wallet;