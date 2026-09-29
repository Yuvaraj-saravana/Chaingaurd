# CHAINGUARD 🛡️
### Blockchain-Based Question Paper Leakage Prevention System
*Final-Year B.Tech Capstone Project — Computer & Communication Engineering*

---

## 📖 Overview
**CHAINGUARD** is an enterprise-grade academic examination security platform engineered to prevent unauthorized question paper access, combat insider leakage, and maintain a tamper-evident audit trail across the complete examination lifecycle.

### Core Pillars
1. **Off-Chain AES-256-GCM Cryptographic Vault**: Question papers are encrypted before writing to storage.
2. **SHA-256 Cryptographic Anchoring**: Every document hash is committed to an immutable ledger.
3. **Multi-Signature Approval Workflow**: Requires verified review by both Moderator and Exam Controller before paper release is authorized.
4. **Server-Enforced Time-Locking**: Access is mathematically locked until the exact authorized examination window.
5. **Hyperledger Fabric Permissioned Ledger**: Consortial blockchain logging critical lifecycle events and access histories.
6. **Unsupervised AI Anomaly Engine**: Python Isolation Forest model detecting premature, high-frequency, or suspicious access requests.
7. **Emergency Freeze & Key Revocation**: Instant one-click paper lockdown and post-exam cryptographic key zeroing.

---

## 🏗️ Architecture
```
USER ➔ REACT FRONTEND (Vite + Tailwind CSS)
            │
            ▼ REST API (JWT + RBAC)
    NODE.JS / EXPRESS BACKEND
     ├── SQLite / PostgreSQL Database (Prisma ORM)
     ├── Off-Chain Encrypted Vault (AES-256-GCM)
     ├── Key Management Service (Revocable Keys)
     ├── Blockchain Service (Fabric Gateway SDK / Sandbox Mode)
     └── AI Client (FastAPI microservice integration)
            │
            ├─► HYPERLEDGER FABRIC (examchannel / chainguard-cc)
            └─► PYTHON AI SERVICE (Port 5001 / Isolation Forest)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+)
- Python 3.10+ (tested on Python 3.13)
- Docker Desktop (for Hyperledger Fabric containers in Phase 8+)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run dev
# Running on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### 3. AI Service Setup
```bash
cd ai-service
py -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python.exe main.py
# Running on http://localhost:5001
# Health check: http://localhost:5001/health
```

---

## 🔑 Demo Test Accounts (Phase 2 RBAC)

| Role | Username | Password | Full Name | Department / Wing |
| :--- | :--- | :--- | :--- | :--- |
| **Question Setter** | `setter1` | `Setter@123` | Dr. Ramesh Kumar | Dept of Computer & Communication Engineering |
| **Moderator / Reviewer** | `reviewer1` | `Reviewer@123` | Prof. Ananya Sen | Examination Review Board - CCE |
| **Exam Controller** | `controller1` | `Controller@123` | Dr. K. S. Murthy | Office of the Controller of Examinations |
| **Invigilator** | `invigilator1` | `Invigilator@123` | Prof. Suresh Nair | Exam Centre Alpha - Hall 304 |
| **Security Administrator**| `admin1` | `Admin@123` | Chief IT Security Admin | Cybersecurity & Infrastructure Division |

---

## 🗓️ Incremental Phase Plan
- [x] **Phase 1**: Project Setup, Architecture & Scaffolding
- [x] **Phase 2**: Authentication & 5-Role RBAC System
- [x] **Phase 3**: Question Paper Upload & AES-256-GCM Vault
- [x] **Phase 4**: Multi-Signature Approval Workflow
- [x] **Phase 5**: Exam Scheduling & Window Management
- [x] **Phase 6**: Time-Locked Access Gate
- [x] **Phase 7**: SHA-256 Integrity Verification & Tamper Detection
- [x] **Phase 8**: Hyperledger Fabric Network Setup
- [x] **Phase 9**: Chaincode Development (`chainguard-cc`)
- [ ] **Phase 10**: Backend ↔ Blockchain Integration
- [ ] **Phase 11**: Blockchain Verification Dashboard
- [ ] **Phase 12**: Audit Trail System
- [ ] **Phase 13**: AI Anomaly Detection Service
- [ ] **Phase 14**: Real-Time Security Alerts
- [ ] **Phase 15**: Emergency Freeze & Key Revocation
- [ ] **Phase 16**: Controlled Watermarked Document Viewing
- [ ] **Phase 17**: Comprehensive Testing
- [ ] **Phase 18**: UI/UX Polishing
- [ ] **Phase 19**: End-to-End Demo & Final Documentation

