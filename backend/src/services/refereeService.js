/**
 * Placement Referee Service
 *
 * Implements the impartial referee evaluation engine:
 * 1. Solo Referee Assessment: Evaluates Candidate A's evidence against specific company/role requirements.
 * 2. Head-to-Head Referee Assessment: Impartial pairwise comparison of Candidate A vs Candidate B for the same role.
 * 3. Persists full results in MongoDB Atlas to prevent redundant Gemini API calls on page refresh.
 */

import RefereeCase from "../models/RefereeCase.js";
import Resume from "../models/Resume.js";
import { extractText } from "../parsers/resumeParser.js";
import { generateJSON } from "../llm/geminiClient.js";
import {
  buildExtractionPrompt,
  buildSoloRefereePrompt,
  buildHeadToHeadRefereePrompt,
} from "../llm/prompts.js";
import axios from "axios";

/**
 * Safely parse candidate resume into structured data via Gemini
 */
async function extractAndStructureResume(filename, buffer, userId = null) {
  const rawText = await extractText(filename, buffer);
  if (!rawText || rawText.trim().length < 20) {
    throw new Error(`Could not extract sufficient text from "${filename}". File may be empty or corrupted.`);
  }

  const prompt = buildExtractionPrompt(rawText);
  let parsedData = null;
  try {
    parsedData = await generateJSON(prompt, { maxOutputTokens: 8192 });
  } catch (err) {
    console.warn(`[refereeService] Resume structure extraction fallback: ${err.message}`);
    parsedData = {
      name: filename.replace(/\.[^/.]+$/, ""),
      skills: [],
      experience: [],
      education: [],
      summary: null,
    };
  }

  const resume = await Resume.create({
    userId: userId || null,
    filename,
    rawText,
    parsedData,
  });

  return resume;
}

/**
 * Optional helper to fetch public text from a job URL
 */
export async function tryFetchJobUrl(url) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    // Strip html tags
    const clean = res.data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean.slice(0, 5000);
  } catch (err) {
    console.warn(`[refereeService] Could not fetch job URL: ${err.message}`);
    return null;
  }
}

/**
 * Create a new Solo Referee Case
 */
export async function createSoloCase({
  company,
  role,
  context = "Campus placement",
  university = null,
  recruitmentYear = null,
  location = null,
  jobId = null,
  placementCycle = null,
  jobInputMethod = "description",
  jobDescription,
  jobRequirements = [],
  jobUrl = null,
  filename,
  buffer,
  userId = null,
}) {
  if (!company?.trim()) throw new Error("Company name is required.");
  if (!role?.trim()) throw new Error("Role name is required.");
  if (!jobDescription?.trim()) throw new Error("Job description or requirements are required.");
  if (!buffer) throw new Error("Candidate resume file is required.");

  // 1. Process Candidate A Resume
  console.log(`[refereeService] Parsing Candidate A resume (${filename})...`);
  const resumeA = await extractAndStructureResume(filename, buffer, userId);

  // 2. Build opportunity object
  const opportunity = {
    company: company.trim(),
    role: role.trim(),
    context: context?.trim() || "Campus placement",
    university: university?.trim() || null,
    recruitmentYear: recruitmentYear?.trim() || null,
    location: location?.trim() || null,
    jobId: jobId?.trim() || null,
    placementCycle: placementCycle?.trim() || null,
    jobInputMethod,
    jobDescription: jobDescription.trim(),
    jobRequirements: Array.isArray(jobRequirements) ? jobRequirements : [],
    jobUrl: jobUrl?.trim() || null,
  };

  // 3. Generate Solo Referee Analysis with Gemini
  console.log(`[refereeService] Generating Solo Referee Assessment with Gemini...`);
  const prompt = buildSoloRefereePrompt(opportunity, resumeA);
  let soloAnalysis;
  try {
    soloAnalysis = await generateJSON(prompt, { temperature: 0.1, maxOutputTokens: 8192 });
  } catch (err) {
    console.error("[refereeService] Solo Referee Gemini call failed:", err);
    throw new Error(`Referee assessment generation failed: ${err.message}`);
  }

  // 4. Save RefereeCase in MongoDB Atlas
  const refereeCase = await RefereeCase.create({
    userId: userId || null,
    company: opportunity.company,
    role: opportunity.role,
    context: opportunity.context,
    university: opportunity.university,
    recruitmentYear: opportunity.recruitmentYear,
    location: opportunity.location,
    jobId: opportunity.jobId,
    placementCycle: opportunity.placementCycle,
    jobInputMethod: opportunity.jobInputMethod,
    jobDescription: opportunity.jobDescription,
    jobRequirements: opportunity.jobRequirements,
    jobUrl: opportunity.jobUrl,
    candidateAResumeId: resumeA._id,
    candidateBResumeId: null,
    mode: "solo",
    status: "solo_completed",
    soloAnalysis,
    comparisonAnalysis: null,
  });

  return getRefereeCaseById(refereeCase._id, userId);
}

