import mongoose, { Document, Schema } from "mongoose";

export interface IAuthSession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<IAuthSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically removes expired sessions
authSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AuthSession = mongoose.model<IAuthSession>(
  "AuthSession",
  authSessionSchema
);

export default AuthSession;