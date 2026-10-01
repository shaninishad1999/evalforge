import mongoose, { Document, Schema } from "mongoose";

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "PROJECT_MANAGER"
  | "REVIEWER"
  | "CONTRIBUTOR";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
    phoneNumber?: string;
  phoneVerified: boolean;

  role: UserRole;
  avatar?: string;
  skills: string[];
  languages: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    phoneNumber: {
  type: String,
  trim: true,
  default: "",
  index: true,
},

phoneVerified: {
  type: Boolean,
  default: false,
},
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "ADMIN",
        "CLIENT",
        "PROJECT_MANAGER",
        "REVIEWER",
        "CONTRIBUTOR",
      ],
      default: "CONTRIBUTOR",
      index: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;