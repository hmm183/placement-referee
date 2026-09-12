/**
 * LLM Prompt Templates
 *
 * Three prompts power the pipeline:
 *   1. buildExtractionPrompt   — raw resume text → structured JSON
 *   2. buildScoringPrompt      — structured resume JSON + JD → score & justification
 *   3. buildIntelligencePrompt — structured resume JSON + JD → full intelligence analysis
 *                                 (the new rich analysis for the interactive resume experience)
 */

export function buildExtractionPrompt(rawText) {
  return `
You are a resume parser. Output a single valid JSON object — no markdown, no code fences, no explanation, no extra whitespace.

IMPORTANT: Be as concise as possible. Use short strings. Do not pad or beautify the JSON.
Output the COMPLETE object — do not truncate or stop early.

JSON schema (output exactly this structure):
{"name":null,"email":null,"phone":null,"location":null,"title":null,"linkedin":null,"github":null,"website":null,"summary":null,"experience":[{"title":"","company":"","duration":"","location":null,"bullets":[]}],"education":[{"degree":"","institution":"","year":"","gpa":null,"details":null}],"projects":[{"name":"","description":"","technologies":[],"url":null,"bullets":[]}],"skills":[],"certifications":[],"achievements":[]}

Rules:
- Use [] for empty arrays, null for missing strings — never omit a field.
- Extract experience bullets verbatim but keep them under 120 chars each.
- Flatten all skill categories into the "skills" array.
- Output ONLY the JSON. Nothing else.

Resume Text:
${rawText}
`.trim();
}

export function buildScoringPrompt(jobDescription, parsedResumeJSON) {
  return `
You are an expert technical recruiter. Compare the candidate's resume with the job description
and rate how well the candidate fits the role.

Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

Required JSON shape:
{
  "score": <integer between 1 and 10>,
  "justification": "<2-3 sentences explaining the score>",
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"]
}

Scoring guide:
  9-10 → Excellent fit, meets almost all requirements
  7-8  → Good fit, meets most requirements with minor gaps
  5-6  → Partial fit, relevant background but notable gaps
  3-4  → Weak fit, limited alignment with the role
  1-2  → Poor fit, significant mismatch

Job Description:
${jobDescription}

Candidate Resume (structured data):
${JSON.stringify(parsedResumeJSON, null, 2)}
`.trim();
}

/**
 * The full intelligence analysis prompt.
 * Returns a rich structured analysis used by the interactive resume experience.
 *
 * CRITICAL: Gemini must NOT hallucinate skills or encourage resume fraud.
 * Each keyword/skill recommendation must clearly classify whether the skill
 * already exists, is poorly represented, or is genuinely missing.
 */
