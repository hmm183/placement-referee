/**
 * Placement Referee Service (Optimized High-Performance Engine)
 *
 * Implements the impartial referee evaluation engine with single-pass LLM execution:
 * 1. Instant Local Text Parsing (<50ms) for candidate resumes.
 * 2. Single-Pass Solo Referee Assessment: Evaluates candidate evidence and extracts metadata in ONE Gemini call (~6-9s).
 * 3. Single-Pass Head-to-Head Pairwise Comparison: Evaluates Candidate A vs Candidate B in ONE comparative Gemini call (~7-10s).
 * 4. Persists full results in MongoDB Atlas for zero-latency retrieval on page refresh or history viewing.
 */

import RefereeCase from "../models/RefereeCase.js";
import Resume from "../models/Resume.js";
import { extractText } from "../parsers/resumeParser.js";
import { generateJSON } from "../llm/geminiClient.js";
import {
  buildSoloRefereePrompt,
  buildHeadToHeadRefereePrompt,
} from "../llm/prompts.js";
import axios from "axios";

/**
 * Fast local regex heuristic to extract basic profile attributes (<2ms)
 */
function quickExtractCandidateProfile(rawText, filename) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  // Look for the candidate's name in top 5 lines
  let name = null;
  for (const line of lines.slice(0, 5)) {
    if (
      line.length >= 2 &&
      line.length <= 40 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !/curriculum|resume|cv|contact|profile|education|experience/i.test(line)
    ) {
      name = line;
      break;
    }
  }

  if (!name) {
    name = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
  };
}

/**
 * Optional helper to fetch public text from a job URL
 */
