import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Key,
  RotateCcw,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function IntegrityAuditModal({ paper, onClose, onRefresh }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditReport, setAuditReport] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/integrity/papers/${paper.id}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setAuditReport(data.data);
      } else {
        setError('Failed to fetch cryptographic audit result.');
      }
    } catch (err) {
      setError(err.message || 'Network error during integrity audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paper?.id) {
      runAudit();
    }
  }, [paper]);

  const handleSimulateTamper = async () => {
    if (!window.confirm('Simulate payload byte corruption on disk for demonstration purposes?')) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`http://localhost:5000/api/integrity/papers/${paper.id}/simulate-tamper`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: 'danger', text: '⚡ TAMPERING SIMULATED: Encrypted payload bytes corrupted on disk.' });
        await runAudit();
        if (onRefresh) onRefresh();
      } else {
        setError(data.message || 'Failed to simulate tampering.');
      }
    } catch (err) {
      setError(err.message || 'Error simulating tampering.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreTamper = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`http://localhost:5000/api/integrity/papers/${paper.id}/restore-tamper`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: 'success', text: '✓ RESTORED: Paper payload restored to clean state from secure vault backup.' });
        await runAudit();
        if (onRefresh) onRefresh();
      } else {
        setError(data.message || 'Failed to restore paper integrity.');
      }
    } catch (err) {
      setError(err.message || 'Error restoring paper integrity.');
    } finally {
      setActionLoading(false);
    }
  };

  const isVerified = auditReport?.verified || auditReport?.status === 'INTEGRITY_VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isVerified 
            ? 'border-emerald-500/30 bg-emerald-950/20' 
            : 'border-rose-500/30 bg-rose-950/30'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isVerified 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isVerified ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Cryptographic SHA-256 Audit Report</span>
              </h2>
              <p className="text-xs text-slate-400">
                {paper?.subjectCode} • {paper?.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {actionMessage && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border ${
              actionMessage.type === 'danger'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{actionMessage.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Computing SHA-256 digest & checking GCM auth tag...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Overall Integrity Status Banner */}
              <div className={`p-5 rounded-2xl border ${
                isVerified
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      Audit Status: {auditReport?.status}
                    </span>
                    <h3 className="text-base font-bold text-white pt-1">
                      {isVerified 
                        ? '✓ File Payload Integrity Verified Clean' 
                        : '🚨 CRITICAL TAMPER ALERT: Payload Hash Mismatch Detected!'}
                    </h3>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {auditReport?.message}
                    </p>
                  </div>
                  {isVerified ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-rose-400 shrink-0 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Hash Comparison Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Cryptographic SHA-256 Digest Audit
                </h4>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden divide-y divide-slate-800/60 text-xs">
                  <div className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Expected Ledger SHA-256 Digest:</span>
                      <span className="text-[10px] font-mono text-emerald-400">REGISTERED</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-200 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all">
                      {auditReport?.expectedHash || paper?.fileSha256Hash || 'N/A'}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Actual Storage Vault File Digest:</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        auditReport?.expectedHash === auditReport?.actualHash
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {auditReport?.expectedHash === auditReport?.actualHash ? 'MATCH' : 'MISMATCH'}
                      </span>
                    </div>
                    <div className={`font-mono text-[11px] p-2 rounded border break-all select-all ${
                      auditReport?.expectedHash === auditReport?.actualHash
                        ? 'bg-slate-900 text-slate-200 border-slate-800'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                    }`}>
                      {auditReport?.actualHash || 'N/A'}
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-slate-400">AES-256-GCM Auth Tag Check:</span>
                    <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded border ${
                      auditReport?.gcmAuthTagVerified
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {auditReport?.gcmAuthTagVerified ? 'AUTHENTICATED ✓' : 'UNVERIFIED / TAG MISMATCH'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Controls for Evaluators */}
              {(user?.role === 'ADMIN' || user?.role === 'CONTROLLER') && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>Tamper Defense Simulation Suite</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Evaluator / Demo Mode</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleSimulateTamper}
                      disabled={actionLoading}
                      className="flex items-center justify-center space-x-2 text-xs px-3 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition font-semibold disabled:opacity-50"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Simulate Byte Corruption</span>
                    </button>

                    <button
                      onClick={handleRestoreTamper}
                      disabled={actionLoading}
                      className="flex items-center justify-center space-x-2 text-xs px-3 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition font-semibold disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore Clean Vault File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center space-x-2 text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-run Audit</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700 font-semibold"
          >
            Close Audit Report
          </button>
        </div>
      </div>
    </div>
  );
}