export function buildIntelligencePrompt(jobDescription, parsedResumeJSON) {
  return `
You are an expert technical recruiter and resume coach. Perform a deep analysis of the candidate's
resume against the job description. Return ONLY a valid JSON object — no explanation, no markdown, no code fences.

CRITICAL RULES:
1. Do NOT recommend adding skills the candidate does not appear to have.
2. Clearly distinguish between: present (already there), underrepresented (there but weakly expressed), and missing.
3. Every recommendation must cite the exact source text from the resume and provide a specific improvement.
4. Be honest — if a skill is genuinely absent, say so and note "only add if you genuinely have this experience."

Return this exact JSON shape:

{
  "overallScore": <integer 0-100>,
  "scoreLabel": "<Excellent|Good|Fair|Weak>",
  "executiveSummary": "<2-3 sentence honest assessment of the candidate's fit>",

  "sectionScores": {
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "projects": <0-100>,
    "presentation": <0-100>
  },

  "strengths": [
    {
      "category": "<Skills|Experience|Education|Projects|Presentation>",
      "text": "<what is strong>",
      "evidence": "<exact quote from resume that demonstrates this strength>"
    }
  ],

  "recommendations": [
    {
      "id": "<unique string id like rec_001>",
      "section": "<experience|skills|education|projects|summary|certifications>",
      "priority": "<high|medium|low>",
      "type": "<improve_wording|add_keywords|quantify_impact|add_context|restructure>",
      "sourceText": "<exact text currently in the resume, or null if it's a new addition>",
      "suggestedText": "<the improved version of that text>",
      "reason": "<specific reason why this change improves alignment with the job description>",
      "keywords": ["keyword1", "keyword2"],
      "locationHint": {
        "section": "<experience|skills|education|projects|summary>",
        "itemIndex": <0-based index of the experience/project/education item, or null>,
        "bulletIndex": <0-based index of the bullet point within the item, or null>
      }
    }
  ],

  "keywordAnalysis": {
    "present": [
      {
        "keyword": "<skill/keyword>",
        "strength": "<strong|moderate|weak>",
        "evidence": "<where in resume this appears>",
        "locationHint": {
          "section": "<section name>",
          "itemIndex": <null or index>,
          "bulletIndex": <null or index>
        }
      }
    ],
    "underrepresented": [
      {
        "keyword": "<skill/keyword>",
        "evidence": "<what exists in the resume that relates to this>",
        "suggestion": "<how to better express it>",
        "locationHint": {
          "section": "<section name>",
          "itemIndex": <null or index>,
          "bulletIndex": <null or index>
        }
      }
    ],
    "missing": [
      {
        "keyword": "<skill/keyword>",
        "importance": "<critical|high|medium>",
        "context": "<why this is relevant to the job description>",
        "disclaimer": "Only add if you genuinely have this experience."
      }
    ]
  },

  "matchVisualization": [
    {
      "resumeText": "<skill or concept from resume>",
      "jobText": "<matching requirement from job description>",
      "matchType": "<exact|semantic|partial|missing>",
      "strength": <0-100>
    }
  ],

  "quickWins": [
    {
      "action": "<specific, short, actionable change>",
      "impact": "<high|medium>",
      "effort": "<low|medium>"
    }
  ]
}

Job Description:
${jobDescription}

Candidate Resume (structured data):
${JSON.stringify(parsedResumeJSON, null, 2)}
`.trim();
}

/**
 * Solo Referee Prompt
 * Impartial evaluation of Candidate A's evidence against a specific role and company.
 * Optimized for single-pass execution directly from extracted resume text.
 */
