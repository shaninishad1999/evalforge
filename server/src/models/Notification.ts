import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | "TASK"
  | "REVIEW"
  | "EARNING"
  | "PAYMENT"
  | "PROJECT"
  | "QUALIFICATION"
  | "SYSTEM";

// ============================================================
// NOTIFICATION DOCUMENT INTERFACE
// ============================================================

export interface INotification
  extends Document {
  user:
    mongoose.Types.ObjectId;

  type:
    NotificationType;

  title: string;

  message: string;

  link: string | null;

  metadata:
    Record<string, unknown>;

  isRead: boolean;

  readAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

// ============================================================
// NOTIFICATION SCHEMA
// ============================================================

const notificationSchema =
  new Schema<INotification>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "TASK",
          "REVIEW",
          "EARNING",
          "PAYMENT",
          "PROJECT",
          "QUALIFICATION",
          "SYSTEM",
        ],
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },

      link: {
        type: String,
        default: null,
        trim: true,
        maxlength: 1000,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },

      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },

      readAt: {
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

notificationSchema.index({
  user: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

notificationSchema.index({
  type: 1,
  createdAt: -1,
});

// ============================================================
// MODEL
// ============================================================

const Notification =
  mongoose.model<INotification>(
    "Notification",
    notificationSchema
  );

export default Notification;