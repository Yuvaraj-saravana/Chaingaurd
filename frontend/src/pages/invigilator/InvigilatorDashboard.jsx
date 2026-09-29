import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  Eye, 
  AlertTriangle,
  X,
  FileCode,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import IntegrityAuditModal from '../../components/integrity/IntegrityAuditModal';

export default function InvigilatorDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPaper, setSelectedPaper] = useState(null);
  const [auditPaper, setAuditPaper] = useState(null);
  const [accessGrant, setAccessGrant] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch examination schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    const interval = setInterval(fetchExams, 15000); // Poll schedule state every 15s
    return () => clearInterval(interval);
  }, []);

  const getWindowStatus = (startTime, endTime) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (now < start) {
      const remainingSeconds = Math.ceil((start - now) / 1000);
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      return {
        state: 'PREMATURE',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: `LOCKED 🔒 (Starts in ${mins}m ${secs}s)`,
        isAccessAllowed: false
      };
    } else if (now > end) {
      return {
        state: 'EXPIRED',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        label: 'CLOSED 🔴 (Exam Window Concluded)',
        isAccessAllowed: false
      };
    } else {
      return {
        state: 'ACTIVE',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        label: 'AVAILABLE 🟢 (Release Window Open)',
        isAccessAllowed: true
      };
    }
  };

  const handleRequestAccess = async (paper) => {
    setSelectedPaper(paper);
    setAccessGrant(null);
    setAccessError(null);
    setAccessLoading(true);

    try {
      const res = await api.post(`/papers/${paper.id}/access`);
      if (res.data.success) {
        setAccessGrant(res.data.accessGrant);
      }
    } catch (err) {
      const data = err.response?.data;
      setAccessError({
        code: data?.code || 'ACCESS_DENIED',
        message: data?.message || 'Access denied by server time-lock gate.'
      });
    } finally {
      setAccessLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            EXAMINATION INVIGILATOR WORKSPACE
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Time-Locked Secure Paper Access Gate
          </h2>
          <p className="text-xs text-slate-400">
            Access authorized examination papers strictly during the scheduled exam release window.
          </p>
        </div>

        <button
          onClick={fetchExams}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 disabled:opacity-50"
          title="Refresh Schedule"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scheduled Exams Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Today's Examination Sessions ({exams.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Server Enforced Time-Locking</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400 mb-2" />
            Loading exam schedules...
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No active exam sessions scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((exam) => {
              const windowInfo = getWindowStatus(exam.startTime, exam.endTime);
              const paper = exam.questionPapers && exam.questionPapers[0];

              return (
                <div key={exam.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400">{exam.examCode}</span>
                      <h4 className="font-bold text-white text-base">{exam.title}</h4>
                      <p className="text-xs text-slate-400">{exam.course} ({exam.semester})</p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${windowInfo.badge}`}>
                      {windowInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Start Release Window:</span>
                      <span className="text-sky-300 font-bold">{new Date(exam.startTime).toLocaleTimeString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">End Release Window:</span>
                      <span className="text-amber-300 font-bold">{new Date(exam.endTime).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {paper ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400">Paper: </span>
                          <span className="font-bold text-white">{paper.subjectCode}</span> - <span className="text-slate-300">{paper.title}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {paper.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => setAuditPaper(paper)}
                          className="sm:col-span-1 py-2.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 text-xs font-semibold border border-emerald-800/40 flex items-center justify-center space-x-1"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>SHA-256 Audit</span>
                        </button>
                        <button
                          onClick={() => handleRequestAccess(paper)}
                          className={`sm:col-span-2 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                            windowInfo.isAccessAllowed 
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {windowInfo.isAccessAllowed ? (
                            <>
                              <Unlock className="h-4 w-4 text-emerald-300" />
                              <span>Access Paper</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 text-amber-400" />
                              <span>Attempt Access (Time-Locked)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-xs text-slate-500 italic bg-slate-950 rounded-xl border border-slate-800">
                      No question paper linked to this session yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Access Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">{selectedPaper.subjectCode}</span>
                <h3 className="font-bold text-white text-lg">{selectedPaper.title}</h3>
                <p className="text-xs text-slate-400">Invigilator Access Request</p>
              </div>
              <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {accessLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400" />
                <p>Evaluating server time-lock gate & verifying SHA-256 integrity...</p>
              </div>
            ) : accessError ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-rose-400 text-sm">
                    <Lock className="h-4 w-4" />
                    <span>{accessError.code}</span>
                  </div>
                  <p>{accessError.message}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Audit Trail Logged</span>
                  </div>
                  <p>
                    This unauthorized/premature access attempt has been logged in the audit trail and flagged for administrative investigation.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedPaper(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : accessGrant ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-300">ACCESS GRANTED</h4>
                    <p>{accessGrant.message || 'Time-lock window active. Paper decrypted in RAM memory.'}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">Integrity Status:</span>
                    <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {accessGrant.integrityStatus}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">Paper Title:</span>
                    <span className="text-white font-bold">{accessGrant.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">SHA-256 Hash Verified:</span>
                    <span className="text-emerald-400 break-all bg-slate-900 p-2 rounded block text-[11px]">
                      {accessGrant.fileSha256Hash}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex items-center space-x-1.5 text-sky-400 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Controlled Document Streamer Active</span>
                  </div>
                  <p>
                    Paper payload decrypted in-memory. Dynamic Invigilator watermark will be applied during Phase 16.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedPaper(null)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/30"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Integrity Audit Modal */}
      {auditPaper && (
        <IntegrityAuditModal
          paper={auditPaper}
          onClose={() => setAuditPaper(null)}
          onRefresh={() => fetchExams()}
        />
      )}
    </div>
  );
}
