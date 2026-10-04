import mongoose, { Document, Schema } from "mongoose";

// ============================================================
// DATASET TYPES
// ============================================================

export type DatasetStatus =
  | "DRAFT"
  | "PROCESSING"
  | "READY"
  | "PUBLISHED"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED"
  | "FAILED";

export type DatasetType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "CODE"
  | "MIXED";

// ============================================================
// DATASET DOCUMENT INTERFACE
// ============================================================

export interface IDataset extends Document {
  name: string;
  description: string;

  project: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;

  type: DatasetType;

  source: {
    name: string;
    description: string;
  };

  configuration: {
    taskTypes: string[];
    totalItems: number;
  };

  status: DatasetStatus;

  publishedAt: Date | null;
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DATASET SCHEMA
// ============================================================

const datasetSchema = new Schema<IDataset>(
  {
    name: {
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

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "TEXT",
        "IMAGE",
        "AUDIO",
        "VIDEO",
        "CODE",
        "MIXED",
      ],
      default: "TEXT",
      index: true,
    },

    source: {
      name: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
      },
    },

    configuration: {
      taskTypes: {
        type: [String],
        default: [],
      },

      totalItems: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PROCESSING",
        "READY",
        "PUBLISHED",
        "PAUSED",
        "COMPLETED",
        "ARCHIVED",
        "FAILED",
      ],
      default: "DRAFT",
      index: true,
    },

    publishedAt: {
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

datasetSchema.index({
  project: 1,
  status: 1,
});

datasetSchema.index({
  createdBy: 1,
  status: 1,
});

const Dataset = mongoose.model<IDataset>(
  "Dataset",
  datasetSchema
);

export default Dataset;