export function buildSoloRefereePrompt(opportunity, candidateA) {
  const oppSummary = `
Company: ${opportunity.company}
Role: ${opportunity.role}
Recruitment Context: ${opportunity.context || "Campus Placement / Early Career"}
${opportunity.university ? `Target University: ${opportunity.university}` : ""}
${opportunity.recruitmentYear ? `Recruitment Year/Batch: ${opportunity.recruitmentYear}` : ""}
${opportunity.location ? `Location: ${opportunity.location}` : ""}

Job Requirements / Description:
${opportunity.jobDescription}
`.trim();

  const candidateText = (
    candidateA.rawText ||
    (typeof candidateA.parsedData === "object" ? JSON.stringify(candidateA.parsedData, null, 2) : "") ||
    ""
  ).slice(0, 7000);

  const knownName = candidateA.parsedData?.name || candidateA.name || "";

  return `
You are an impartial, analytical Placement Referee evaluating candidate evidence for a specific role at a specific company.
Your mandate is to provide an objective, evidence-based assessment of how well the candidate's submitted resume demonstrates fit for THIS specific opportunity.

CRITICAL OPERATIONAL DIRECTIVES:
1. SPEED & DENSITY: Be sharp, analytical, and concise. Avoid conversational fluff or filler. Use high-impact bullet points.
2. FOCUS ON EVIDENCE, NOT CONFIDENCE: Evaluate only what the candidate proves.
3. DISTINGUISH EVIDENCE TYPES:
   - "explicit": Directly demonstrated with concrete projects, jobs, metrics, or verifiable outputs.
   - "indirect": Related coursework or adjacent concepts mentioned without direct proof of application.
   - "none": No evidence was found in the submitted resume.
   Never equate "not mentioned" with "does not know". Always say "No evidence was found in the submitted resume."
4. NO HALLUCINATION OF COMPANY SECRETS: If specific company internal rubrics are not publicly provided, state: "Company-specific hiring information was not available, so this assessment is primarily based on the role requirements provided."
5. REDUCE STUDENT ANXIETY: Explicitly identify what actually matters versus what the student should NOT overthink (e.g. minor formatting nuances, keyword stuffing, minor tech mentions).
6. HONESTY & ETHICS: Never advise fabricating skills or experience. State: "Only add if you genuinely have this experience."
7. FAIRNESS: Never evaluate or infer protected attributes (race, gender, religion, caste, age, socioeconomic background). Evaluate evidence alone.
8. ACKNOWLEDGE BLIND SPOTS: Explicitly note what the referee cannot observe (live coding performance, behavioral communication, problem-solving under time pressure).

Return ONLY a valid JSON object matching this schema exactly (no markdown fences, no explanatory text):

{
  "mode": "solo",
  "verdict": {
    "fitLevel": "strong",
    "headline": "Strong evidence of fit",
    "confidence": "high",
    "summary": "2-3 concise, impartial sentences evaluating the evidence against the role requirements.",
    "disclaimer": "This is an impartial assessment of submitted evidence for this specific opportunity, not a prediction of the company's hiring decision."
  },
  "opportunity": {
    "company": "${opportunity.company}",
    "role": "${opportunity.role}",
    "context": "${opportunity.context || "Campus placement"}"
  },
  "candidateA": {
    "name": "${knownName ? knownName : "Extract Candidate Full Name from resume"}",
    "email": "Extract candidate email from resume if present, or null",
    "skills": ["Extracted", "top", "skills", "from", "resume"],
    "overallFit": "strong",
    "evidenceStrength": "high",
    "whatAlreadyProves": [
      "Key capability with direct evidence cited"
    ],
    "strengths": [
      {
        "area": "Technical/Domain Area",
        "evidence": "Direct evidence from resume",
        "relevance": "Why it matters for this specific role"
      }
    ],
    "weaknesses": [
      {
        "gap": "Missing or weak requirement",
        "impact": "critical | moderate | low",
        "note": "Constructive gap explanation"
      }
    ],
    "whatCouldChangeAssessment": [
      "Information not present in resume that could materially upgrade the assessment if proven"
    ],
    "realisticOpportunities": [
      "Concrete, honest recommendation to strengthen proof for this role"
    ]
  },
  "requirementBreakdown": [
    {
      "requirement": "Core Requirement Name",
      "priority": "critical",
      "evidenceFound": "Summary of what was found in resume",
      "evidenceStrength": "strong",
      "evidenceType": "explicit",
      "relevance": "Why this priority was assigned for this role",
      "missingEvidence": "What is absent or unproven"
    }
  ],
  "whatActuallyMatters": [
    "One of the 2-4 critical capabilities that genuinely decide fit for this role"
  ],
  "whatShouldntOverthink": [
    "Aspect that the candidate should not worry about or obsess over"
  ],
  "whatCouldChangeAssessment": [
    "Factors that would change the evaluation"
  ],
  "limitations": [
    "Live coding assessment performance has not been observed",
    "System design under interview conditions is unobserved",
    "Behavioral and team communication is unobserved"
  ],
  "fairnessNote": "Assessment is based purely on technical and experience evidence relevant to the role requirements, without assumption of unobserved characteristics.",
  "reasoning": "Calm, analytical final referee summation."
}

Allowed values:
- fitLevel and overallFit: "strong" | "good" | "moderate" | "weak" | "insufficient"
- confidence and evidenceStrength: "high" | "medium" | "low"
- priority: "critical" | "high" | "medium" | "low"
- evidenceStrength in breakdown: "strong" | "moderate" | "weak" | "none"
- evidenceType: "explicit" | "indirect" | "none"

Opportunity Context:
${oppSummary}

Candidate A Resume Evidence:
${candidateText}
`.trim();
}

/**
 * Head-to-Head Referee Prompt
 * Impartial pairwise comparison of Candidate A vs Candidate B for the exact same opportunity.
 * Optimized for single-pass execution directly from extracted resume text.
 */