export async function tryFetchJobUrl(url) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const res = await axios.get(url, {
      timeout: 6000,
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
 * Create a new Solo Referee Case with Single-Pass Gemini Execution
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
  const overallStart = Date.now();
  if (!company?.trim()) throw new Error("Company name is required.");
  if (!role?.trim()) throw new Error("Role name is required.");
  if (!jobDescription?.trim()) throw new Error("Job description or requirements are required.");
  if (!buffer) throw new Error("Candidate resume file is required.");

  // 1. Instant local text extraction (<50ms)
  const extractStart = Date.now();
  const rawText = await extractText(filename, buffer);
  if (!rawText || rawText.trim().length < 20) {
    throw new Error(`Could not extract sufficient text from "${filename}". File may be empty or an unreadable scan.`);
  }
  console.log(`[refereeService] Resume extracted in ${Date.now() - extractStart}ms`);

  // 2. Fast local profile extraction
  const localProfile = quickExtractCandidateProfile(rawText, filename);

  // 3. Build opportunity object
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

  // 4. Single-Pass Solo Referee Assessment with Gemini
  console.log(`[refereeService] Running single-pass Solo Referee Assessment with Gemini...`);
  const geminiStart = Date.now();
  const candidatePayload = {
    rawText,
    name: localProfile.name,
  };
  const prompt = buildSoloRefereePrompt(opportunity, candidatePayload);
  
  let soloAnalysis;
  try {
    soloAnalysis = await generateJSON(prompt, { temperature: 0.1, maxOutputTokens: 4096 });
    console.log(`[refereeService] Solo Gemini evaluation completed in ${Date.now() - geminiStart}ms`);
  } catch (err) {
    console.error("[refereeService] Solo Referee Gemini call failed:", err);
    throw new Error(`Referee assessment generation failed: ${err.message}`);
  }

  // 5. Structure candidate profile from referee response and local fallback
  const finalName =
    soloAnalysis?.candidateA?.name &&
    !soloAnalysis.candidateA.name.includes("Extract Candidate")
      ? soloAnalysis.candidateA.name
      : localProfile.name;

  const finalEmail =
    soloAnalysis?.candidateA?.email &&
    !soloAnalysis.candidateA.email.includes("Extract")
      ? soloAnalysis.candidateA.email
      : localProfile.email;

  const finalSkills = Array.isArray(soloAnalysis?.candidateA?.skills)
    ? soloAnalysis.candidateA.skills
    : [];

  const parsedData = {
    name: finalName,
    email: finalEmail,
    phone: localProfile.phone,
    skills: finalSkills,
    summary: soloAnalysis?.verdict?.summary || null,
    experience: [],
    education: [],
    projects: [],
  };

  if (soloAnalysis?.candidateA) {
    soloAnalysis.candidateA.name = finalName;
  }

  // 6. Save Resume and RefereeCase in MongoDB Atlas
  const resumeA = await Resume.create({
    userId: userId || null,
    filename,
    rawText,
    parsedData,
  });

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

  console.log(`[refereeService] Total Solo case creation completed in ${Date.now() - overallStart}ms`);
  return getRefereeCaseById(refereeCase._id, userId);
}

/**
 * Add Candidate B to an existing case and perform single-pass head-to-head pairwise comparison
 */
export async function addCandidateBAndCompare({
  caseId,
  filename,
  buffer,
  userId = null,
}) {
  const overallStart = Date.now();
  const query = { _id: caseId };
  if (userId) query.userId = userId;

  const refereeCase = await RefereeCase.findOne(query).populate("candidateAResumeId");
  if (!refereeCase) {
    throw new Error("Referee case not found or unauthorized.");
  }

  // 1. Instant local text extraction for Candidate B (<50ms)
  const extractStart = Date.now();
  const rawTextB = await extractText(filename, buffer);
  if (!rawTextB || rawTextB.trim().length < 20) {
    throw new Error(`Could not extract sufficient text from "${filename}". File may be empty or corrupted.`);
  }
  console.log(`[refereeService] Candidate B resume extracted in ${Date.now() - extractStart}ms`);

  const localProfileB = quickExtractCandidateProfile(rawTextB, filename);
  const candidateBPayload = {
    rawText: rawTextB,
    name: localProfileB.name,
  };

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

  // 4. Single-Pass Comparative Head-to-Head Gemini prompt
  console.log(`[refereeService] Running single-pass Head-to-Head comparison with Gemini...`);
  const geminiStart = Date.now();
  const prompt = buildHeadToHeadRefereePrompt(opportunity, resumeA, candidateBPayload);
  
  let comparisonAnalysis;
  try {
    comparisonAnalysis = await generateJSON(prompt, { temperature: 0.1, maxOutputTokens: 4096 });
    console.log(`[refereeService] Head-to-Head Gemini evaluation completed in ${Date.now() - geminiStart}ms`);
  } catch (err) {
    console.error("[refereeService] Head-to-Head Referee Gemini call failed:", err);
    throw new Error(`Head-to-head comparison failed: ${err.message}`);
  }

  // 5. Structure candidate B profile from comparison response
  const finalNameB =
    comparisonAnalysis?.candidateB?.name &&
    !comparisonAnalysis.candidateB.name.includes("Candidate B full")
      ? comparisonAnalysis.candidateB.name
      : localProfileB.name;

  const finalEmailB =
    comparisonAnalysis?.candidateB?.email &&
    !comparisonAnalysis.candidateB.email.includes("Candidate B email")
      ? comparisonAnalysis.candidateB.email
      : localProfileB.email;

  const finalSkillsB = Array.isArray(comparisonAnalysis?.candidateB?.skills)
    ? comparisonAnalysis.candidateB.skills
    : [];

  const parsedDataB = {
    name: finalNameB,
    email: finalEmailB,
    phone: localProfileB.phone,
    skills: finalSkillsB,
    summary: comparisonAnalysis?.verdict?.summary || null,
    experience: [],
    education: [],
    projects: [],
  };

  if (comparisonAnalysis?.candidateB) {
    comparisonAnalysis.candidateB.name = finalNameB;
  }

  const resumeB = await Resume.create({
    userId: userId || null,
    filename,
    rawText: rawTextB,
    parsedData: parsedDataB,
  });

  // 6. Update RefereeCase with Candidate B and comparison results
  refereeCase.candidateBResumeId = resumeB._id;
  refereeCase.mode = "head_to_head";
  refereeCase.status = "completed";
  refereeCase.comparisonAnalysis = comparisonAnalysis;
  await refereeCase.save();

  console.log(`[refereeService] Total Head-to-Head comparison completed in ${Date.now() - overallStart}ms`);
  return getRefereeCaseById(refereeCase._id, userId);
}

/**
 * Retrieve a single referee case by ID (from MongoDB cache — zero Gemini calls)
 */
export async function getRefereeCaseById(caseId, userId = null) {
  const query = { _id: caseId };
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
