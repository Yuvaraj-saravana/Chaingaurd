import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Key, 
  FileText, 
  UserCheck, 
  Clock, 
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    role: 'SETTER',
    title: 'Question Setter',
    username: 'setter1',
    password: 'Setter@123',
    department: 'Dept of CCE',
    icon: FileText,
    color: 'border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
  },
  {
    role: 'REVIEWER',
    title: 'Moderator / Reviewer',
    username: 'reviewer1',
    password: 'Reviewer@123',
    department: 'Review Board',
    icon: UserCheck,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
  },
  {
    role: 'CONTROLLER',
    title: 'Exam Controller',
    username: 'controller1',
    password: 'Controller@123',
    department: 'Exam Office',
    icon: Lock,
    color: 'border-purple-500/40 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
  },
  {
    role: 'INVIGILATOR',
    title: 'Exam Invigilator',
    username: 'invigilator1',
    password: 'Invigilator@123',
    department: 'Centre Alpha',
    icon: Clock,
    color: 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
  },
  {
    role: 'ADMIN',
    title: 'Security Admin',
    username: 'admin1',
    password: 'Admin@123',
    department: 'Cyber Infrastructure',
    icon: ShieldAlert,
    color: 'border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
  }
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sky-600/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 items-center justify-center shadow-xl shadow-sky-500/20 border border-sky-400/40">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          CHAINGUARD
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Academic Examination Security Platform • Role-Based Cryptographic Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          {error && (
            <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Institutional Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. setter1 or admin1@university.edu"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-lg shadow-sky-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate & Enter Secure Vault</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="border-t border-slate-800/80 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Demo Role Selector
              </span>
              <span className="text-[11px] text-sky-400 font-mono">1-Click Autofill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = username === acc.username;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition ${acc.color} ${
                      isSelected ? 'ring-2 ring-sky-500' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{acc.title}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {acc.username} / {acc.password}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Features Notice */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <Shield className="h-3.5 w-3.5 text-sky-400" />
              <span>Active Security Enforcement</span>
            </div>
            <p>
              Brute-force protection enabled. Consecutive failed attempts automatically trigger a security incident and lock the account after 5 attempts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
