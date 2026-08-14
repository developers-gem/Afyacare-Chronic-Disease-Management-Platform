import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROLES = [
  "patient",
  "family_caregiver",
  "doctor",
  "dietitian",
  "admin",
  "super_admin",
  "support_staff",
];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "patient" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    otp: {
      code: String,
      expiresAt: Date,
    },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: Date,
    sessions: [
      {
        tokenId: String,
        userAgent: String,
        ip: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.checkPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  const { _id, fullName, email, phone, role, isVerified, isActive, createdAt } = this;
  return { id: _id, fullName, email, phone, role, isVerified, isActive, createdAt };
};

export const ROLE_LIST = ROLES;
export default mongoose.model("User", userSchema);