export function buildHeadToHeadRefereePrompt(opportunity, candidateA, candidateB) {
  const oppSummary = `
Company: ${opportunity.company}
Role: ${opportunity.role}
Recruitment Context: ${opportunity.context || "Campus Placement / Early Career"}
${opportunity.university ? `Target University: ${opportunity.university}` : ""}
${opportunity.recruitmentYear ? `Recruitment Year/Batch: ${opportunity.recruitmentYear}` : ""}
${opportunity.location ? `Location: ${opportunity.location}` : ""}

Job Requirements / Description:
${opportunity.jobDescription}
`.trim();

  const textA = (
    candidateA.rawText ||
    (typeof candidateA.parsedData === "object" ? JSON.stringify(candidateA.parsedData, null, 2) : "") ||
    ""
  ).slice(0, 6500);

  const textB = (
    candidateB.rawText ||
    (typeof candidateB.parsedData === "object" ? JSON.stringify(candidateB.parsedData, null, 2) : "") ||
    ""
  ).slice(0, 6500);

  const nameA = candidateA.parsedData?.name || candidateA.name || "";
  const nameB = candidateB.parsedData?.name || candidateB.name || "";

  return `
You are an impartial, analytical Placement Referee conducting a rigorous pairwise comparison between two candidates (Candidate A and Candidate B) competing for the SAME opportunity at the SAME company.

CRITICAL OPERATIONAL DIRECTIVES:
1. SPEED & DENSITY: Be sharp, analytical, and concise. Avoid conversational fluff or filler. Use high-impact bullet points.
2. COMPARE EVIDENCE, NOT CONFIDENCE:
   - Base every verdict strictly on demonstrated evidence in the submitted resumes.
   - Do not reward buzzword repetition or resume length.
3. DO NOT FORCE A WINNER:
   - If both candidates demonstrate comparable evidence for the critical requirements, the verdict MUST be "tie" ("Too close to call").
   - A tie is a successful and honest outcome, not a failure.
   - Never use fake precision or arbitrary decimal scores (e.g. 87.4 vs 86.9).
   - If evidence is too sparse to judge, use "insufficient_evidence".
4. NOT A HIRING PREDICTION:
   - Say: "Candidate A currently has the stronger evidence of fit based on the submitted materials."
   - Explicitly remind that the company's final decision involves unobserved factors.
5. EVIDENCE TYPES:
   - "explicit": Verifiable production, internship, or comprehensive project evidence.
   - "indirect": Related coursework or adjacent tools without direct demonstration.
   - "none": "No evidence was found in the submitted resume." (Never equate absence with lack of ability).
6. WHAT ACTUALLY DECIDED IT:
   - Surface 2 to 4 meaningful, decisive differences that truly matter for THIS role.
   - Separately list minor differences and irrelevant differences so students do not obsess over trivial details.
7. WHAT NEITHER CANDIDATE SHOULD OVERTHINK:
   - Provide concrete reassurance regarding superficial items (e.g. font, layout differences, duplicate keywords).
8. ETHICS & FAIRNESS:
   - Strict neutrality. Never evaluate protected attributes or infer traits from names or backgrounds.

Return ONLY a valid JSON object matching this schema exactly (no markdown fences, no explanatory text):

{
  "mode": "head_to_head",
  "verdict": {
    "winner": "candidate_a",
    "headline": "Candidate A currently has the stronger evidence",
    "summary": "2-3 sentences explaining the primary decisive factors that separated the two candidates for this specific role.",
    "confidence": "high",
    "disclaimer": "This is a comparison of submitted evidence, not a prediction of the company's final hiring decision. The referee has not observed interview or test performance."
  },
  "opportunity": {
    "company": "${opportunity.company}",
    "role": "${opportunity.role}",
    "context": "${opportunity.context || "Campus placement"}"
  },
  "candidateA": {
    "name": "${nameA ? nameA : "Candidate A full name from resume"}",
    "email": "Candidate A email if found, or null",
    "skills": ["Candidate", "A", "key", "skills"],
    "overallFit": "strong",
    "evidenceStrength": "high",
    "keyEdgeAreas": ["Specific area where Candidate A demonstrated stronger evidence"],
    "strengths": [
      { "text": "Strength description", "evidence": "Resume proof" }
    ],
    "weaknesses": [
      { "gap": "Gap description", "impact": "critical | moderate | low" }
    ],
    "whatCouldChange": [
      "Information that would strengthen or adjust Candidate A's standing"
    ]
  },
  "candidateB": {
    "name": "${nameB ? nameB : "Candidate B full name from resume"}",
    "email": "Candidate B email if found, or null",
    "skills": ["Candidate", "B", "key", "skills"],
    "overallFit": "good",
    "evidenceStrength": "medium",
    "keyEdgeAreas": ["Specific area where Candidate B demonstrated stronger evidence"],
    "strengths": [
      { "text": "Strength description", "evidence": "Resume proof" }
    ],
    "weaknesses": [
      { "gap": "Gap description", "impact": "critical | moderate | low" }
    ],
    "whatCouldChange": [
      "Information that would strengthen or adjust Candidate B's standing"
    ]
  },
  "decisiveDifferences": [
    {
      "difference": "Title of decisive difference (e.g. Production Backend Experience)",
      "candidateAEvidence": "Concrete evidence summary for Candidate A",
      "candidateBEvidence": "Concrete evidence summary for Candidate B",
      "edge": "candidate_a",
      "whyItMatters": "Why this specific difference carries decisive weight for this role"
    }
  ],
  "minorDifferences": [
    {
      "difference": "Area with slight difference",
      "whyItDoesntMatterMuch": "Why this difference is unlikely to separate the candidates"
    }
  ],
  "irrelevantDifferences": [
    {
      "difference": "Superficial difference (e.g. wording style, redundant tools)",
      "note": "Why this should be completely disregarded"
    }
  ],
  "requirementComparison": [
    {
      "requirement": "Core Requirement Name",
      "importance": "critical",
      "candidateA": {
        "assessment": "strong",
        "evidence": "Candidate A direct evidence",
        "evidenceType": "explicit"
      },
      "candidateB": {
        "assessment": "moderate",
        "evidence": "Candidate B direct evidence",
        "evidenceType": "indirect"
      },
      "edge": "candidate_a",
      "whyItMatters": "Role-specific importance rationale"
    }
  ],
  "whatActuallyMatters": [
    "Core capability that genuinely drives suitability for this opportunity"
  ],
  "whatNeitherShouldOverthink": [
    "Aspect neither candidate should spend emotional energy or worry on"
  ],
  "whatCouldChangeTheCall": [
    "Candidate B has relevant unlisted experience",
    "Coding assessment results differ from resume signals",
    "Live problem-solving under interview pressure"
  ],
  "whatRefereeDoesntKnow": [
    "Live coding assessment performance",
    "Behavioral interview execution",
    "System architecture explanation under pressure"
  ],
  "limitations": [
    "Evaluation is strictly bounded by the evidence presented in the submitted resumes"
  ],
  "fairnessNote": "Both candidates were evaluated strictly against identical criteria derived from the stated role requirements, without assumptions or bias.",
  "reasoning": "Comprehensive impartial referee summary explaining the comparative verdict."
}

Allowed values:
- winner: "candidate_a" | "candidate_b" | "tie" | "insufficient_evidence"
- headline:
  - If candidate_a: "Candidate A currently has the stronger evidence"
  - If candidate_b: "Candidate B currently has the stronger evidence"
  - If tie: "Too close to call (Tie)"
  - If insufficient_evidence: "Insufficient evidence to determine an edge"
- edge in decisiveDifferences and requirementComparison: "candidate_a" | "candidate_b" | "tie" | "unknown"
- overallFit: "strong" | "good" | "moderate" | "weak" | "insufficient"
- confidence & evidenceStrength: "high" | "medium" | "low"
- importance: "critical" | "high" | "medium" | "low"
- assessment: "strong" | "moderate" | "weak" | "none"
- evidenceType: "explicit" | "indirect" | "none"

Opportunity Context:
${oppSummary}

Candidate A Resume Evidence:
${textA}

Candidate B Resume Evidence:
${textB}
`.trim();
}


