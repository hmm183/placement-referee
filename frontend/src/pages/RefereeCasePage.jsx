import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, ArrowLeft, Plus, CheckCircle2, AlertCircle,
  HelpCircle, ShieldCheck, Zap, Sparkles, ChevronRight,
  Printer, User, Users, Info, Award, AlertTriangle, Filter
} from "lucide-react";
import { getRefereeCase } from "../api/client.js";
import AddCandidateModal from "../components/AddCandidateModal.jsx";

const FIT_COLORS = {
  strong: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Strong Evidence" },
  good: { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30", label: "Good Evidence" },
  moderate: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Moderate Evidence" },
  weak: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "Weak Evidence" },
  insufficient: { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", label: "Insufficient Evidence" },
};

const EVIDENCE_TYPE_BADGES = {
  explicit: { label: "Explicit Proof", style: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" },
  indirect: { label: "Indirect Mention", style: "text-amber-400 bg-amber-400/10 border-amber-500/30" },
  none: { label: "No Evidence Found", style: "text-gray-400 bg-gray-500/10 border-gray-500/30" },
};

export default function RefereeCasePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [refereeCase, setRefereeCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    const fetchCase = async () => {
      try {
        setLoading(true);
        const res = await getRefereeCase(id);
        if (mounted) {
          setRefereeCase(res.data);
          setErrorMsg("");
        }
      } catch (err) {
        if (mounted) {
          setErrorMsg(err.message || "Failed to load referee case.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCase();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl border" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
          <Scale size={32} className="animate-pulse" style={{ color: "var(--signal)" }} />
        </div>
        <div className="font-display text-lg font-bold" style={{ color: "var(--paper)" }}>
          Retrieving Referee Record...
        </div>
        <p className="text-xs font-mono" style={{ color: "var(--mist)" }}>
          Loading persisted case from database
        </p>
      </div>
    );
  }

  if (errorMsg || !refereeCase) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl border text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--paper)" }}>
          Case Not Found
        </h2>
        <p className="text-sm" style={{ color: "var(--mist)" }}>
          {errorMsg || "The requested referee case does not exist or you do not have permission to view it."}
        </p>
        <Link
          to="/referee"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
          style={{ background: "var(--signal)", color: "var(--ink)" }}
        >
          <ArrowLeft size={16} />
          <span>Create New Referee Case</span>
        </Link>
      </div>
    );
  }

  const isHeadToHead = refereeCase.mode === "head_to_head" && refereeCase.comparisonAnalysis;
  const solo = refereeCase.soloAnalysis || {};
  const h2h = refereeCase.comparisonAnalysis || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-3">
          <Link
            to="/referee/history"
            className="p-2 rounded-lg border hover:opacity-80 transition-opacity"
            style={{ borderColor: "var(--line)", color: "var(--mist)" }}
            title="Back to Case History"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--signal)" }}>
                {isHeadToHead ? "HEAD-TO-HEAD REFEREE CALL" : "SOLO REFEREE ASSESSMENT"}
              </span>
              <span>•</span>
              <span style={{ color: "var(--mist)" }}>{refereeCase.context || "Campus placement"}</span>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: "var(--paper)" }}>
              {refereeCase.company} — <span style={{ color: "var(--mist)" }}>{refereeCase.role}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isHeadToHead && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
              style={{
                background: "rgba(94, 234, 212, 0.1)",
                borderColor: "var(--signal)",
                color: "var(--signal)",
              }}
            >
              <Plus size={14} />
              <span>Add Candidate B</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono hover:opacity-80 transition-opacity"
            style={{ borderColor: "var(--line)", color: "var(--mist)" }}
            title="Print or Save PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODE A: SOLO REFEREE DISPLAY                                             */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {!isHeadToHead && (
        <div className="space-y-8">
          {/* Main Verdict Card */}
          <div
            className="p-6 sm:p-8 rounded-2xl border relative overflow-hidden"
            style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: "var(--line)" }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs" style={{ color: "var(--mist)" }}>
                  <Scale size={14} style={{ color: "var(--signal)" }} />
                  <span>THE REFEREE'S ASSESSMENT</span>
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--paper)" }}>
                  {solo.verdict?.headline || "Evidence Review Completed"}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {solo.verdict?.fitLevel && (
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                      FIT_COLORS[solo.verdict.fitLevel]?.bg || "bg-teal-500/10"
                    } ${FIT_COLORS[solo.verdict.fitLevel]?.text || "text-teal-300"} ${
                      FIT_COLORS[solo.verdict.fitLevel]?.border || "border-teal-500/30"
                    }`}
                  >
                    {FIT_COLORS[solo.verdict.fitLevel]?.label || solo.verdict.fitLevel}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-mono border" style={{ borderColor: "var(--line)", color: "var(--mist)" }}>
                  Confidence: <span className="capitalize font-semibold text-white">{solo.verdict?.confidence || "Moderate"}</span>
                </span>
              </div>
            </div>

            <div className="py-5 text-sm sm:text-base leading-relaxed" style={{ color: "var(--paper)" }}>
              {solo.verdict?.summary}
            </div>

            <div className="pt-4 border-t flex items-start gap-2 text-xs font-mono" style={{ borderColor: "var(--line)", color: "var(--mist)" }}>
              <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--signal)" }} />
              <span>{solo.verdict?.disclaimer || "This is an impartial assessment of submitted evidence, not a prediction of the company's hiring decision."}</span>
            </div>
          </div>

          {/* "WANT A HEAD-TO-HEAD CALL?" BANNER */}
          <div
            className="p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(94, 234, 212, 0.05), rgba(59, 130, 246, 0.05))",
              borderColor: "rgba(94, 234, 212, 0.25)",
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users size={18} style={{ color: "var(--signal)" }} />
                <h3 className="font-display font-bold text-base" style={{ color: "var(--paper)" }}>
                  Want a head-to-head call?
                </h3>
              </div>
              <p className="text-xs sm:text-sm max-w-xl" style={{ color: "var(--mist)" }}>
                Add another candidate's resume and the referee will compare the two of you directly for this exact opportunity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 shadow-md"
                style={{ background: "var(--signal)", color: "var(--ink)" }}
              >
                <Plus size={16} />
                <span>Add Candidate B</span>
              </button>
            </div>
          </div>

          {/* WHAT YOU ALREADY PROVE */}
          {solo.candidateA?.whatAlreadyProves?.length > 0 && (
            <div className="p-6 rounded-2xl border space-y-4" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--signal)" }}>
                <CheckCircle2 size={15} />
                <span>What You Already Prove</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {solo.candidateA.whatAlreadyProves.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border text-sm flex items-start gap-2.5"
                    style={{ background: "rgba(11,14,20,0.4)", borderColor: "var(--line)", color: "var(--paper)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--signal)" }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WHERE YOU'RE STRONG VS WHERE EVIDENCE IS WEAK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 rounded-2xl border space-y-4" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald-400">
                <Award size={16} />
                <span>Where You're Strong</span>
              </div>
              <div className="space-y-3">
                {solo.candidateA?.strengths?.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl border space-y-1.5 bg-black/40" style={{ borderColor: "var(--line)" }}>
                    <div className="font-semibold text-sm text-emerald-300">{s.area || s.text}</div>
                    <div className="text-xs" style={{ color: "var(--paper)" }}>{s.evidence}</div>
                    {s.relevance && (
                      <div className="text-[11px] font-mono" style={{ color: "var(--mist)" }}>
                        Why it matters: {s.relevance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps / Weaknesses */}
            <div className="p-6 rounded-2xl border space-y-4" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-400">
                <AlertTriangle size={16} />
                <span>Where Evidence is Weak or Absent</span>
              </div>
              <div className="space-y-3">
                {solo.candidateA?.weaknesses?.map((w, idx) => (
                  <div key={idx} className="p-4 rounded-xl border space-y-1.5 bg-black/40" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-amber-300">{w.gap}</div>
                      {w.impact && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-amber-500/30 text-amber-400">
                          {w.impact} impact
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "var(--mist)" }}>{w.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REQUIREMENT-BY-REQUIREMENT BREAKDOWN */}
          <div className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--line)" }}>
              <div>
                <h3 className="font-display font-bold text-lg" style={{ color: "var(--paper)" }}>
                  Requirement-by-Requirement Evidence Mapping
                </h3>
                <p className="text-xs" style={{ color: "var(--mist)" }}>
                  Categorized by role priority and verified against submitted resume proof.
                </p>
              </div>

              {/* Priority Filters */}
              <div className="flex items-center gap-1 border p-0.5 rounded-lg bg-black/40 text-xs font-mono" style={{ borderColor: "var(--line)" }}>
                {["all", "critical", "high", "medium"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      priorityFilter === p ? "bg-teal-400/20 text-teal-300 font-semibold" : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {solo.requirementBreakdown
                ?.filter((r) => priorityFilter === "all" || r.priority?.toLowerCase() === priorityFilter)
                .map((req, idx) => {
                  const evType = req.evidenceType?.toLowerCase() || "none";
                  const badge = EVIDENCE_TYPE_BADGES[evType] || EVIDENCE_TYPE_BADGES.none;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border space-y-2 bg-black/30 transition-all hover:border-gray-600"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                              req.priority === "critical"
                                ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                : req.priority === "high"
                                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                : "border-gray-600 text-gray-400"
                            }`}
                          >
                            {req.priority || "Standard"} Priority
                          </span>
                          <span className="font-semibold text-sm" style={{ color: "var(--paper)" }}>
                            {req.requirement}
                          </span>
                        </div>

                        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="text-xs space-y-1" style={{ color: "var(--paper)" }}>
                        <div><strong className="text-gray-400 font-mono">Found: </strong>{req.evidenceFound || "None"}</div>
                        {req.missingEvidence && (
                          <div className="text-gray-400">
                            <strong className="text-gray-500 font-mono">Missing: </strong>{req.missingEvidence}
                          </div>
                        )}
                      </div>

                      {req.relevance && (
                        <div className="text-[11px] font-mono pt-1 text-gray-500">
                          Why this matters: {req.relevance}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* WHAT ACTUALLY MATTERS VS WHAT YOU SHOULDN'T OVERTHINK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* What Actually Matters */}
            <div className="p-6 rounded-2xl border space-y-3" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--signal)" }}>
                🎯 What Actually Matters
              </div>
              <p className="text-xs" style={{ color: "var(--mist)" }}>
                The few core capabilities that genuinely affect hiring consideration for this role.
              </p>
              <ul className="space-y-2 pt-2">
                {solo.whatActuallyMatters?.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2 text-white">
                    <span className="text-teal-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What You Shouldn't Overthink */}
            <div
              className="p-6 rounded-2xl border space-y-3"
              style={{ background: "rgba(11, 14, 20, 0.6)", borderColor: "var(--line)" }}
            >
              <div className="font-mono text-xs uppercase tracking-wider font-semibold text-gray-400">
                🧘 What You Shouldn't Overthink
              </div>
              <p className="text-xs" style={{ color: "var(--mist)" }}>
                Things unlikely to make a meaningful difference. Don't obsess over these.
              </p>
              <ul className="space-y-2 pt-2">
                {solo.whatShouldntOverthink?.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "var(--mist)" }}>
                    <span className="text-gray-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* WHAT COULD CHANGE ASSESSMENT & REALISTIC OPPORTUNITIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border space-y-3" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--paper)" }}>
                ⚡ What Could Change The Assessment
              </div>
              <ul className="space-y-2">
                {solo.whatCouldChangeAssessment?.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "var(--mist)" }}>
                    <span className="text-amber-400">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl border space-y-3" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--signal)" }}>
                🚀 Realistic Opportunities
              </div>
              <ul className="space-y-2">
                {solo.candidateA?.realisticOpportunities?.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "var(--paper)" }}>
                    <span className="text-teal-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* WHAT THE REFEREE DOESN'T KNOW & FAIRNESS STATEMENT */}
          <div className="p-6 rounded-2xl border space-y-3 text-xs font-mono" style={{ background: "rgba(11,14,20,0.5)", borderColor: "var(--line)", color: "var(--mist)" }}>
            <div className="text-gray-300 font-bold uppercase tracking-wider">
              ⚖️ What The Referee Does Not Observe
            </div>
            <p>
              The referee has not observed your live coding assessment, system design under time pressure, or behavioral communication. Those live components can significantly influence company decisions.
            </p>
            <p className="text-[11px] text-gray-500 pt-1 border-t" style={{ borderColor: "var(--line)" }}>
              Fairness: {solo.fairnessNote || "Assessment is strictly evidence-based against stated requirements without inferring protected attributes."}
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MODE B: HEAD-TO-HEAD REFEREE CALL                                        */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {isHeadToHead && (
        <div className="space-y-8">
          {/* THE REFEREE'S CALL CARD */}
          <div
            className="p-6 sm:p-8 rounded-2xl border relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(17, 22, 35, 0.95), rgba(11, 14, 20, 0.98))",
              borderColor: "var(--signal)",
              boxShadow: "0 0 35px rgba(94, 234, 212, 0.08)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: "var(--line)" }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs" style={{ color: "var(--signal)" }}>
                  <Scale size={16} />
                  <span>THE REFEREE'S CALL</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--paper)" }}>
                  {h2h.verdict?.headline || "Comparative Call Finalized"}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                    h2h.verdict?.winner === "candidate_a"
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                      : h2h.verdict?.winner === "candidate_b"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {h2h.verdict?.winner === "tie"
                    ? "Too Close To Call (Tie)"
                    : h2h.verdict?.winner === "candidate_a"
                    ? "Candidate A Edge"
                    : h2h.verdict?.winner === "candidate_b"
                    ? "Candidate B Edge"
                    : "Calibrated Verdict"}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-mono border" style={{ borderColor: "var(--line)", color: "var(--mist)" }}>
                  Confidence: <span className="capitalize font-semibold text-white">{h2h.verdict?.confidence || "Moderate"}</span>
                </span>
              </div>
            </div>

            <div className="py-6 text-sm sm:text-base leading-relaxed" style={{ color: "var(--paper)" }}>
              {h2h.verdict?.summary}
            </div>

            <div className="pt-4 border-t flex items-start gap-2 text-xs font-mono" style={{ borderColor: "var(--line)", color: "var(--mist)" }}>
              <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--signal)" }} />
              <span>{h2h.verdict?.disclaimer || "This is an impartial comparison of submitted evidence, not a prediction of the company's final decision."}</span>
            </div>
          </div>

          {/* SIDE-BY-SIDE CANDIDATE PROFILE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate A Card */}
            <div
              className={`p-6 rounded-2xl border space-y-4 ${
                h2h.verdict?.winner === "candidate_a" ? "border-teal-400/40 bg-teal-500/[0.03]" : ""
              }`}
              style={{ background: "var(--void-2)", borderColor: h2h.verdict?.winner === "candidate_a" ? undefined : "var(--line)" }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-2">
                  <User size={18} style={{ color: "var(--signal)" }} />
                  <div>
                    <h3 className="font-display font-bold text-base" style={{ color: "var(--paper)" }}>
                      {h2h.candidateA?.name || "Candidate A"} (You)
                    </h3>
                    <span className="text-[11px] font-mono" style={{ color: "var(--mist)" }}>
                      {refereeCase.candidateAResumeId?.filename}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-bold ${
                    FIT_COLORS[h2h.candidateA?.overallFit]?.text || "text-teal-300"
                  }`}
                >
                  {h2h.candidateA?.overallFit || "Analyzed"} Fit
                </span>
              </div>

              {h2h.candidateA?.keyEdgeAreas?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase font-semibold text-teal-300">Demonstrated Edges:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {h2h.candidateA.keyEdgeAreas.map((e, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md text-xs bg-teal-500/10 border border-teal-500/30 text-teal-300">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase text-gray-400">Noted Strengths:</span>
                <ul className="space-y-1 text-xs" style={{ color: "var(--paper)" }}>
                  {h2h.candidateA?.strengths?.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-400">•</span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Candidate B Card */}
            <div
              className={`p-6 rounded-2xl border space-y-4 ${
                h2h.verdict?.winner === "candidate_b" ? "border-blue-400/40 bg-blue-500/[0.03]" : ""
              }`}
              style={{ background: "var(--void-2)", borderColor: h2h.verdict?.winner === "candidate_b" ? undefined : "var(--line)" }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-blue-400" />
                  <div>
                    <h3 className="font-display font-bold text-base" style={{ color: "var(--paper)" }}>
                      {h2h.candidateB?.name || "Candidate B"}
                    </h3>
                    <span className="text-[11px] font-mono" style={{ color: "var(--mist)" }}>
                      {refereeCase.candidateBResumeId?.filename}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-bold ${
                    FIT_COLORS[h2h.candidateB?.overallFit]?.text || "text-blue-300"
                  }`}
                >
                  {h2h.candidateB?.overallFit || "Analyzed"} Fit
                </span>
              </div>

              {h2h.candidateB?.keyEdgeAreas?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase font-semibold text-blue-300">Demonstrated Edges:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {h2h.candidateB.keyEdgeAreas.map((e, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase text-gray-400">Noted Strengths:</span>
                <ul className="space-y-1 text-xs" style={{ color: "var(--paper)" }}>
                  {h2h.candidateB?.strengths?.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-400">•</span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* WHAT ACTUALLY DECIDED IT (2 TO 5 DECISIVE DIFFERENCES) */}
          <div className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--signal)" }}>
                <Award size={16} />
                <span>What Actually Decided It</span>
              </div>
              <h3 className="font-display font-bold text-xl mt-1" style={{ color: "var(--paper)" }}>
                The Decisive Differences
              </h3>
              <p className="text-xs" style={{ color: "var(--mist)" }}>
                Meaningful evidence gaps that directly separated the candidates for this specific role.
              </p>
            </div>

            <div className="space-y-4">
              {h2h.decisiveDifferences?.map((diff, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border space-y-3 bg-black/40"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--paper)" }}>
                      <span className="font-mono text-xs text-teal-400">0{idx + 1} —</span>
                      <span>{diff.difference}</span>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                        diff.edge === "candidate_a"
                          ? "border-teal-500/40 text-teal-300 bg-teal-500/10"
                          : diff.edge === "candidate_b"
                          ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
                          : "border-gray-500 text-gray-300"
                      }`}
                    >
                      {diff.edge === "candidate_a"
                        ? "Edge: Candidate A"
                        : diff.edge === "candidate_b"
                        ? "Edge: Candidate B"
                        : "Edge: Tie / Balanced"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg border bg-black/30 space-y-1" style={{ borderColor: "var(--line)" }}>
                      <span className="font-mono font-semibold text-teal-400">Candidate A Evidence:</span>
                      <p style={{ color: "var(--paper)" }}>{diff.candidateAEvidence}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-black/30 space-y-1" style={{ borderColor: "var(--line)" }}>
                      <span className="font-mono font-semibold text-blue-400">Candidate B Evidence:</span>
                      <p style={{ color: "var(--paper)" }}>{diff.candidateBEvidence}</p>
                    </div>
                  </div>

                  <div className="text-xs font-mono" style={{ color: "var(--mist)" }}>
                    <strong className="text-gray-300">Why it matters: </strong>
                    {diff.whyItMatters}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REQUIREMENT-BY-REQUIREMENT COMPARISON MATRIX */}
          <div className="p-6 sm:p-8 rounded-2xl border space-y-6" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
            <div>
              <h3 className="font-display font-bold text-xl" style={{ color: "var(--paper)" }}>
                Requirement-by-Requirement Comparison Matrix
              </h3>
              <p className="text-xs" style={{ color: "var(--mist)" }}>
                Detailed side-by-side evidence analysis mapped to role requirements.
              </p>
            </div>

            <div className="space-y-3">
              {h2h.requirementComparison?.map((req, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border space-y-3 bg-black/30"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          req.importance === "critical"
                            ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                            : req.importance === "high"
                            ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                            : "border-gray-600 text-gray-400"
                        }`}
                      >
                        {req.importance || "Standard"}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: "var(--paper)" }}>
                        {req.requirement}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                        req.edge === "candidate_a"
                          ? "border-teal-500/30 text-teal-300 bg-teal-500/10"
                          : req.edge === "candidate_b"
                          ? "border-blue-500/30 text-blue-300 bg-blue-500/10"
                          : "border-gray-600 text-gray-400"
                      }`}
                    >
                      {req.edge === "candidate_a"
                        ? "Edge: Candidate A"
                        : req.edge === "candidate_b"
                        ? "Edge: Candidate B"
                        : "Tie / Equal"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border bg-black/40 space-y-1" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-teal-400 font-semibold">Candidate A</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5">
                          {req.candidateA?.assessment} ({req.candidateA?.evidenceType})
                        </span>
                      </div>
                      <p style={{ color: "var(--paper)" }}>{req.candidateA?.evidence || "No evidence found"}</p>
                    </div>

                    <div className="p-3 rounded-lg border bg-black/40 space-y-1" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-400 font-semibold">Candidate B</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5">
                          {req.candidateB?.assessment} ({req.candidateB?.evidenceType})
                        </span>
                      </div>
                      <p style={{ color: "var(--paper)" }}>{req.candidateB?.evidence || "No evidence found"}</p>
                    </div>
                  </div>

                  {req.whyItMatters && (
                    <div className="text-[11px] font-mono text-gray-400 pt-1">
                      Importance Context: {req.whyItMatters}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WHAT NEITHER SHOULD OVERTHINK & WHAT COULD CHANGE THE CALL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* What Neither Candidate Should Overthink */}
            <div
              className="p-6 rounded-2xl border space-y-3"
              style={{ background: "rgba(11, 14, 20, 0.6)", borderColor: "var(--line)" }}
            >
              <div className="font-mono text-xs uppercase tracking-wider font-semibold text-gray-300">
                🧘 What Neither Candidate Should Overthink
              </div>
              <p className="text-xs" style={{ color: "var(--mist)" }}>
                Differences that exist but probably do not meaningfully separate the candidates for this role.
              </p>
              <ul className="space-y-2 pt-2">
                {h2h.whatNeitherShouldOverthink?.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "var(--mist)" }}>
                    <span className="text-gray-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What Could Change The Call */}
            <div className="p-6 rounded-2xl border space-y-3" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="font-mono text-xs uppercase tracking-wider font-semibold text-amber-300">
                ⚡ What Could Change The Call
              </div>
              <p className="text-xs" style={{ color: "var(--mist)" }}>
                Critical unknown factors outside of the submitted resumes.
              </p>
              <ul className="space-y-2 pt-2">
                {h2h.whatCouldChangeTheCall?.map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "var(--paper)" }}>
                    <span className="text-amber-400">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FINAL REFEREE REASONING & FAIRNESS */}
          {h2h.reasoning && (
            <div className="p-6 sm:p-8 rounded-2xl border space-y-4" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
              <div className="font-mono text-xs uppercase tracking-wider text-gray-400">
                Impartial Referee Summary
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--paper)" }}>
                {h2h.reasoning}
              </p>
              <div className="pt-3 border-t text-[11px] font-mono text-gray-500" style={{ borderColor: "var(--line)" }}>
                {h2h.fairnessNote || "Both candidates were evaluated strictly against identical criteria derived from the stated role requirements, without assumptions or bias."}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Candidate B Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        caseId={refereeCase._id}
        company={refereeCase.company}
        role={refereeCase.role}
        onComplete={(updatedCase) => {
          setRefereeCase(updatedCase);
        }}
      />
    </div>
  );
}
