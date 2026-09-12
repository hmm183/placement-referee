import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import config from "../../config.js";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import {
  createSoloCase,
  addCandidateBAndCompare,
  getRefereeCaseById,
  listUserCases,
  deleteRefereeCase,
  tryFetchJobUrl,
} from "../../services/refereeService.js";

const router = Router();
const isValidId = (id) => mongoose.isValidObjectId(id);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const ext = "." + file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed."));
    }
  },
});

router.use(optionalAuth);

/**
 * POST /api/referee/fetch-url
 * Helper to fetch public content from a job posting URL
 */
router.post("/fetch-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required." });
    const content = await tryFetchJobUrl(url);
    if (!content) {
      return res.status(422).json({
        error: "We couldn't retrieve the job posting. You can paste the job description instead.",
      });
    }
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/referee/solo
 * Create a new Solo Referee Case with Candidate A's resume
 */
router.post("/solo", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload your resume file (Candidate A)." });
    }

    const {
      company,
      role,
      context,
      university,
      recruitmentYear,
      location,
      jobId,
      placementCycle,
      jobInputMethod,
      jobDescription,
      jobRequirements,
      jobUrl,
    } = req.body;

    if (!company?.trim()) return res.status(400).json({ error: "Company name is required." });
    if (!role?.trim()) return res.status(400).json({ error: "Role name is required." });
    if (!jobDescription?.trim()) return res.status(400).json({ error: "Job description or requirements are required." });

    let parsedRequirements = [];
    if (jobRequirements) {
      try {
        parsedRequirements = typeof jobRequirements === "string" ? JSON.parse(jobRequirements) : jobRequirements;
      } catch {
        parsedRequirements = String(jobRequirements).split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const refereeCase = await createSoloCase({
      company: company.trim(),
      role: role.trim(),
      context: context?.trim() || "Campus placement",
      university: university?.trim() || null,
      recruitmentYear: recruitmentYear?.trim() || null,
      location: location?.trim() || null,
      jobId: jobId?.trim() || null,
      placementCycle: placementCycle?.trim() || null,
      jobInputMethod: jobInputMethod || "description",
      jobDescription: jobDescription.trim(),
      jobRequirements: parsedRequirements,
      jobUrl: jobUrl?.trim() || null,
      filename: req.file.originalname,
      buffer: req.file.buffer,
      userId: req.userId,
    });

    res.status(201).json(refereeCase);
  } catch (err) {
    console.error("[refereeRoutes] Solo case creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/referee/:id/candidate-b
 * Add Candidate B to an existing case and run head-to-head comparison
 */
router.post("/:id/candidate-b", upload.single("resume"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid referee case ID." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Please upload Candidate B's resume file." });
    }

    const updatedCase = await addCandidateBAndCompare({
      caseId: req.params.id,
      filename: req.file.originalname,
      buffer: req.file.buffer,
      userId: req.userId,
    });

    res.json(updatedCase);
  } catch (err) {
    console.error("[refereeRoutes] Candidate B comparison error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/referee
 * List all cases for the user (for Case History)
 */
router.get("/", async (req, res) => {
  try {
    const cases = await listUserCases(req.userId);
    res.json(cases);
  } catch (err) {
    console.error("[refereeRoutes] List cases error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/referee/:id
 * Retrieve a specific referee case (cached in DB — zero Gemini tokens used)
 */
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid referee case ID." });
    }

    const refereeCase = await getRefereeCaseById(req.params.id, req.userId);
    if (!refereeCase) {
      return res.status(404).json({ error: "Referee case not found." });
    }

    res.json(refereeCase);
  } catch (err) {
    console.error("[refereeRoutes] Get case error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/referee/:id
 * Delete a referee case
 */
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: "Invalid referee case ID." });
    }

    const deleted = await deleteRefereeCase(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: "Referee case not found or unauthorized." });
    }

    res.json({ success: true, message: "Referee case deleted." });
  } catch (err) {
    console.error("[refereeRoutes] Delete case error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
