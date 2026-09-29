const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const prisma = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const paperRoutes = require('./routes/paperRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const examRoutes = require('./routes/examRoutes');
const accessRoutes = require('./routes/accessRoutes');
const integrityRoutes = require('./routes/integrityRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const { ensureGenesisBlock } = require('./services/blockchainService');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure storage directories exist & Genesis Block initialized
const encryptedDir = path.resolve(process.env.ENCRYPTED_STORAGE_DIR || './storage/encrypted_papers');
const keysDir = path.resolve(process.env.KEYS_STORAGE_DIR || './storage/keys');
[encryptedDir, keysDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
ensureGenesisBlock().catch(() => null);

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/papers/:id', approvalRoutes);
app.use('/api/papers/:id', accessRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/integrity', integrityRoutes);
app.use('/api/blockchain', blockchainRoutes);

// System Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check Database connection
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const paperCount = await prisma.questionPaper.count();

    res.json({
      status: 'UP',
      service: 'CHAINGUARD Backend API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      database: {
        status: 'CONNECTED',
        provider: 'SQLite (Prisma)',
        stats: {
          users: userCount,
          papers: paperCount
        }
      },
      blockchain: {
        mode: process.env.BLOCKCHAIN_MODE || 'SANDBOX',
        channel: process.env.FABRIC_CHANNEL || 'examchannel',
        chaincode: process.env.FABRIC_CHAINCODE || 'chainguard-cc'
      },
      storage: {
        encryptedVault: fs.existsSync(encryptedDir) ? 'ONLINE' : 'OFFLINE',
        keyVault: fs.existsSync(keysDir) ? 'ONLINE' : 'OFFLINE'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'DEGRADED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CHAINGUARD Examination Security Platform API',
    version: '1.0.0',
    documentation: '/docs',
    healthCheck: '/api/health'
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route '${req.originalUrl}' not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Server Start
const server = app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🛡️  CHAINGUARD API Server running on port ${PORT}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Storage vaults active at: ${encryptedDir}`);
  console.log('==================================================');
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server and DB connections.');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server and database gracefully shut down.');
  });
});

module.exports = app;
