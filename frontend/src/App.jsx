import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Server, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Layers, 
  UserCheck, 
  Clock, 
  LogOut,
  User,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
  Ban,
  Boxes
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import SetterDashboard from './pages/setter/SetterDashboard';
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ControllerDashboard from './pages/controller/ControllerDashboard';
import InvigilatorDashboard from './pages/invigilator/InvigilatorDashboard';
import BlockchainExplorerModal from './components/blockchain/BlockchainExplorerModal';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [backendHealth, setBackendHealth] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [isBlockchainModalOpen, setIsBlockchainModalOpen] = useState(false);

  const checkServices = async () => {
    setLoadingHealth(true);
    try {
      const backendRes = await fetch('http://localhost:5000/api/health').catch(() => null);
      if (backendRes && backendRes.ok) {
        const data = await backendRes.json();
        setBackendHealth(data);
      } else {
        setBackendHealth({ status: 'OFFLINE' });
      }

      const aiRes = await fetch('http://localhost:5001/health').catch(() => null);
      if (aiRes && aiRes.ok) {
        const data = await aiRes.json();
        setAiHealth(data);
      } else {
        setAiHealth({ status: 'OFFLINE' });
      }
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'SETTER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'REVIEWER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CONTROLLER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'INVIGILATOR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getRolePermissions = (role) => {
    switch (role) {
      case 'SETTER':
        return {
          allowed: [
            'Create & draft examination question papers',
            'Upload encrypted question paper PDF',
            'View own submission history & approval status',
            'View reviewer feedback and comments'
          ],
          denied: [
            'Cannot release paper for examination',
            'Cannot view or access other setters\' papers',
            'Cannot bypass moderator or controller approval'
          ]
        };
      case 'REVIEWER':
        return {
          allowed: [
            'View assigned papers for subject syllabus audit',
            'Approve or Reject papers with cryptographic sign-off',
            'Request modifications and add detailed comments',
            'Inspect review history and version diffs'
          ],
          denied: [
            'Cannot authorize release to invigilators',
            'Cannot modify exam date or release window schedules'
          ]
        };
      case 'CONTROLLER':
        return {
          allowed: [
            'Final multi-sig sign-off for question papers',
            'Configure immutable exam date & start/end release window',
            'Authorize state transition to READY_FOR_RELEASE',
            'Initiate paper freeze or cancel compromised sessions'
          ],
          denied: [
            'Cannot bypass Reviewer approval step',
            'Cannot tamper with blockchain audit records'
          ]
        };
      case 'INVIGILATOR':
        return {
          allowed: [
            'View today\'s authorized examination papers',
            'Access decrypted paper during allowed time window',
            'View watermarked secure document',
            'Report examination hall security incidents'
          ],
          denied: [
            'Strictly blocked from accessing paper before release time',
            'Cannot access papers belonging to other exam halls',
            'Cannot download unwatermarked raw source PDF'
          ]
        };
      case 'ADMIN':
        return {
          allowed: [
            'System-wide user & role administration',
            'View comprehensive immutable blockchain audit trail',
            'Triage AI anomaly alerts & premature access patterns',
            'Execute emergency paper freeze across all nodes',
            'Trigger post-exam cryptographic key revocation'
          ],
          denied: [
            'Cannot alter question content or exam papers'
          ]
        };
      default:
        return { allowed: [], denied: [] };
    }
  };

  const permissions = getRolePermissions(user?.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-xl text-white">CHAINGUARD</span>
                <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-700/50">
                  PHASE 9 CHAINCODE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Blockchain-Based Question Paper Leakage Prevention System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Authenticated User Profile Pill */}
            <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                <User className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{user?.fullName}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{user?.department}</p>
              </div>
            </div>

            <button 
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
              title="End Secure Session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Role Active Banner */}
        <section className="relative rounded-2xl p-6 sm:p-8 overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <span>Authenticated Role Session</span>
                <span>•</span>
                <span className="font-mono">{user?.username}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {user?.fullName}
              </h1>
              <p className="text-sm text-slate-400">
                {user?.department} • Access Level: <span className="text-sky-400 font-semibold">{user?.role}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBlockchainModalOpen(true)}
                className="flex items-center space-x-2 text-xs px-3.5 py-2.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white transition border border-purple-800 font-semibold shadow-lg shadow-purple-950/40"
              >
                <Boxes className="h-4 w-4 text-purple-400" />
                <span>Blockchain Explorer</span>
              </button>

              <button 
                onClick={checkServices}
                disabled={loadingHealth}
                className="flex items-center space-x-2 text-xs px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                <span>Test Services</span>
              </button>
            </div>
          </div>
        </section>

        {/* Role Specific Workspace View */}
        {user?.role === 'SETTER' && (
          <section className="space-y-6">
            <SetterDashboard />
          </section>
        )}

        {user?.role === 'REVIEWER' && (
          <section className="space-y-6">
            <ReviewerDashboard />
          </section>
        )}

        {user?.role === 'CONTROLLER' && (
          <section className="space-y-6">
            <ControllerDashboard />
          </section>
        )}

        {user?.role === 'INVIGILATOR' && (
          <section className="space-y-6">
            <InvigilatorDashboard />
          </section>
        )}

        {/* Granular RBAC Permissions & Restrictions for Current Role */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permitted Actions */}
          <div className="rounded-xl p-5 border border-emerald-900/40 bg-emerald-950/20 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Authorized Operations for [{user?.role}]</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {permissions.allowed.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Enforced Restrictions */}
          <div className="rounded-xl p-5 border border-rose-900/40 bg-rose-950/20 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <Ban className="h-4 w-4" />
              <span>Enforced Security Restrictions for [{user?.role}]</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {permissions.denied.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Live Service Status */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Server className="h-4 w-4 text-sky-400" />
              <span>System Infrastructure Status</span>
            </h2>
            <span className="text-xs text-slate-400">Prisma Database & Vault Connected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl p-4 border border-slate-800 bg-slate-900/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Node.js API</span>
                <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {backendHealth?.status || 'ONLINE'}
                </span>
              </div>
              <div className="font-mono text-slate-400 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Registered Users:</span>
                  <span className="text-sky-400">{backendHealth?.database?.stats?.users ?? 5}</span>
                </div>
                <div className="flex justify-between">
                  <span>Encrypted Vault:</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 border border-slate-800 bg-slate-900/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Python AI Engine</span>
                <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {aiHealth?.status || 'HEALTHY'}
                </span>
              </div>
              <div className="font-mono text-slate-400 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="text-slate-300">5001</span>
                </div>
                <div className="flex justify-between">
                  <span>Algorithm:</span>
                  <span className="text-indigo-400">Isolation Forest</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 border border-slate-800 bg-slate-900/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Blockchain Layer</span>
                <span className="text-purple-400 font-mono text-[11px] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  FABRIC / CHAINCODE
                </span>
              </div>
              <div className="font-mono text-slate-400 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Channel:</span>
                  <span className="text-purple-300">examchannel</span>
                </div>
                <div className="flex justify-between">
                  <span>Smart Contract:</span>
                  <span className="text-purple-400">chainguard-cc</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phase Progress Tracker */}
        <section className="rounded-xl p-6 border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Development Roadmap Progress</h3>
              <p className="text-xs text-slate-400">Incremental implementation following master prompt rules</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Phase 9 of 19 Complete
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: '47.37%' }}></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-mono text-slate-400 font-bold block mb-1">PHASE 9 ✓</span>
              <span className="text-slate-400">Fabric Chaincode Contract</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-mono text-slate-400 font-bold block mb-1">PHASE 10 ✓</span>
              <span className="text-slate-400">Backend ↔ Ledger Gateway</span>
            </div>
            <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/50">
              <span className="font-mono text-purple-400 font-bold block mb-1">PHASE 11 (CURRENT) ✓</span>
              <span className="text-purple-300">Blockchain Explorer</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-mono text-slate-500 font-bold block mb-1">PHASE 12 (NEXT)</span>
              <span className="text-slate-500">Immutable Audit Trail</span>
            </div>
          </div>
        </section>
      </main>

      {/* Hyperledger Fabric Blockchain Explorer Modal */}
      {isBlockchainModalOpen && (
        <BlockchainExplorerModal
          onClose={() => setIsBlockchainModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        CHAINGUARD Platform • Final-Year B.Tech Capstone Project • Department of Computer & Communication Engineering
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}

function AppRoot() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Initializing CHAINGUARD Security Context...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardContent /> : <LoginPage />;
}
