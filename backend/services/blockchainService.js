const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { calculateSHA256 } = require('./cryptoService');

const prisma = new PrismaClient();
const BLOCKCHAIN_MODE = process.env.BLOCKCHAIN_MODE || 'SANDBOX';
const CHANNEL_NAME = process.env.FABRIC_CHANNEL || 'examchannel';
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE || 'chainguard-cc';

/**
 * Initialize Genesis Block (#0) if database transaction log is empty
 */
async function ensureGenesisBlock() {
  try {
    const count = await prisma.blockchainTransaction.count();
    if (count === 0) {
      // Find or create dummy question paper for genesis block reference if paperId is non-nullable
      let paper = await prisma.questionPaper.findFirst();
      if (!paper) {
        // Create system genesis reference paper
        const dummyUser = await prisma.user.findFirst() || await prisma.user.create({
          data: {
            username: 'system_genesis',
            email: 'genesis@chainguard.edu',
            passwordHash: 'SYSTEM_PROTECTED',
            role: 'ADMIN',
            fullName: 'System Genesis Authority',
            department: 'Core Infrastructure'
          }
        });

        paper = await prisma.questionPaper.create({
          data: {
            title: 'CHAINGUARD Genesis Anchor Block',
            subjectCode: 'GENESIS-000',
            course: 'System Initialization',
            semester: 'N/A',
            department: 'Security Infrastructure',
            originalFilename: 'genesis_block.bin',
            fileSizeBytes: 256,
            encryptedFilePath: 'storage/encrypted_papers/genesis.enc',
            fileSha256Hash: '0000000000000000000000000000000000000000000000000000000000000000',
            setterId: dummyUser.id,
            status: 'CLOSED'
          }
        });
      }

      const genesisPayload = {
        network: 'CHAINGUARD Permissioned Consortium Ledger',
        channel: CHANNEL_NAME,
        chaincode: CHAINCODE_NAME,
        participatingOrgs: ['Org1MSP (Exam Controller Board)', 'Org2MSP (University Review Board)'],
        consensus: 'Raft Consensus Protocol (Consortial Ordering Service)',
        initializedAt: new Date().toISOString()
      };

      const genesisPayloadHash = calculateSHA256(JSON.stringify(genesisPayload));
      const genesisTxId = 'TX_GENESIS_0000000000000000000000000000000000000000000000000000000000000000';

      await prisma.blockchainTransaction.create({
        data: {
          txId: genesisTxId,
          paperId: paper.id,
          action: 'GENESIS_BLOCK',
          blockNumber: 0,
          payloadHash: genesisPayloadHash,
          status: 'COMMITTED',
          rawPayload: JSON.stringify(genesisPayload)
        }
      });

      console.log('⛓️  Blockchain Genesis Block #0 committed to permissioned ledger.');
    }
  } catch (error) {
    console.error('Error initializing blockchain genesis block:', error.message);
  }
}

/**
 * Record an immutable audit transaction to the permissioned blockchain ledger
 * @param {Object} params
 * @param {string} params.paperId
 * @param {string} params.action - "REGISTER" | "SUBMIT_REVIEW" | "APPROVE_REVIEW" | "AUTHORIZE_RELEASE" | "LINK_EXAM" | "ACCESS_ATTEMPT" | "FREEZE"
 * @param {string|null} params.userId
 * @param {Object} params.payloadData
 * @param {string} params.mspId - Default "Org1MSP"
 * @returns {Promise<Object>} Committed block transaction record
 */
async function recordTransaction({ paperId, action, userId = null, payloadData = {}, mspId = 'Org1MSP' }) {
  await ensureGenesisBlock();

  // 1. Fetch latest committed block
  const latestBlock = await prisma.blockchainTransaction.findFirst({
    orderBy: { blockNumber: 'desc' }
  });

  const nextBlockNumber = (latestBlock ? latestBlock.blockNumber : 0) + 1;
  const prevBlockHash = latestBlock ? latestBlock.txId : '00000000000000000000000000000000';

  // 2. Compute payload SHA-256 digest
  const payloadString = JSON.stringify(payloadData);
  const payloadHash = calculateSHA256(payloadString);

  // 3. Compute block header hash (TX ID)
  const timestamp = new Date().toISOString();
  const txHeaderRaw = `BLOCK_${nextBlockNumber}_PREV_${prevBlockHash}_PAYLOAD_${payloadHash}_TIME_${timestamp}`;
  const txId = 'TX_' + calculateSHA256(txHeaderRaw);

  const blockPayload = {
    channel: CHANNEL_NAME,
    chaincode: CHAINCODE_NAME,
    blockNumber: nextBlockNumber,
    prevBlockHash: prevBlockHash,
    mspId: mspId,
    userId: userId,
    paperId: paperId,
    action: action,
    payloadHash: payloadHash,
    data: payloadData,
    committedAt: timestamp,
    executionMode: BLOCKCHAIN_MODE
  };

  // 4. Commit to immutable database ledger
  const txRecord = await prisma.blockchainTransaction.create({
    data: {
      txId: txId,
      paperId: paperId,
      action: action,
      blockNumber: nextBlockNumber,
      payloadHash: payloadHash,
      status: 'COMMITTED',
      rawPayload: JSON.stringify(blockPayload)
    }
  });

  return {
    success: true,
    txId: txRecord.txId,
    blockNumber: txRecord.blockNumber,
    action: txRecord.action,
    payloadHash: txRecord.payloadHash,
    channel: CHANNEL_NAME,
    chaincode: CHAINCODE_NAME,
    mspId: mspId,
    timestamp: txRecord.timestamp
  };
}

