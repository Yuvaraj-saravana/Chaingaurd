let Contract;
try {
  Contract = require('fabric-contract-api').Contract;
} catch (e) {
  Contract = class MockContract {
    constructor(name) {
      this.name = name;
    }
  };
}

class QuestionPaperContract extends Contract {

  constructor() {
    // Unique contract name registered on Fabric channel
    super('QuestionPaperContract');
  }

  /**
   * Initialize Ledger state during chaincode deployment
   * @param {Context} ctx 
   */
  async initLedger(ctx) {
    console.info('=== Initializing CHAINGUARD Chaincode Ledger ===');
    const genesisRecord = {
      docType: 'genesisBlock',
      channel: 'examchannel',
      chaincode: 'chainguard-cc',
      contractVersion: '1.0.0',
      consensus: 'Raft Consortial Ordering Service',
      mspOrganizations: ['Org1MSP', 'Org2MSP'],
      initializedAt: new Date().toISOString()
    };

    if (ctx && ctx.stub && ctx.stub.putState) {
      await ctx.stub.putState('GENESIS_BLOCK_000', Buffer.from(JSON.stringify(genesisRecord)));
    }

    return JSON.stringify(genesisRecord);
  }

  /**
   * Register a new question paper on the blockchain ledger
   */
  async RegisterQuestionPaper(ctx, paperId, title, subjectCode, fileSha256Hash, setterUsername, department) {
    if (!paperId || !title || !fileSha256Hash) {
      throw new Error('Missing required arguments for paper registration.');
    }

    const paperBytes = ctx.stub ? await ctx.stub.getState(paperId) : null;
    if (paperBytes && paperBytes.length > 0) {
      throw new Error(`Question paper '${paperId}' is already registered on ledger.`);
    }

    const paperState = {
      docType: 'questionPaper',
      paperId: paperId,
      title: title,
      subjectCode: subjectCode,
      fileSha256Hash: fileSha256Hash,
      setterUsername: setterUsername,
      department: department,
      status: 'DRAFT',
      version: 1,
      approvals: [],
      examLink: null,
      registeredAt: new Date().toISOString()
    };

    if (ctx && ctx.stub && ctx.stub.putState) {
      await ctx.stub.putState(paperId, Buffer.from(JSON.stringify(paperState)));
    }

    return JSON.stringify(paperState);
  }

  /**
   * Submit paper for Moderator/Reviewer audit
   */
  async SubmitForReview(ctx, paperId, setterUsername) {
    const paperBytes = await ctx.stub.getState(paperId);
    if (!paperBytes || paperBytes.length === 0) {
      throw new Error(`Paper '${paperId}' does not exist on ledger.`);
    }

    const paper = JSON.parse(paperBytes.toString());
    paper.status = 'PENDING_REVIEW';
    paper.updatedAt = new Date().toISOString();

    await ctx.stub.putState(paperId, Buffer.from(JSON.stringify(paper)));
    return JSON.stringify(paper);
  }

  /**
   * Record cryptographic sign-off by Reviewer (Org2MSP)
   */
  async RecordReviewerApproval(ctx, paperId, reviewerUsername, decision, comments, signatureHash) {
    const paperBytes = await ctx.stub.getState(paperId);
    if (!paperBytes || paperBytes.length === 0) {
      throw new Error(`Paper '${paperId}' does not exist on ledger.`);
    }

    const paper = JSON.parse(paperBytes.toString());
    
    const approvalRecord = {
      role: 'REVIEWER',
      mspId: 'Org2MSP',
      reviewerUsername: reviewerUsername,
      decision: decision,
      comments: comments || '',
      signatureHash: signatureHash,
      timestamp: new Date().toISOString()
    };

    paper.approvals.push(approvalRecord);

    if (decision === 'APPROVED') {
      paper.status = 'REVIEWER_APPROVED';
    } else if (decision === 'REJECTED' || decision === 'MODIFICATION_REQUESTED') {
      paper.status = 'MODIFICATION_REQUESTED';
    }

    paper.updatedAt = new Date().toISOString();
    await ctx.stub.putState(paperId, Buffer.from(JSON.stringify(paper)));
    return JSON.stringify(paper);
  }

