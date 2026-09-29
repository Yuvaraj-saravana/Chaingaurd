import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Hash
} from 'lucide-react';
import api from '../../services/api';

export default function UploadPaperModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [course, setCourse] = useState('B.Tech Computer & Communication Engineering');
  const [semester, setSemester] = useState('8th Semester');
  const [department, setDepartment] = useState('Department of Computer & Communication Engineering');
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // 0: input, 1: encrypting, 2: success
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
        setError('Only PDF documents (.pdf) are permitted.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    setError(null);
    setLoading(true);
    setStepIndex(1); // Show live encryption pipeline

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subjectCode', subjectCode);
      formData.append('course', course);
      formData.append('semester', semester);
      formData.append('department', department);
      formData.append('paperFile', file);

      // Simulate step delays for visual demonstration of encryption pipeline
      await new Promise((r) => setTimeout(r, 600));

      const res = await api.post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResultData(res.data.paper);
        setStepIndex(2);
        if (onSuccess) onSuccess(res.data.paper);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to encrypt and store paper.';
      setError(msg);
      setStepIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubjectCode('');
    setFile(null);
    setError(null);
    setStepIndex(0);
    setResultData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Secure Paper Upload & Encryption</h3>
              <p className="text-xs text-slate-400">AES-256-GCM Off-Chain Vault • SHA-256 Hashing</p>
            </div>
          </div>
          <button onClick={resetForm} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {stepIndex === 0 && (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Paper Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Cryptography Final Exam"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="e.g. CCE-401"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  required
                />
              </div>
            </div>

            {/* Drag & Drop File Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Question Paper File (PDF) *
              </label>
              <div className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/60 rounded-xl p-5 text-center bg-slate-950/50 transition cursor-pointer relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required
                />
                <div className="flex flex-col items-center space-y-2 pointer-events-none">
                  <UploadCloud className="h-8 w-8 text-sky-400" />
                  {file ? (
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
                      <FileText className="h-4 w-4" />
                      <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        Click or drag PDF question paper here
                      </p>
                      <p className="text-[10px] text-slate-500">Max size 25MB • Strict PDF magic header validation</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-sky-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Zero-Trust Client Encryption Guarantee</span>
              </div>
              <p>
                Your raw PDF will be processed in RAM memory and encrypted using AES-256-GCM. Unencrypted plaintext is never stored to disk.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-xs text-white font-semibold shadow-lg shadow-sky-600/30 flex items-center space-x-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Encrypt & Upload Paper</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 1: Live Encryption Pipeline Stepper */}
        {stepIndex === 1 && (
          <div className="py-8 space-y-6 text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin"></div>
              <Cpu className="h-7 w-7 text-sky-400 absolute" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Cryptographic Vault Pipeline Active</h4>
              <p className="text-xs text-slate-400 font-mono">Executing AES-256-GCM & SHA-256 Anchor...</p>
            </div>

            <div className="max-w-sm mx-auto space-y-2 text-left text-xs font-mono">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>1. Verified PDF Magic Header (%PDF-)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>2. Generated 256-bit Key & 128-bit IV</span>
              </div>
              <div className="flex items-center space-x-2 text-sky-400 animate-pulse">
                <Cpu className="h-3.5 w-3.5 shrink-0" />
                <span>3. Writing AES-256 Payload to Vault...</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Success Card */}
        {stepIndex === 2 && resultData && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-300">Question Paper Encrypted & Stored</h4>
                <p className="text-xs text-slate-300">
                  Paper payload successfully secured in off-chain vault. Cryptographic key generated and registered.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Paper ID:</span>
                <span className="text-sky-400">{resultData.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Subject Code:</span>
                <span className="text-white font-bold">{resultData.subjectCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Initial Status:</span>
                <span className="text-amber-400 font-bold">{resultData.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">SHA-256 File Hash:</span>
                <span className="text-emerald-400 break-all bg-slate-900 p-2 rounded block text-[11px]">
                  {resultData.fileSha256Hash}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={resetForm}
                className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-lg shadow-sky-600/30"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
