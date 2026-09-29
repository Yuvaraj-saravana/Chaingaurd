const { 
  getBlockchainStatus, 
  getBlockchainHistory, 
  verifyBlockchainLedger 
} = require('../services/blockchainService');

/**
 * Get system-wide permissioned blockchain network status
 * GET /api/blockchain/status
 */
const getStatus = async (req, res) => {
  try {
    const status = await getBlockchainStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching blockchain status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to query blockchain network status.',
      error: error.message
    });
  }
};

/**
 * Get immutable transaction block history for a specific question paper
 * GET /api/blockchain/transactions/:paperId
 */
const getPaperHistory = async (req, res) => {
  try {
    const { paperId } = req.params;
    const history = await getBlockchainHistory(paperId);
    return res.status(200).json({
      success: true,
      paperId,
      totalTransactions: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching paper blockchain history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve paper blockchain transactions.',
      error: error.message
    });
  }
};

/**
 * Verify cryptographic hash chain continuity across all blocks from Genesis #0 to Head
 * GET /api/blockchain/verify-chain
 */
const verifyChain = async (req, res) => {
  try {
    const report = await verifyBlockchainLedger();
    return res.status(report.isIntact ? 200 : 409).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error verifying blockchain ledger:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute cryptographic ledger verification.',
      error: error.message
    });
  }
};

/**
 * Query Chaincode Smart Contract state for a paper
 * GET /api/blockchain/chaincode/query/:paperId
 */
const queryChaincodeContract = async (req, res) => {
  try {
    const { paperId } = req.params;
    const QuestionPaperContract = require('../../blockchain/chaincode/chainguard-cc/lib/questionPaperContract');
    const contract = new QuestionPaperContract();
    
    // Fetch paper from database
    const history = await getBlockchainHistory(paperId);
    
    return res.status(200).json({
      success: true,
      paperId,
      chaincode: 'chainguard-cc',
      contractName: 'QuestionPaperContract',
      totalHistoryBlocks: history.length,
      latestBlock: history.length > 0 ? history[history.length - 1] : null
    });
  } catch (error) {
    console.error('Error querying chaincode contract:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to query Fabric chaincode smart contract.',
      error: error.message
    });
  }
};

/**
 * Invoke Chaincode Smart Contract method
 * POST /api/blockchain/chaincode/invoke
 */
const invokeChaincodeContract = async (req, res) => {
  try {
    const { fcn, args = [] } = req.body;
    const { recordTransaction } = require('../services/blockchainService');

    const paperId = args[0] || 'GENESIS_000';
    const txResult = await recordTransaction({
      paperId: paperId,
      action: fcn.toUpperCase(),
      userId: req.user?.id,
      payloadData: {
        fcn: fcn,
        args: args,
        invoker: req.user?.username,
        mspId: req.user?.role === 'REVIEWER' ? 'Org2MSP' : 'Org1MSP'
      },
      mspId: req.user?.role === 'REVIEWER' ? 'Org2MSP' : 'Org1MSP'
    });

    return res.status(200).json({
      success: true,
      message: `Chaincode method '${fcn}' invoked successfully on Fabric channel 'examchannel'.`,
      data: txResult
    });
  } catch (error) {
    console.error('Error invoking chaincode contract:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to invoke Fabric chaincode smart contract.',
      error: error.message
    });
  }
};

module.exports = {
  getStatus,
  getPaperHistory,
  verifyChain,
  queryChaincodeContract,
  invokeChaincodeContract
};
