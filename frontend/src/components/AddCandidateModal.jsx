import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileText, AlertCircle, Scale, Loader2, ArrowRight } from "lucide-react";
import { addCandidateB } from "../api/client.js";

export default function AddCandidateModal({ isOpen, onClose, caseId, company, role, onComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      return setErrorMsg("Please select or drop Candidate B's resume.");
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await addCandidateB(caseId, formData, (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 90));
        }
      });

      setLoading(false);
      if (onComplete) {
        onComplete(res.data);
      }
      onClose();
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to compare candidates. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border p-6 overflow-hidden z-10 shadow-2xl"
          style={{
            background: "var(--void-2)",
            borderColor: "var(--line)",
            color: "var(--paper)",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: "var(--line)" }}>
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
                <h3 className="font-display font-bold text-lg" style={{ color: "var(--paper)" }}>
                  Want a Head-to-Head Call?
                </h3>
                <p className="text-xs" style={{ color: "var(--mist)" }}>
                  {company} • {role}
                </p>
              </div>
            </div>

            {!loading && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: "var(--mist)" }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: "var(--paper)" }}>
              Add another candidate's resume and the referee will compare the two of you directly for this exact opportunity.
            </p>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
                isDragActive ? "border-teal-400 bg-teal-400/5" : "border-gray-700 hover:border-gray-500"
              }`}
              style={{
                background: file ? "rgba(94, 234, 212, 0.03)" : "rgba(11, 14, 20, 0.4)",
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-black/40" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-center gap-3 truncate">
                    <FileText size={20} style={{ color: "var(--signal)" }} />
                    <div className="text-left truncate">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--mist)" }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  {!loading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="inline-flex p-3 rounded-xl border bg-black/40" style={{ borderColor: "var(--line)" }}>
                    <UploadCloud size={24} style={{ color: "var(--signal)" }} />
                  </div>
                  <div className="text-sm font-medium">
                    {isDragActive ? "Drop Candidate B's resume here" : "Drag & drop Candidate B's resume"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--mist)" }}>
                    PDF, DOCX, or TXT (up to 10MB)
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg border text-xs text-red-400 border-red-500/30 bg-red-500/10">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {loading && (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--signal)" }}>
                  <span className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Running head-to-head referee comparison...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: "var(--signal)" }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ color: "var(--mist)" }}
              >
                Keep my solo assessment
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "var(--signal)", color: "var(--ink)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Comparing...</span>
                  </>
                ) : (
                  <>
                    <span>Run Head-to-Head</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