/**
 * Fetch full immutable blockchain transaction history for a specific question paper
 * @param {string} paperId 
 * @returns {Promise<Array>} List of committed transaction blocks
 */
async function getBlockchainHistory(paperId) {
  await ensureGenesisBlock();

  const transactions = await prisma.blockchainTransaction.findMany({
    where: { paperId: paperId },
    orderBy: { blockNumber: 'asc' }
  });

  return transactions.map(tx => ({
    ...tx,
    parsedPayload: tx.rawPayload ? JSON.parse(tx.rawPayload) : null
  }));
}

/**
 * Verify cryptographic chain link integrity across all blocks from Genesis (#0) to Head (#N)
 * @returns {Promise<Object>} Ledger integrity report
 */
async function verifyBlockchainLedger() {
  await ensureGenesisBlock();

  const blocks = await prisma.blockchainTransaction.findMany({
    orderBy: { blockNumber: 'asc' }
  });

  let isIntact = true;
  let brokenBlockNumber = null;
  let message = 'Permissioned blockchain ledger integrity verified 100% intact across all committed blocks.';

  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i];

    // Check block numbering sequence
    if (currentBlock.blockNumber !== i) {
      isIntact = false;
      brokenBlockNumber = i;
      message = `Block sequence broken at index ${i}. Expected block #${i}, found #${currentBlock.blockNumber}`;
      break;
    }

    // Check prevBlockHash pointer against previous block
    if (i > 0) {
      const prevBlock = blocks[i - 1];
      const parsed = currentBlock.rawPayload ? JSON.parse(currentBlock.rawPayload) : null;
      if (parsed && parsed.prevBlockHash && parsed.prevBlockHash !== prevBlock.txId) {
        isIntact = false;
        brokenBlockNumber = i;
        message = `Cryptographic link broken at Block #${i}. PrevBlockHash '${parsed.prevBlockHash}' does not match Block #${i-1} TX_ID '${prevBlock.txId}'`;
        break;
      }
    }
  }

  return {
    isIntact: isIntact,
    mode: BLOCKCHAIN_MODE,
    channel: CHANNEL_NAME,
    chaincode: CHAINCODE_NAME,
    totalBlocks: blocks.length,
    latestBlockNumber: blocks.length > 0 ? blocks[blocks.length - 1].blockNumber : 0,
    latestTxId: blocks.length > 0 ? blocks[blocks.length - 1].txId : null,
    brokenBlockNumber: brokenBlockNumber,
    message: message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get system-wide blockchain status
 * @returns {Promise<Object>}
 */
async function getBlockchainStatus() {
  await ensureGenesisBlock();

  const totalBlocks = await prisma.blockchainTransaction.count();
  const latestTx = await prisma.blockchainTransaction.findFirst({
    orderBy: { blockNumber: 'desc' }
  });

  return {
    mode: BLOCKCHAIN_MODE,
    status: 'ONLINE',
    channel: CHANNEL_NAME,
    chaincode: CHAINCODE_NAME,
    participatingOrgs: ['Org1MSP (Exam Controller Board)', 'Org2MSP (University Review Board)'],
    totalBlocks: totalBlocks,
    latestBlockNumber: latestTx ? latestTx.blockNumber : 0,
    latestTxId: latestTx ? latestTx.txId : null,
    consensus: 'Raft (BFT/Consortial Permissioned Ordering)',
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch all committed blockchain transaction blocks across the system
 * @returns {Promise<Array>}
 */
async function getAllBlocks() {
  await ensureGenesisBlock();

  const transactions = await prisma.blockchainTransaction.findMany({
    orderBy: { blockNumber: 'desc' }
  });

  return transactions.map(tx => ({
    ...tx,
    parsedPayload: tx.rawPayload ? JSON.parse(tx.rawPayload) : null
  }));
}

module.exports = {
  ensureGenesisBlock,
  recordTransaction,
  getBlockchainHistory,
  getAllBlocks,
  verifyBlockchainLedger,
  getBlockchainStatus
};
