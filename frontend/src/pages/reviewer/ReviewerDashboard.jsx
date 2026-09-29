import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  RefreshCw, 
  FileText, 
  Hash, 
  Lock, 
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Search
} from 'lucide-react';
import api from '../../services/api';

export default function ReviewerDashboard() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [actionDecision, setActionDecision] = useState('APPROVED'); // APPROVED | REJECTED | MODIFICATION_REQUESTED
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/papers');
      if (res.data.success) {
        setPapers(res.data.papers);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assigned question papers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const pendingPapers = papers.filter(p => p.status === 'PENDING_REVIEW');
  const reviewedPapers = papers.filter(p => p.status !== 'PENDING_REVIEW' && p.status !== 'DRAFT');

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaper) return;
    if (!comments.trim()) {
      setError('Reviewer comments are required to sign off on an audit decision.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await api.post(`/papers/${selectedPaper.id}/review`, {
        decision: actionDecision,
        comments: comments.trim()
      });

      if (res.data.success) {
        setActionSuccess(`Review recorded! Paper '${selectedPaper.subjectCode}' is now '${res.data.paper.status}'.`);
        setTimeout(() => {
          setSelectedPaper(null);
          setComments('');
          setActionSuccess(null);
          fetchPapers();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record reviewer decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            MODERATOR / REVIEWER BOARD
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Question Paper Audit & Review Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Audit subject content quality, verify SHA-256 file hashes, and issue cryptographic sign-offs.
          </p>
        </div>

        <button
          onClick={fetchPapers}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 disabled:opacity-50"
          title="Refresh Queue"
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

      {/* Pending Reviews Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>Pending Review Queue ({pendingPapers.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Requires Reviewer Action</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading review queue...
          </div>
        ) : pendingPapers.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-1">
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-400 mb-1" />
            <p className="font-bold text-white">Review Queue Clear</p>
            <p>No question papers are currently awaiting Moderator/Reviewer audit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPapers.map((paper) => (
              <div key={paper.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-slate-700 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{paper.subjectCode}</span>
                    <h4 className="font-bold text-white text-base">{paper.title}</h4>
                    <p className="text-xs text-slate-400">{paper.course} ({paper.semester})</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    PENDING_REVIEW
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Setter:</span>
                    <span className="text-white">{paper.setter?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SHA-256:</span>
                    <span className="text-emerald-400 truncate max-w-[180px]">{paper.fileSha256Hash}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPaper(paper);
                    setActionDecision('APPROVED');
                    setComments('');
                    setError(null);
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Audit & Sign-Off Paper</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Decision Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedPaper.subjectCode}</span>
                <h3 className="font-bold text-white text-lg">{selectedPaper.title}</h3>
                <p className="text-xs text-slate-400">Author: {selectedPaper.setter?.fullName} ({selectedPaper.department})</p>
              </div>
              <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {actionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Reviewer Audit Decision *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionDecision('APPROVED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      actionDecision === 'APPROVED' 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/40' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionDecision('MODIFICATION_REQUESTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      actionDecision === 'MODIFICATION_REQUESTED' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/40' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionDecision('REJECTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      actionDecision === 'REJECTED' 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500 ring-2 ring-rose-500/40' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reviewer Audit Comments & Cryptographic Notes *
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide detailed feedback on syllabus coverage, question clarity, and audit justification..."
                  className="w-full h-24 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Non-Repudiation Multi-Sig Signature</span>
                </div>
                <p>
                  Submitting this audit generates an immutable HMAC/SHA-256 digital signature hash committed to the audit trail and Hyperledger Fabric sandbox.
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Submit Cryptographic Sign-Off</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
