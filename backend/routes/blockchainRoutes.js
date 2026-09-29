const express = require('express');
const router = express.Router();
const { 
  getStatus, 
  getPaperHistory, 
  verifyChain, 
  queryChaincodeContract, 
  invokeChaincodeContract 
} = require('../controllers/blockchainController');
const authenticate = require('../middleware/authMiddleware');

// Get Blockchain Network Status & Block Height
router.get('/status', authenticate, getStatus);

// Get Immutable Block Transaction History for a Paper
router.get('/transactions/:paperId', authenticate, getPaperHistory);

// Verify Cryptographic Hash Chain Continuity
router.get('/verify-chain', authenticate, verifyChain);

// Chaincode Smart Contract Query & Invocation Endpoints
router.get('/chaincode/query/:paperId', authenticate, queryChaincodeContract);
router.post('/chaincode/invoke', authenticate, invokeChaincodeContract);

module.exports = router;
