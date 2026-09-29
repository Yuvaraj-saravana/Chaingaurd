import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Hash, 
  Clock, 
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import UploadPaperModal from '../../components/setter/UploadPaperModal';
import IntegrityAuditModal from '../../components/integrity/IntegrityAuditModal';

export default function SetterDashboard() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [auditPaper, setAuditPaper] = useState(null);

  const fetchPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/papers');
      if (res.data.success) {
        setPapers(res.data.papers);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch authored question papers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const filteredPapers = papers.filter((p) => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.subjectCode.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PENDING_REVIEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'REVIEWER_APPROVED':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'READY_FOR_RELEASE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'RELEASED':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'FROZEN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              QUESTION SETTER WORKSPACE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Authored Question Papers
          </h2>
          <p className="text-xs text-slate-400">
            Create, encrypt using AES-256-GCM, and monitor reviewer & controller sign-offs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPapers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 disabled:opacity-50"
            title="Refresh Papers"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-sky-600/30 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Upload New Question Paper</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or subject code (e.g. CCE-401)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-sky-400 font-bold">{filteredPapers.length}</span> paper(s)
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Authored Papers Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-400" />
            <p className="font-mono">Loading encrypted paper registry...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Question Papers Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't uploaded any question papers yet. Click "Upload New Question Paper" to encrypt your first paper.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Subject & Title</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Version</th>
                  <th className="px-6 py-3.5">SHA-256 Hash</th>
                  <th className="px-6 py-3.5">Encryption</th>
                  <th className="px-6 py-3.5">Created At</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center space-x-2">
                          <span className="font-mono text-sky-400">{paper.subjectCode}</span>
                          <span>•</span>
                          <span>{paper.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {paper.course} ({paper.semester})
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 font-mono font-bold text-[10px] px-2.5 py-1 rounded-full border ${getStatusBadge(paper.status)}`}>
                        <span>{paper.status}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-300">
                      v{paper.version}
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-emerald-400">
                      <div className="flex items-center space-x-1" title={paper.fileSha256Hash}>
                        <Hash className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="truncate max-w-[140px]">{paper.fileSha256Hash}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px]">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Lock className="h-3 w-3" />
                        <span>AES-256-GCM</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {paper.status === 'DRAFT' && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/papers/${paper.id}/submit`);
                                fetchPapers();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to submit paper');
                              }
                            }}
                            className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm flex items-center space-x-1"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Submit for Review</span>
                          </button>
                        )}
                        <button
                          onClick={() => setAuditPaper(paper)}
                          className="px-3 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 text-xs font-semibold border border-emerald-800/40 flex items-center space-x-1"
                          title="Verify Cryptographic SHA-256 Digest"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>SHA-256 Audit</span>
                        </button>
                        <button
                          onClick={() => setSelectedPaper(paper)}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                        >
                          Inspect Vault
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Paper Modal */}
      <UploadPaperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchPapers()}
      />

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-sky-400">{selectedPaper.subjectCode}</span>
                <h3 className="font-bold text-white text-lg">{selectedPaper.title}</h3>
              </div>
              <button onClick={() => setSelectedPaper(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="text-amber-400 font-bold">{selectedPaper.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Version:</span>
                <span className="text-white">v{selectedPaper.version}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Original Filename:</span>
                <span className="text-slate-300 truncate">{selectedPaper.originalFilename}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payload Size:</span>
                <span className="text-slate-300">{(selectedPaper.fileSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-slate-400 block mb-1">SHA-256 File Integrity Hash:</span>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
                {selectedPaper.fileSha256Hash}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center space-x-2 text-sky-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Cryptographic Off-Chain Storage Status</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Payload encrypted with AES-256-GCM. Ciphertext stored in <code className="text-sky-300">backend/storage/encrypted_papers/{selectedPaper.id}.enc</code>. 
                Symmetric key secured in Key Management Vault.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  const p = selectedPaper;
                  setSelectedPaper(null);
                  setAuditPaper(p);
                }}
                className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Run SHA-256 Audit</span>
              </button>
              <button
                onClick={() => setSelectedPaper(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic SHA-256 Integrity Audit Modal */}
      {auditPaper && (
        <IntegrityAuditModal
          paper={auditPaper}
          onClose={() => setAuditPaper(null)}
          onRefresh={() => fetchPapers()}
        />
      )}
    </div>
  );
}
