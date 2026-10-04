import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// DATASET ITEM TYPES
// ============================================================

export type DatasetItemStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "PUBLISHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED";

export type DatasetItemType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "CODE";

// ============================================================
// DATASET ITEM DOCUMENT INTERFACE
// ============================================================

export interface IDatasetItem extends Document {
  dataset: mongoose.Types.ObjectId;

  project: mongoose.Types.ObjectId;

  externalId: string | null;

  type: DatasetItemType;

  content: {
    text: string;
    imageUrl: string;
    audioUrl: string;
    videoUrl: string;
    code: string;
  };

  metadata: Record<string, unknown>;

  status: DatasetItemStatus;

  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DATASET ITEM SCHEMA
// ============================================================

const datasetItemSchema =
  new Schema<IDatasetItem>(
    {
      // ========================================================
      // DATASET
      // ========================================================

      dataset: {
        type: Schema.Types.ObjectId,
        ref: "Dataset",
        required: true,
        index: true,
      },

      // ========================================================
      // PROJECT
      //
      // Stored separately for faster filtering and authorization.
      // ========================================================

      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },

      // ========================================================
      // EXTERNAL ID
      //
      // Optional ID from client's original dataset.
      // ========================================================

      externalId: {
        type: String,
        default: null,
        trim: true,
        maxlength: 200,
      },

      // ========================================================
      // ITEM TYPE
      // ========================================================

      type: {
        type: String,
        enum: [
          "TEXT",
          "IMAGE",
          "AUDIO",
          "VIDEO",
          "CODE",
        ],
        required: true,
        index: true,
      },

      // ========================================================
      // CONTENT
      //
      // Depending on the item type, only the required field
      // will normally contain data.
      // ========================================================

      content: {
        text: {
          type: String,
          default: "",
        },

        imageUrl: {
          type: String,
          default: "",
        },

        audioUrl: {
          type: String,
          default: "",
        },

        videoUrl: {
          type: String,
          default: "",
        },

        code: {
          type: String,
          default: "",
        },
      },

      // ========================================================
      // METADATA
      //
      // Flexible information supplied by the client/project.
      // ========================================================

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },

      // ========================================================
      // STATUS
      // ========================================================

      status: {
        type: String,
        enum: [
          "PENDING",
          "PROCESSING",
          "READY",
          "PUBLISHED",
          "IN_PROGRESS",
          "COMPLETED",
          "FAILED",
          "ARCHIVED",
        ],
        default: "PENDING",
        index: true,
      },

      // ========================================================
      // CREATED BY
      // ========================================================

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
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

datasetItemSchema.index({
  dataset: 1,
  status: 1,
});

datasetItemSchema.index({
  project: 1,
  status: 1,
});

datasetItemSchema.index({
  dataset: 1,
  type: 1,
});

datasetItemSchema.index({
  createdBy: 1,
  createdAt: -1,
});

// ============================================================
// MODEL
// ============================================================

const DatasetItem =
  mongoose.model<IDatasetItem>(
    "DatasetItem",
    datasetItemSchema
  );

export default DatasetItem;