/**
 * Add Candidate B to an existing case and perform head-to-head pairwise comparison
 */
export async function addCandidateBAndCompare({
  caseId,
  filename,
  buffer,
  userId = null,
}) {
  const query = { _id: caseId };
  if (userId) query.userId = userId;

  const refereeCase = await RefereeCase.findOne(query).populate("candidateAResumeId");
  if (!refereeCase) {
    throw new Error("Referee case not found or unauthorized.");
  }

  // 1. Process Candidate B Resume
  console.log(`[refereeService] Parsing Candidate B resume (${filename})...`);
  const resumeB = await extractAndStructureResume(filename, buffer, userId);

  // 2. Candidate A is already persisted
  const resumeA = refereeCase.candidateAResumeId;
  if (!resumeA) {
    throw new Error("Candidate A resume could not be retrieved for this case.");
  }

  // 3. Build opportunity object from existing case
  const opportunity = {
    company: refereeCase.company,
    role: refereeCase.role,
    context: refereeCase.context,
    university: refereeCase.university,
    recruitmentYear: refereeCase.recruitmentYear,
    location: refereeCase.location,
    jobId: refereeCase.jobId,
    placementCycle: refereeCase.placementCycle,
    jobDescription: refereeCase.jobDescription,
    jobRequirements: refereeCase.jobRequirements,
    jobUrl: refereeCase.jobUrl,
  };

  // 4. Run comparative Head-to-Head Gemini prompt
  console.log(`[refereeService] Running Head-to-Head Referee comparison with Gemini...`);
  const prompt = buildHeadToHeadRefereePrompt(opportunity, resumeA, resumeB);
  let comparisonAnalysis;
  try {
    comparisonAnalysis = await generateJSON(prompt, { temperature: 0.1, maxOutputTokens: 8192 });
  } catch (err) {
    console.error("[refereeService] Head-to-Head Referee Gemini call failed:", err);
    throw new Error(`Head-to-head comparison failed: ${err.message}`);
  }

  // 5. Update RefereeCase with Candidate B and comparison results
  refereeCase.candidateBResumeId = resumeB._id;
  refereeCase.mode = "head_to_head";
  refereeCase.status = "completed";
  refereeCase.comparisonAnalysis = comparisonAnalysis;
  await refereeCase.save();

  return getRefereeCaseById(refereeCase._id, userId);
}

/**
 * Retrieve a single referee case by ID (from MongoDB cache — zero Gemini calls)
 */
export async function getRefereeCaseById(caseId, userId = null) {
  const query = { _id: caseId };
  // If userId is provided, ensure user owns the case or case has null userId (guest)
  if (userId) {
    query.$or = [{ userId }, { userId: null }];
  }

  const refereeCase = await RefereeCase.findOne(query)
    .populate("candidateAResumeId", "filename parsedData createdAt")
    .populate("candidateBResumeId", "filename parsedData createdAt");

  return refereeCase;
}

/**
 * List all referee cases belonging to a user (for Case History)
 */
export async function listUserCases(userId = null) {
  const query = userId ? { userId } : {};
  return RefereeCase.find(query)
    .sort({ createdAt: -1 })
    .populate("candidateAResumeId", "filename parsedData.name")
    .populate("candidateBResumeId", "filename parsedData.name")
    .select(
      "company role context mode status soloAnalysis.verdict comparisonAnalysis.verdict createdAt updatedAt"
    );
}

/**
 * Delete a referee case
 */
export async function deleteRefereeCase(caseId, userId = null) {
  const query = { _id: caseId };
  if (userId) query.userId = userId;

  const result = await RefereeCase.findOneAndDelete(query);
  return !!result;
}
