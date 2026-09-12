import mongoose from "mongoose";

const refereeCaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: String,
      default: "Campus placement",
      trim: true,
    },
    university: {
      type: String,
      trim: true,
      default: null,
    },
    recruitmentYear: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    jobId: {
      type: String,
      trim: true,
      default: null,
    },
    placementCycle: {
      type: String,
      trim: true,
      default: null,
    },
    jobInputMethod: {
      type: String,
      enum: ["description", "requirements", "url"],
      default: "description",
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobRequirements: {
      type: [String],
      default: [],
    },
    jobUrl: {
      type: String,
      default: null,
    },
    candidateAResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    candidateBResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },
    mode: {
      type: String,
      enum: ["solo", "head_to_head"],
      default: "solo",
    },
    status: {
      type: String,
      enum: ["draft", "solo_analyzing", "solo_completed", "comparing", "completed", "failed"],
      default: "solo_completed",
    },
    soloAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    comparisonAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

refereeCaseSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("RefereeCase", refereeCaseSchema);
