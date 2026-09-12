import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, Loader2, Sparkles, Scale, FileText, Search } from "lucide-react";

const SOLO_STAGES = [
  { id: "read", label: "Reading your resume", detail: "Extracting verified experiences, coursework, and technical skills..." },
  { id: "role", label: "Understanding the role", detail: "Parsing core responsibilities and priority company requirements..." },
  { id: "map", label: "Mapping requirements", detail: "Categorizing into critical, high, and medium priority competencies..." },
  { id: "evidence", label: "Checking evidence", detail: "Distinguishing explicit production proof from indirect mentions..." },
  { id: "calibrate", label: "Calibrating uncertainty", detail: "Identifying what the referee cannot observe (live coding, interviews)..." },
  { id: "verdict", label: "Preparing referee assessment", detail: "Synthesizing decisive strengths, gaps, and calibrated role-fit..." },
];

const HEAD_TO_HEAD_STAGES = [
  { id: "cand_a", label: "Reading Candidate A evidence", detail: "Analyzing verified competencies and projects for Candidate A..." },
  { id: "cand_b", label: "Reading Candidate B evidence", detail: "Analyzing verified competencies and projects for Candidate B..." },
  { id: "reqs", label: "Aligning role requirements", detail: "Establishing identical evaluation criteria for this specific role..." },
  { id: "compare", label: "Comparing evidence side-by-side", detail: "Conducting pairwise assessment across critical and high-priority skills..." },
  { id: "differences", label: "Identifying decisive differences", detail: "Isolating 2-5 meaningful differences from minor nuances..." },
  { id: "significance", label: "Checking if gap is significant", detail: "Testing whether difference justifies an edge or is too close to call..." },
  { id: "call", label: "Preparing the referee's call", detail: "Finalizing impartial verdict, reasoning, and uncertainty notes..." },
];

export default function RefereeProcessingScreen({ mode = "solo", company, role }) {
  const stages = mode === "head_to_head" ? HEAD_TO_HEAD_STAGES : SOLO_STAGES;
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [stages.length]);

  const activeStage = stages[currentStageIdx];
  const progressPercent = Math.min(95, Math.round(((currentStageIdx + 1) / stages.length) * 95));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-2xl mx-auto p-8 rounded-2xl border relative overflow-hidden backdrop-blur-xl"
      style={{
        background: "rgba(17, 22, 35, 0.85)",
        borderColor: "var(--line)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      }}
    >
      {/* Background ambient glow */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: "var(--signal)" }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full pointer-events-none opacity-10 blur-3xl"
        style={{ background: "#3B82F6" }}
      />

      {/* Header Badge */}
      <div className="flex items-center justify-between pb-6 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              background: "rgba(94, 234, 212, 0.08)",
              borderColor: "rgba(94, 234, 212, 0.3)",
              color: "var(--signal)",
            }}
          >
            <Scale size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-wider uppercase font-semibold" style={{ color: "var(--signal)" }}>
                PLACEMENT REFEREE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <h2 className="font-display text-lg font-bold" style={{ color: "var(--paper)" }}>
              {mode === "head_to_head" ? "Evaluating Head-to-Head Call" : "Conducting Solo Evidence Review"}
            </h2>
          </div>
        </div>

        <div className="text-right font-mono text-xs" style={{ color: "var(--mist)" }}>
          <div className="font-medium" style={{ color: "var(--paper)" }}>{company}</div>
          <div>{role}</div>
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="py-10 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl border relative mb-2" style={{ background: "rgba(11,14,20,0.6)", borderColor: "var(--line)" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--signal)" }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <h3 className="font-display text-2xl font-bold" style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}>
              {activeStage.label}
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--mist)" }}>
              {activeStage.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="max-w-md mx-auto pt-4 space-y-2">
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--signal), #38BDF8)" }}
              initial={{ width: "10%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between font-mono text-[11px]" style={{ color: "var(--mist)" }}>
            <span>Stage {currentStageIdx + 1} of {stages.length}</span>
            <span>Impartial evidence review in progress</span>
          </div>
        </div>
      </div>

      {/* Stage Checklist */}
      <div className="pt-4 border-t space-y-2" style={{ borderColor: "var(--line)" }}>
        <div className="font-mono text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--mist)" }}>
          Referee Protocol Checklist
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <div
                key={stage.id}
                className="flex items-center gap-2.5 p-2 rounded-lg border text-xs transition-colors"
                style={{
                  background: isCurrent ? "rgba(94, 234, 212, 0.05)" : "transparent",
                  borderColor: isCurrent ? "rgba(94, 234, 212, 0.3)" : "rgba(38, 44, 59, 0.4)",
                  color: isCompleted ? "var(--paper)" : isCurrent ? "var(--signal)" : "var(--mist)",
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={13} style={{ color: "var(--signal)" }} />
                ) : isCurrent ? (
                  <Loader2 size={13} className="animate-spin" style={{ color: "var(--signal)" }} />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-600 opacity-50" />
                )}
                <span className="truncate">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center text-xs font-mono" style={{ color: "var(--mist)" }}>
        🔒 Evaluates verifiable evidence only • Zero hallucinations • Impartial comparison
      </div>
    </motion.div>
  );
}
