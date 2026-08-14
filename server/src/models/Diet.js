import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    slot: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    title: String,
    tags: [String],
    instructions: String,
    calories: Number,
    ingredients: [String],
    conditions: [String], // e.g. Diabetes, Hypertension
  },
  { _id: true }
);

const dietPlanSchema = new mongoose.Schema(
  {
    name: String,
    region: String,
    days: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        meals: [mealSchema],
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // dietitian/admin
  },
  { timestamps: true }
);

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

const assignedDietSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "DietPlan", required: true },
    assignedAt: { type: Date, default: Date.now },
    mealCompletions: [{ date: Date, slot: String, completed: Boolean }],
  },
  { timestamps: true }
);

export const AssignedDiet = mongoose.model("AssignedDiet", assignedDietSchema);
