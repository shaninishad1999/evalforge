import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "../models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const adminUsers = [
  {
    name: "EvalForge Super Admin",
    email: "superadmin@evalforge.com",
    password: "EvalForge@123",
    phoneNumber: "9000000001",
    role: "SUPER_ADMIN" as const,
    skills: [],
    languages: ["English", "Hindi"],
    isVerified: true,
    isActive: true,
  },
  {
    name: "EvalForge Admin",
    email: "admin@evalforge.com",
    password: "EvalForge@123",
    phoneNumber: "9000000002",
    role: "ADMIN" as const,
    skills: [],
    languages: ["English", "Hindi"],
    isVerified: true,
    isActive: true,
  },
];

const seedAdminUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected successfully");

    for (const adminData of adminUsers) {
      const existingUser = await User.findOne({
        email: adminData.email,
      });

      if (existingUser) {
        console.log(
          `User already exists: ${adminData.email} (${existingUser.role})`
        );
        continue;
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      await User.create({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        phoneNumber: adminData.phoneNumber,
        phoneVerified: false,
        role: adminData.role,
        avatar: "",
        skills: adminData.skills,
        languages: adminData.languages,
        isVerified: adminData.isVerified,
        isActive: adminData.isActive,
      });

      console.log(
        `Created ${adminData.role}: ${adminData.email}`
      );
    }

    console.log("Admin seed completed successfully");
  } catch (error) {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdminUsers();