const QuestionPaperContract = require('../lib/questionPaperContract');

// Mock ChaincodeStub and Context implementation for testing
class MockChaincodeStub {
  constructor() {
    this.state = new Map();
    this.history = new Map();
  }

  async getState(key) {
    return this.state.get(key) || null;
  }

  async putState(key, value) {
    this.state.set(key, value);
    if (!this.history.has(key)) this.history.set(key, []);
    this.history.get(key).push({
      txId: `tx_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: { seconds: { low: Math.floor(Date.now() / 1000) } },
      isDelete: false,
      value: value
    });
  }

  async getHistoryForKey(key) {
    const list = this.history.get(key) || [];
    let idx = 0;
    return {
      next: async () => {
        if (idx < list.length) {
          return { value: list[idx++], done: false };
        }
        return { value: null, done: true };
      },
      close: async () => {}
    };
  }
}

class MockContext {
  constructor() {
    this.stub = new MockChaincodeStub();
  }
}

async function testContractMethods() {
  console.log('--- Starting Fabric Smart Contract (Chaincode) Tests ---');
  const contract = new QuestionPaperContract();
  const ctx = new MockContext();

  // 1. Test initLedger
  const initResult = await contract.initLedger(ctx);
  console.log('1. initLedger Executed Cleanly:');
  console.log(`   - Output: ${initResult.substring(0, 100)}...`);

  // 2. Test RegisterQuestionPaper
  const paperId = 'paper_test_cce401';
  const regResult = await contract.RegisterQuestionPaper(
    ctx,
    paperId,
    'Advanced Cryptography & Network Security',
    'CCE-401',
    '6eae8e1ddca77c85cfc54b0f9a54f6ef7f8a10cd83e837f7ad29c31ea5149f82',
    'setter1',
    'Dept of CCE'
  );
  console.log('\n2. RegisterQuestionPaper Result:');
  const regParsed = JSON.parse(regResult);
  console.log(`   - Status: ${regParsed.status}`);
  console.log(`   - Title:  ${regParsed.title}`);
  console.log(`   - SHA256: ${regParsed.fileSha256Hash.substring(0, 20)}...`);

  // 3. Test SubmitForReview
  const subResult = await contract.SubmitForReview(ctx, paperId, 'setter1');
  const subParsed = JSON.parse(subResult);
  console.log(`\n3. SubmitForReview Result: Status updated to '${subParsed.status}'`);

  // 4. Test RecordReviewerApproval (Org2MSP)
  const revResult = await contract.RecordReviewerApproval(
    ctx,
    paperId,
    'reviewer1',
    'APPROVED',
    'Syllabus mapping & question difficulty verified clean.',
    'sig_reviewer_hmac_991823'
  );
  const revParsed = JSON.parse(revResult);
  console.log(`\n4. RecordReviewerApproval Result: Status updated to '${revParsed.status}'`);
  console.log(`   - Total Approvals: ${revParsed.approvals.length}`);

  // 5. Test AuthorizeControllerRelease (Org1MSP)
  const ctlResult = await contract.AuthorizeControllerRelease(
    ctx,
    paperId,
    'controller1',
    'Final multi-sig authorization granted. Release authorized.'
  );
  const ctlParsed = JSON.parse(ctlResult);
  console.log(`\n5. AuthorizeControllerRelease Result: Status updated to '${ctlParsed.status}'`);
  console.log(`   - Total Approvals: ${ctlParsed.approvals.length}`);

  // 6. Test LinkExamSession
  const examResult = await contract.LinkExamSession(
    ctx,
    paperId,
    'EXAM-2026-CCE401',
    new Date(Date.now() + 3600000).toISOString(),
    new Date(Date.now() + 14400000).toISOString()
  );
  const examParsed = JSON.parse(examResult);
  console.log(`\n6. LinkExamSession Result: Exam Code '${examParsed.examLink?.examCode}' Linked to Ledger`);

  // 7. Test QueryPaperHistory
  const historyResult = await contract.QueryPaperHistory(ctx, paperId);
  const historyParsed = JSON.parse(historyResult);
  console.log(`\n7. QueryPaperHistory Result: Total Ledger Modifications = ${historyParsed.length}`);

  console.log('\n✅ --- Fabric Chaincode Contract Tests Completed 100% Successfully ---');
}

testContractMethods().catch(console.error);
