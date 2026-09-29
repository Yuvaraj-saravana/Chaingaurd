import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import api from '../../services/api';

export default function CreateExamModal({ isOpen, onClose, onSuccess }) {
  const [examCode, setExamCode] = useState('');
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('B.Tech Computer & Communication Engineering');
  const [semester, setSemester] = useState('8th Semester');
  const [department, setDepartment] = useState('Department of Computer & Communication Engineering');
  
  // Default start time: 1 hour from now, End time: 4 hours from now
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 3600000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 14400000).toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examCode || !title || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError('Exam end time must be after start time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/exams', {
        examCode,
        title,
        course,
        semester,
        department,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      });

      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.exam);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Schedule Examination Session</h3>
              <p className="text-xs text-slate-400 font-mono">Configure Time-Locked Release Window</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Exam Code *</label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="e.g. EXAM-2026-CCE401"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Exam Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. B.Tech CCE Final Examination"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Exam Release Start Window *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Exam Release End Window *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Cryptographic Time-Lock Enforcement</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Access to linked question papers will be mathematically blocked on server before <code className="text-purple-300">startTime</code> and revoked after <code className="text-purple-300">endTime</code>.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              <span>Create & Lock Exam Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