  /**
   * Record final multi-sig authorization by Exam Controller (Org1MSP)
   */
  async AuthorizeControllerRelease(ctx, paperId, controllerUsername, comments) {
    const paperBytes = await ctx.stub.getState(paperId);
    if (!paperBytes || paperBytes.length === 0) {
      throw new Error(`Paper '${paperId}' does not exist on ledger.`);
    }

    const paper = JSON.parse(paperBytes.toString());

    // Verify Reviewer approval is present
    const hasReviewerApproval = paper.approvals.some(a => a.role === 'REVIEWER' && a.decision === 'APPROVED');
    if (!hasReviewerApproval) {
      throw new Error(`Cannot authorize release on ledger. Paper '${paperId}' lacks Reviewer approval.`);
    }

    const approvalRecord = {
      role: 'CONTROLLER',
      mspId: 'Org1MSP',
      controllerUsername: controllerUsername,
      decision: 'APPROVED',
      comments: comments || '',
      timestamp: new Date().toISOString()
    };

    paper.approvals.push(approvalRecord);
    paper.status = 'READY_FOR_RELEASE';
    paper.updatedAt = new Date().toISOString();

    await ctx.stub.putState(paperId, Buffer.from(JSON.stringify(paper)));
    return JSON.stringify(paper);
  }

  /**
   * Anchor scheduled examination release window to paper on ledger
   */
  async LinkExamSession(ctx, paperId, examCode, startTime, endTime) {
    const paperBytes = await ctx.stub.getState(paperId);
    if (!paperBytes || paperBytes.length === 0) {
      throw new Error(`Paper '${paperId}' does not exist on ledger.`);
    }

    const paper = JSON.parse(paperBytes.toString());
    paper.examLink = {
      examCode: examCode,
      startTime: startTime,
      endTime: endTime,
      linkedAt: new Date().toISOString()
    };

    paper.updatedAt = new Date().toISOString();
    await ctx.stub.putState(paperId, Buffer.from(JSON.stringify(paper)));
    return JSON.stringify(paper);
  }

  /**
   * Emergency freeze paper on ledger upon security alert or hash mismatch
   */
  async FreezeQuestionPaper(ctx, paperId, adminUsername, reason) {
    const paperBytes = await ctx.stub.getState(paperId);
    if (!paperBytes || paperBytes.length === 0) {
      throw new Error(`Paper '${paperId}' does not exist on ledger.`);
    }

    const paper = JSON.parse(paperBytes.toString());
    paper.status = 'FROZEN';
    paper.freezeRecord = {
      frozenBy: adminUsername,
      reason: reason,
      frozenAt: new Date().toISOString()
    };

    paper.updatedAt = new Date().toISOString();
    await ctx.stub.putState(paperId, Buffer.from(JSON.stringify(paper)));
    return JSON.stringify(paper);
  }

  /**
   * Read current question paper state from state stub
   */
  async QueryPaper(ctx, paperId) {
    const paperBytes = await ctx.stub.getState(paperId);
    if (!paperBytes || paperBytes.length === 0) {
      throw new Error(`Paper '${paperId}' does not exist on ledger.`);
    }
    return paperBytes.toString();
  }

  /**
   * Query full immutable ledger transaction history for a paper
   */
  async QueryPaperHistory(ctx, paperId) {
    const iterator = await ctx.stub.getHistoryForKey(paperId);
    const results = [];

    while (true) {
      const res = await iterator.next();
      if (res.value) {
        const historyItem = {
          txId: res.value.txId,
          timestamp: new Date(res.value.timestamp.seconds.low * 1000).toISOString(),
          isDelete: res.value.isDelete,
          value: res.value.value.toString('utf8')
        };
        results.push(historyItem);
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }

    return JSON.stringify(results);
  }
}

module.exports = QuestionPaperContract;
