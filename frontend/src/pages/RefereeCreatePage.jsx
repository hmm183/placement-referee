import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, FileText, UploadCloud, X, ArrowRight,
  AlertCircle, ChevronDown, ChevronUp, Link as LinkIcon,
  Sparkles, CheckCircle2, Globe, ListPlus
} from "lucide-react";
import { createSoloCase, fetchJobPostingUrl } from "../api/client.js";
import RefereeProcessingScreen from "../components/RefereeProcessingScreen.jsx";

const CONTEXT_OPTIONS = [
  "Campus placement",
  "Internship",
  "Off-campus",
  "Graduate hiring",
  "Lateral / Experienced",
];

export default function RefereeCreatePage() {
  const navigate = useNavigate();

  // Opportunity state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [context, setContext] = useState("Campus placement");

  // Optional metadata state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [university, setUniversity] = useState("");
  const [recruitmentYear, setRecruitmentYear] = useState("");
  const [location, setLocation] = useState("");
  const [jobId, setJobId] = useState("");
  const [placementCycle, setPlacementCycle] = useState("");

  // Job description input method state
  const [inputMethod, setInputMethod] = useState("description"); // "description" | "requirements" | "url"
  const [jobDescription, setJobDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlNotice, setUrlNotice] = useState("");

  // Candidate A Resume
  const [file, setFile] = useState(null);

  // Submission & Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted) => {
    if (accepted && accepted[0]) {
      setFile(accepted[0]);
      setErrorMsg("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: false,
  });

  const handleFetchUrl = async () => {
    if (!jobUrl || !jobUrl.startsWith("http")) {
      return setErrorMsg("Please enter a valid URL (starting with http:// or https://).");
    }
    setErrorMsg("");
    setUrlNotice("");
    setUrlFetching(true);
    try {
      const res = await fetchJobPostingUrl(jobUrl);
      if (res.data?.content) {
        setJobDescription(res.data.content);
        setUrlNotice("Successfully loaded text from job posting URL.");
      }
    } catch (err) {
      setUrlNotice("We couldn't retrieve the job posting. You can paste the job description instead.");
    } finally {
      setUrlFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim()) return setErrorMsg("Please enter the target company name.");
    if (!role.trim()) return setErrorMsg("Please enter the specific role or title.");
    
    // Determine effective job description
    let effectiveDescription = jobDescription.trim();
    if (inputMethod === "requirements") {
      effectiveDescription = requirementsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(", ");
    }
    if (!effectiveDescription) {
      return setErrorMsg("Please provide the job description or role requirements.");
    }
    if (!file) {
      return setErrorMsg("Please upload your resume (Candidate A).");
    }

    setErrorMsg("");
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("company", company.trim());
      formData.append("role", role.trim());
      formData.append("context", context);
      if (university.trim()) formData.append("university", university.trim());
      if (recruitmentYear.trim()) formData.append("recruitmentYear", recruitmentYear.trim());
      if (location.trim()) formData.append("location", location.trim());
      if (jobId.trim()) formData.append("jobId", jobId.trim());
      if (placementCycle.trim()) formData.append("placementCycle", placementCycle.trim());
      formData.append("jobInputMethod", inputMethod);
      formData.append("jobDescription", effectiveDescription);
      if (inputMethod === "url" && jobUrl.trim()) formData.append("jobUrl", jobUrl.trim());
      formData.append("resume", file);

      const res = await createSoloCase(formData);
      const createdCase = res.data;

      // Small transition delay so user sees final stage
      setTimeout(() => {
        navigate(`/referee/${createdCase._id}`);
      }, 1000);
    } catch (err) {
      setIsProcessing(false);
      setErrorMsg(err.message || "Failed to analyze referee case. Please try again.");
    }
  };

  if (isProcessing) {
    return (
      <div className="py-12">
        <RefereeProcessingScreen mode="solo" company={company} role={role} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono mb-2"
          style={{
            background: "rgba(94, 234, 212, 0.06)",
            borderColor: "rgba(94, 234, 212, 0.2)",
            color: "var(--signal)",
          }}
        >
          <Scale size={13} />
          <span>NEUTRAL PLACEMENT REFEREE</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--paper)" }}>
          Two candidates. One role. One neutral referee.
        </h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: "var(--mist)" }}>
          Don't ask who feels stronger. Ask what the evidence says for this exact placement opportunity.
        </p>
      </motion.div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl border text-sm text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: THE OPPORTUNITY */}
        <div className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                style={{ background: "var(--signal)", color: "var(--ink)" }}>1</span>
              <h2 className="font-display text-lg font-bold" style={{ color: "var(--paper)" }}>
                The Opportunity
              </h2>
            </div>
            <span className="font-mono text-xs" style={{ color: "var(--mist)" }}>
              Step 1 of 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-xs tracking-wider uppercase font-semibold" style={{ color: "var(--mist)" }}>
                Target Company <span style={{ color: "var(--signal)" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Google, Microsoft, Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border bg-black/40 text-sm focus:outline-none transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--paper)" }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs tracking-wider uppercase font-semibold" style={{ color: "var(--mist)" }}>
                Target Role <span style={{ color: "var(--signal)" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Backend Intern"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border bg-black/40 text-sm focus:outline-none transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--paper)" }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs tracking-wider uppercase font-semibold" style={{ color: "var(--mist)" }}>
              Recruitment Context
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setContext(opt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: context === opt ? "rgba(94, 234, 212, 0.12)" : "rgba(11, 14, 20, 0.5)",
                    borderColor: context === opt ? "var(--signal)" : "var(--line)",
                    color: context === opt ? "var(--signal)" : "var(--mist)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Optional context accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-80"
              style={{ color: "var(--signal)" }}
            >
              <span>{showAdvanced ? "Hide optional opportunity details" : "+ Add university, batch, location details"}</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-2 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px]" style={{ color: "var(--mist)" }}>University</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford / IIT"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-black/40 text-xs focus:outline-none"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px]" style={{ color: "var(--mist)" }}>Recruitment Year / Batch</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026 Batch"
                      value={recruitmentYear}
                      onChange={(e) => setRecruitmentYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-black/40 text-xs focus:outline-none"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px]" style={{ color: "var(--mist)" }}>Location / Cycle</label>
                    <input
                      type="text"
                      placeholder="e.g. Hybrid / Fall Cycle"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-black/40 text-xs focus:outline-none"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Job Requirements / Description input methods */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs tracking-wider uppercase font-semibold" style={{ color: "var(--mist)" }}>
                Role Requirements & Scope <span style={{ color: "var(--signal)" }}>*</span>
              </label>
              <div className="flex gap-1 border p-0.5 rounded-lg bg-black/40" style={{ borderColor: "var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setInputMethod("description")}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    inputMethod === "description" ? "bg-teal-400/20 text-teal-300 font-semibold" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Paste JD
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("requirements")}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    inputMethod === "requirements" ? "bg-teal-400/20 text-teal-300 font-semibold" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Manual Skills
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("url")}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    inputMethod === "url" ? "bg-teal-400/20 text-teal-300 font-semibold" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Job URL
                </button>
              </div>
            </div>

            {inputMethod === "description" && (
              <textarea
                rows={6}
                placeholder="Paste the full job description or core requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full p-4 rounded-xl border bg-black/40 text-sm focus:outline-none transition-colors leading-relaxed"
                style={{ borderColor: "var(--line)", color: "var(--paper)" }}
              />
            )}

            {inputMethod === "requirements" && (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  placeholder={"Enter key requirements (one per line or comma separated):\nJava / Distributed Systems\nSQL / Relational Databases\nREST APIs & Microservices\nData Structures & Algorithms"}
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="w-full p-4 rounded-xl border bg-black/40 text-sm focus:outline-none font-mono text-xs leading-relaxed"
                  style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--mist)" }}>
                  The referee will evaluate candidate evidence directly against these specific technical items.
                </span>
              </div>
            )}

            {inputMethod === "url" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe size={16} className="absolute left-3.5 top-3.5" style={{ color: "var(--mist)" }} />
                    <input
                      type="url"
                      placeholder="https://careers.google.com/jobs/results/..."
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-black/40 text-sm focus:outline-none"
                      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={urlFetching || !jobUrl}
                    className="px-4 py-2.5 rounded-xl border font-mono text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity"
                    style={{ borderColor: "var(--signal)", color: "var(--signal)" }}
                  >
                    {urlFetching ? "Retrieving..." : "Fetch Post"}
                  </button>
                </div>
                {urlNotice && (
                  <p className="text-xs" style={{ color: urlNotice.includes("couldn't") ? "#F59E0B" : "var(--signal)" }}>
                    {urlNotice}
                  </p>
                )}
                {jobDescription && (
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full p-3 rounded-xl border bg-black/40 text-xs focus:outline-none"
                    style={{ borderColor: "var(--line)", color: "var(--paper)" }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: YOUR EVIDENCE */}
        <div className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                style={{ background: "var(--signal)", color: "var(--ink)" }}>2</span>
              <h2 className="font-display text-lg font-bold" style={{ color: "var(--paper)" }}>
                Your Evidence (Candidate A)
              </h2>
            </div>
            <span className="font-mono text-xs" style={{ color: "var(--signal)" }}>
              Referee Subject
            </span>
          </div>

          <p className="text-sm" style={{ color: "var(--mist)" }}>
            Give the referee your evidence. The referee evaluates how your demonstrated projects and skills measure up against this specific opportunity.
          </p>

          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${
              isDragActive ? "border-teal-400 bg-teal-400/5" : "border-gray-700 hover:border-gray-500"
            }`}
            style={{ background: file ? "rgba(94, 234, 212, 0.03)" : "rgba(11, 14, 20, 0.4)" }}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-between p-4 rounded-xl border bg-black/40 max-w-md mx-auto" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-3 truncate">
                  <FileText size={24} style={{ color: "var(--signal)" }} />
                  <div className="text-left truncate">
                    <div className="text-sm font-semibold truncate">{file.name}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--mist)" }}>
                      {(file.size / 1024).toFixed(1)} KB • Candidate A
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="inline-flex p-4 rounded-2xl border bg-black/40" style={{ borderColor: "var(--line)" }}>
                  <UploadCloud size={28} style={{ color: "var(--signal)" }} />
                </div>
                <div>
                  <div className="text-base font-semibold" style={{ color: "var(--paper)" }}>
                    {isDragActive ? "Drop your resume file here" : "Upload your resume"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--mist)" }}>
                    PDF, DOCX, or TXT (up to 10MB)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border text-xs flex items-start gap-3"
            style={{ background: "rgba(94, 234, 212, 0.04)", borderColor: "rgba(94, 234, 212, 0.15)", color: "var(--paper)" }}>
            <Sparkles size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--signal)" }} />
            <div>
              <span className="font-semibold" style={{ color: "var(--signal)" }}>No second resume required: </span>
              You can get your own comprehensive referee assessment right now. You will have the option to add another candidate's resume later for an instant head-to-head comparison whenever you wish.
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!company || !role || !file}
            className="flex items-center gap-3 px-8 py-3.5 rounded-xl font-display font-bold text-base transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            style={{ background: "var(--signal)", color: "var(--ink)" }}
          >
            <span>Start Referee Assessment</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
