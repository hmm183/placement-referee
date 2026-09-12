import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale, Plus, ArrowRight, Trash2, Calendar,
  Building, Briefcase, User, Users, AlertCircle, Loader2
} from "lucide-react";
import { getRefereeCases, deleteRefereeCase } from "../api/client.js";
import AddCandidateModal from "../components/AddCandidateModal.jsx";

export default function RefereeHistoryPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedCaseForB, setSelectedCaseForB] = useState(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await getRefereeCases();
      setCases(res.data || []);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to load referee cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleDelete = async (e, caseId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this referee case record?")) return;
    try {
      await deleteRefereeCase(caseId);
      setCases((prev) => prev.filter((c) => c._id !== caseId));
    } catch (err) {
      alert(err.message || "Failed to delete case.");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl border" style={{ background: "var(--void-2)", borderColor: "var(--line)" }}>
          <Scale size={32} className="animate-pulse" style={{ color: "var(--signal)" }} />
        </div>
        <div className="font-display text-lg font-bold" style={{ color: "var(--paper)" }}>
          Loading Referee History...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: "var(--line)" }}>
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider mb-1" style={{ color: "var(--signal)" }}>
            <Scale size={14} />
            <span>RECORD ROOM</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--paper)" }}>
            Past Referee Cases
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--mist)" }}>
            Review past evidence calls or return to add Candidate B for an instant head-to-head comparison.
          </p>
        </div>

        <Link
          to="/referee"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110 shadow-lg"
          style={{ background: "var(--signal)", color: "var(--ink)" }}
        >
          <Plus size={16} />
          <span>New Referee Case</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl border text-sm text-red-400 border-red-500/30 bg-red-500/10">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {cases.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl p-8 space-y-4" style={{ borderColor: "var(--line)" }}>
          <div className="inline-flex p-4 rounded-2xl border bg-black/40" style={{ borderColor: "var(--line)" }}>
            <Scale size={32} style={{ color: "var(--signal)" }} />
          </div>
          <h3 className="font-display text-xl font-bold" style={{ color: "var(--paper)" }}>
            No Referee Cases Recorded
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--mist)" }}>
            Submit an opportunity and Candidate A's resume to receive your first impartial placement evidence evaluation.
          </p>
          <div className="pt-2">
            <Link
              to="/referee"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
              style={{ background: "var(--signal)", color: "var(--ink)" }}
            >
              <span>Start a Referee Case</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((c) => {
            const isH2H = c.mode === "head_to_head";
            const verdict = isH2H ? c.comparisonAnalysis?.verdict : c.soloAnalysis?.verdict;
            const formattedDate = new Date(c.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <motion.div
                key={c._id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/referee/${c._id}`)}
                className="p-5 rounded-2xl border cursor-pointer transition-all space-y-4 hover:border-teal-400/40"
                style={{ background: "var(--void-2)", borderColor: "var(--line)" }}
              >
                <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--line)" }}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-lg" style={{ color: "var(--paper)" }}>
                        {c.company}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          isH2H
                            ? "border-blue-500/30 text-blue-300 bg-blue-500/10"
                            : "border-teal-500/30 text-teal-300 bg-teal-500/10"
                        }`}
                      >
                        {isH2H ? "Head-to-Head" : "Solo Assessment"}
                      </span>
                    </div>
                    <div className="text-xs font-medium" style={{ color: "var(--mist)" }}>
                      {c.role} • <span className="font-mono">{c.context || "Campus placement"}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, c._id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                    title="Delete case record"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold" style={{ color: "var(--paper)" }}>
                    {verdict?.headline || (isH2H ? "Head-to-Head Call Completed" : "Evidence Assessment Completed")}
                  </div>
                  {verdict?.summary && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--mist)" }}>
                      {verdict.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs font-mono" style={{ borderColor: "var(--line)", color: "var(--mist)" }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isH2H && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCaseForB(c);
                        }}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-teal-500/40 text-teal-300 hover:bg-teal-500/10 transition-colors"
                      >
                        + Add Candidate B
                      </button>
                    )}
                    <span className="flex items-center text-teal-300 font-semibold group-hover:translate-x-0.5 transition-transform">
                      View <ArrowRight size={13} className="ml-1" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Candidate B Modal */}
      {selectedCaseForB && (
        <AddCandidateModal
          isOpen={!!selectedCaseForB}
          onClose={() => setSelectedCaseForB(null)}
          caseId={selectedCaseForB._id}
          company={selectedCaseForB.company}
          role={selectedCaseForB.role}
          onComplete={(updatedCase) => {
            navigate(`/referee/${updatedCase._id}`);
          }}
        />
      )}
    </div>
  );
}
