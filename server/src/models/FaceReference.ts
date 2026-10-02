import mongoose, { Document, Schema } from "mongoose";

export type FaceReferenceSource =
  | "SELFIE"
  | "PAN"
  | "OTHER";

export type FaceReferenceStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "READY"
  | "FAILED";

export interface IFaceReference extends Document {
  userId: mongoose.Types.ObjectId;

  imageUrl: string;

  source: FaceReferenceSource;

  status: FaceReferenceStatus;

  createdAt: Date;
  updatedAt: Date;
}

const faceReferenceSchema =
  new Schema<IFaceReference>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      imageUrl: {
        type: String,
        required: true,
        trim: true,
      },

      source: {
        type: String,
        enum: [
          "SELFIE",
          "PAN",
          "OTHER",
        ],
        required: true,
      },

      status: {
        type: String,
        enum: [
          "NOT_STARTED",
          "PROCESSING",
          "READY",
          "FAILED",
        ],
        default: "NOT_STARTED",
      },
    },
    {
      timestamps: true,
    }
  );

const FaceReference =
  mongoose.model<IFaceReference>(
    "FaceReference",
    faceReferenceSchema
  );

export default FaceReference;