import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Layers,
  UserCheck,
  Calendar,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import api from '../../services/api';
import CreateExamModal from '../../components/controller/CreateExamModal';
import IntegrityAuditModal from '../../components/integrity/IntegrityAuditModal';

export default function ControllerDashboard() {
  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [auditPaper, setAuditPaper] = useState(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [linkingExamId, setLinkingExamId] = useState('');
  const [linkingPaperId, setLinkingPaperId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [papersRes, examsRes] = await Promise.all([
        api.get('/papers'),
        api.get('/exams')
      ]);

      if (papersRes.data.success) {
        setPapers(papersRes.data.papers);
      }
      if (examsRes.data.success) {
        setExams(examsRes.data.exams);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch Controller workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingControllerPapers = papers.filter(p => p.status === 'REVIEWER_APPROVED');
  const readyPapers = papers.filter(p => p.status === 'READY_FOR_RELEASE' || p.status === 'RELEASED');

  const handleControllerApprove = async (e) => {
    e.preventDefault();
    if (!selectedPaper) return;

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await api.post(`/papers/${selectedPaper.id}/controller-approve`, {
        decision: 'APPROVED',
        comments: comments.trim() || 'Final Exam Controller Approval Granted.'
      });

      if (res.data.success) {
        setActionSuccess(`Final approval granted! Paper '${selectedPaper.subjectCode}' is now READY_FOR_RELEASE.`);
        setTimeout(() => {
          setSelectedPaper(null);
          setComments('');
          setActionSuccess(null);
          fetchData();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grant Controller approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkPaper = async (examId, paperId) => {
    if (!paperId) return;
    try {
      const res = await api.post(`/exams/${examId}/link-paper`, { paperId });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to link paper to exam.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
            EXAMINATION CONTROLLER WING
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Approval & Exam Schedule Management
          </h2>
          <p className="text-xs text-slate-400">
            Multi-Sig approval sign-offs, time-locked exam session scheduling, and paper linkage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 disabled:opacity-50"
            title="Refresh Workspace"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule New Exam Session</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Scheduled Exam Sessions & Paper Linkage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span>Scheduled Exam Sessions & Time Locks ({exams.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Time-Locked Release Windows</span>
        </div>

        {exams.length === 0 ? (
          <div className="py-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No exam sessions scheduled yet. Click "Schedule New Exam Session" above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-purple-400">{exam.examCode}</span>
                      <span className="text-xs font-bold text-white">• {exam.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{exam.course} ({exam.semester})</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    {exam.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-[10px] block">Start Release Window:</span>
                      <span className="text-sky-300 font-bold">{new Date(exam.startTime).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-[10px] block">End Release Window:</span>
                      <span className="text-amber-300 font-bold">{new Date(exam.endTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Linked Paper Info or Link Dropdown */}
                <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4 text-purple-400 shrink-0" />
                    {exam.questionPapers && exam.questionPapers.length > 0 ? (
                      <div className="font-mono">
                        <span className="text-slate-400">Linked Paper: </span>
                        <span className="text-emerald-400 font-bold">{exam.questionPapers[0].subjectCode}</span>
                        <span className="text-slate-300"> - {exam.questionPapers[0].title}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No question paper linked to this exam session yet.</span>
                    )}
                  </div>

                  {readyPapers.length > 0 && (!exam.questionPapers || exam.questionPapers.length === 0) && (
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <select
                        onChange={(e) => handleLinkPaper(exam.id, e.target.value)}
                        defaultValue=""
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="" disabled>Select READY_FOR_RELEASE Paper...</option>
                        {readyPapers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.subjectCode} - {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Queue 1 - Awaiting Final Controller Approval */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Lock className="h-4 w-4 text-purple-400" />
            <span>Awaiting Controller Sign-Off ({pendingControllerPapers.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Reviewer Approved • Pending Controller Authorization</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-400 mb-2" />
            Loading Controller queue...
          </div>
        ) : pendingControllerPapers.length === 0 ? (
          <div className="py-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-1">
            <CheckCircle2 className="h-6 w-6 mx-auto text-purple-400 mb-1" />
            <p className="font-bold text-white">No Papers Awaiting Controller Sign-Off</p>
            <p>All reviewer-approved papers have been authorized or processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingControllerPapers.map((paper) => {
              const reviewerApproval = paper.approvals?.find(a => a.approvalRole === 'REVIEWER');
              return (
                <div key={paper.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-slate-700 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-purple-400">{paper.subjectCode}</span>
                      <h4 className="font-bold text-white text-base">{paper.title}</h4>
                      <p className="text-xs text-slate-400">{paper.course} ({paper.semester})</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      REVIEWER_APPROVED
                    </span>
                  </div>

                  {reviewerApproval && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-xs font-mono space-y-1 text-slate-300">
                      <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Step 1: Moderator Audit Verified</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reviewer: <span className="text-white">{reviewerApproval.user?.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        "{reviewerApproval.comments || 'No comments'}"
                      </div>
                      <div className="text-[10px] text-emerald-400/80 truncate pt-1">
                        SigHash: {reviewerApproval.signatureHash}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAuditPaper(paper)}
                      className="py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 text-xs font-semibold border border-emerald-800/40 flex items-center justify-center space-x-1"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>SHA-256 Audit</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPaper(paper);
                        setComments('');
                        setError(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-1"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Authorize Release</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      {/* Controller Final Authorization Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400">{selectedPaper.subjectCode}</span>
                <h3 className="font-bold text-white text-lg">{selectedPaper.title}</h3>
                <p className="text-xs text-slate-400">Final Examination Controller Authorization</p>
              </div>
              <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleControllerApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Controller Authorization Comments *
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Final Multi-Sig approval granted. Question paper authorized for scheduled examination window."
                  className="w-full h-24 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>State Transition: READY_FOR_RELEASE</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Granting this approval completes the multi-signature requirements. The paper status will update to <strong className="text-emerald-400">READY_FOR_RELEASE</strong> and commit to the Hyperledger Fabric ledger.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaper(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Issue Final Multi-Sig Approval</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Integrity Audit Modal */}
      {auditPaper && (
        <IntegrityAuditModal
          paper={auditPaper}
          onClose={() => setAuditPaper(null)}
          onRefresh={() => fetchData()}
        />
      )}
    </div>
  );
}
