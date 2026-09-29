const prisma = require('../config/db');

/**
 * Time-Lock Service
 * Evaluates whether current system time falls within authorized exam release window
 */
class TimeLockService {
  /**
   * Evaluate time-lock access for a given question paper
   * @param {string} paperId 
   * @param {Date} [currentTime=new Date()] 
   * @returns {Promise<{ allowed: boolean, result: string, denialReason?: string, timeDeltaSeconds?: number, exam?: object }>}
   */
  static async evaluateAccessWindow(paperId, currentTime = new Date()) {
    const paper = await prisma.questionPaper.findUnique({
      where: { id: paperId },
      include: {
        exam: true,
        encryptionMetadata: true
      }
    });

    if (!paper) {
      return {
        allowed: false,
        result: 'DENIED_NOT_FOUND',
        denialReason: 'Question paper does not exist.'
      };
    }

    // Check emergency freeze status
    if (paper.status === 'FROZEN') {
      return {
        allowed: false,
        result: 'DENIED_FROZEN',
        denialReason: 'ACCESS DENIED: Question paper has been FROZEN by Security Administrator due to a security incident.'
      };
    }

    // Check post-exam closed status or key revocation
    if (paper.status === 'CLOSED' || paper.encryptionMetadata?.isRevoked) {
      return {
        allowed: false,
        result: 'DENIED_CLOSED',
        denialReason: 'ACCESS DENIED: Examination session is CLOSED and encryption keys have been revoked.'
      };
    }

    // Check if exam is linked
    if (!paper.exam) {
      return {
        allowed: false,
        result: 'DENIED_NO_SCHEDULE',
        denialReason: 'ACCESS DENIED: Paper is not yet linked to an official examination session schedule.'
      };
    }

    const { startTime, endTime } = paper.exam;
    const now = currentTime.getTime();
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    // Premature attempt before start time
    if (now < startMs) {
      const timeDeltaSeconds = Math.ceil((startMs - now) / 1000);
      return {
        allowed: false,
        result: 'DENIED_PREMATURE',
        denialReason: `ACCESS DENIED (PREMATURE ATTEMPT): Time-lock is ACTIVE. Examination starts in ${Math.ceil(timeDeltaSeconds / 60)} minute(s).`,
        timeDeltaSeconds,
        exam: paper.exam
      };
    }

    // Expired attempt after end time
    if (now > endMs) {
      return {
        allowed: false,
        result: 'DENIED_EXPIRED',
        denialReason: 'ACCESS DENIED: Examination time window has expired.',
        exam: paper.exam
      };
    }

    // Authorized window active!
    return {
      allowed: true,
      result: 'GRANTED',
      exam: paper.exam
    };
  }
}

module.exports = TimeLockService;
