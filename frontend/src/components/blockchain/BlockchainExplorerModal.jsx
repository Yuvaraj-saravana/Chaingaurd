import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Server, 
  Cpu, 
  Hash, 
  Clock, 
  FileCode,
  Globe,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BlockchainExplorerModal({ paperId = null, onClose }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBlockchainData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Network Status
      const statusRes = await fetch('http://localhost:5000/api/blockchain/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusRes.json();
      if (statusData.data) setStatus(statusData.data);

      // 2. Fetch Ledger Chain Verification
      const verifyRes = await fetch('http://localhost:5000/api/blockchain/verify-chain', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      if (verifyData.data) setVerification(verifyData.data);

      // 3. Fetch History (specific paper or all system blocks)
      if (paperId) {
        const historyRes = await fetch(`http://localhost:5000/api/blockchain/transactions/${paperId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (historyData.history) setHistory(historyData.history);
      } else {
        const blocksRes = await fetch('http://localhost:5000/api/blockchain/blocks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const blocksData = await blocksRes.json();
        if (blocksData.blocks) setHistory(blocksData.blocks);
      }
    } catch (err) {
      setError(err.message || 'Error loading blockchain network status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
  }, [paperId]);

  const handleRunVerifyChain = async () => {
    setVerifying(true);
    try {
      const verifyRes = await fetch('http://localhost:5000/api/blockchain/verify-chain', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      if (verifyData.data) setVerification(verifyData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'GENESIS_BLOCK':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REGISTER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'SUBMIT_REVIEW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'APPROVE_REVIEW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'AUTHORIZE_RELEASE':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'LINK_EXAM':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-purple-900/40 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Hyperledger Fabric Blockchain Explorer</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {status?.channel || 'examchannel'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Immutable Ledger • Smart Contract: <span className="text-purple-300 font-mono">{status?.chaincode || 'chainguard-cc'}</span>
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
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Querying Fabric peers & verifying block header hashes...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Network Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Network Mode</span>
                  <span className="text-purple-400 font-mono font-bold block truncate">{status?.mode || 'SANDBOX'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Total Block Height</span>
                  <span className="text-emerald-400 font-mono font-bold block">{status?.totalBlocks || 0} Blocks</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Channel Name</span>
                  <span className="text-sky-400 font-mono font-bold block truncate">{status?.channel}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Consensus Engine</span>
                  <span className="text-indigo-400 font-mono font-bold block truncate">{status?.consensus || 'Raft'}</span>
                </div>
              </div>

              {/* Cryptographic Ledger Continuity Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                verification?.isIntact 
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl border ${
                    verification?.isIntact 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {verification?.isIntact ? '✓ Cryptographic Ledger Integrity 100% Intact' : '🚨 Ledger Hash Link Interrupted'}
                    </h3>
                    <p className="text-xs opacity-80">{verification?.message}</p>
                  </div>
                </div>

                <button
                  onClick={handleRunVerifyChain}
                  disabled={verifying}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700 transition flex items-center space-x-1.5 shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${verifying ? 'animate-spin' : ''}`} />
                  <span>Verify Chain</span>
                </button>
              </div>

              {/* Participating Consortium Nodes */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-purple-400" />
                    <span>Participating Consortial Endorsing Peers</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Org1MSP & Org2MSP</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">peer0.org1.chainguard.edu:7051</span>
                    <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">CONNECTED</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">peer0.org2.chainguard.edu:9051</span>
                    <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">CONNECTED</span>
                  </div>
                </div>
              </div>

              {/* Chaincode Smart Contract Definition */}
              <div className="p-4 rounded-xl bg-slate-950 border border-purple-900/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 flex items-center space-x-2">
                    <FileCode className="h-4 w-4 text-purple-400" />
                    <span>Fabric Smart Contract Methods (`QuestionPaperContract`)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    `chainguard-cc` v1.0
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-purple-400 font-bold block">RegisterQuestionPaper</span>
                    <span className="text-[10px] text-slate-500">Org1MSP / Org2MSP</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-purple-400 font-bold block">SubmitForReview</span>
                    <span className="text-[10px] text-slate-500">Setter Sign-off</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-purple-400 font-bold block">RecordReviewerApproval</span>
                    <span className="text-[10px] text-slate-500">Org2MSP Moderator</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-purple-400 font-bold block">AuthorizeControllerRelease</span>
                    <span className="text-[10px] text-slate-500">Org1MSP Controller</span>
                  </div>
                </div>
              </div>

              {/* Immutable Transaction Block Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Database className="h-4 w-4 text-sky-400" />
                    <span>Committed Ledger Block Transactions ({history.length} Blocks)</span>
                  </h3>

                  <div className="w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search block #, TxID, Action..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                    No ledger transaction blocks committed yet.
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
                    <div className="divide-y divide-slate-800/60">
                      {history
                        .filter((tx) => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            tx.blockNumber?.toString().includes(q) ||
                            tx.txId?.toLowerCase().includes(q) ||
                            tx.action?.toLowerCase().includes(q) ||
                            tx.paperId?.toLowerCase().includes(q) ||
                            (tx.rawPayload && tx.rawPayload.toLowerCase().includes(q))
                          );
                        })
                        .map((tx) => (
                        <div 
                          key={tx.id} 
                          onClick={() => setSelectedBlock(tx)}
                          className="p-4 hover:bg-slate-900/80 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-purple-400 font-bold">Block #{tx.blockNumber ?? 'N/A'}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getActionBadgeClass(tx.action)}`}>
                                {tx.action}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {tx.status}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-400 truncate max-w-md">
                              TxID: <span className="text-slate-200">{tx.txId}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <div className="text-[11px] font-mono text-slate-400">
                              Payload Hash: <span className="text-sky-400">{tx.payloadHash?.substring(0, 16)}...</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={fetchBlockchainData}
            disabled={loading}
            className="flex items-center space-x-2 text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700 font-semibold"
          >
            Close Explorer
          </button>
        </div>
      </div>

      {/* Block Inspector Sub-Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400">Block #{selectedBlock.blockNumber}</span>
                <h3 className="font-bold text-white text-base">Fabric Block Payload Inspector</h3>
              </div>
              <button onClick={() => setSelectedBlock(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-mono text-slate-300">
                <span className="text-slate-500">Tx ID:</span> {selectedBlock.txId}
              </div>
              <div className="font-mono text-slate-300">
                <span className="text-slate-500">Action Tag:</span> <span className="text-purple-400 font-bold">{selectedBlock.action}</span>
              </div>
              <div className="font-mono text-slate-300">
                <span className="text-slate-500">SHA-256 Payload Hash:</span>
                <div className="bg-slate-950 p-2 rounded text-[11px] text-emerald-400 break-all border border-slate-800 mt-1 select-all">
                  {selectedBlock.payloadHash}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-mono block mb-1">Raw Ledger Payload JSON:</span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  {selectedBlock.rawPayload ? JSON.stringify(JSON.parse(selectedBlock.rawPayload), null, 2) : 'No raw payload'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg"
              >
                Close Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
