const { PrismaClient } = require('@prisma/client');
const { 
  verifyPaperIntegrity, 
  simulatePaperTampering, 
  restorePaperIntegrity 
} = require('../services/integrityService');

const prisma = new PrismaClient();

/**
 * Perform live cryptographic SHA-256 and AES-GCM verification for a question paper
 */
const checkPaperIntegrity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const ipAddress = req.ip;

    const report = await verifyPaperIntegrity(id, userId, ipAddress);

    return res.status(report.verified ? 200 : 409).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error verifying paper integrity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete cryptographic integrity audit.',
      error: error.message
    });
  }
};

/**
 * Simulate disk tampering by corrupting paper payload bytes
 */
const triggerSimulateTamper = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await simulatePaperTampering(id, userId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error simulating paper tamper:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute tamper simulation.',
      error: error.message
    });
  }
};

/**
 * Restore paper from clean vault backup
 */
const triggerRestoreTamper = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await restorePaperIntegrity(id, userId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error restoring paper integrity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore paper integrity.',
      error: error.message
    });
  }
};

/**
 * Get system-wide security alerts
 */
const getSecurityAlerts = async (req, res) => {
  try {
    const alerts = await prisma.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            subjectCode: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch security alerts.',
      error: error.message
    });
  }
};

module.exports = {
  checkPaperIntegrity,
  triggerSimulateTamper,
  triggerRestoreTamper,
  getSecurityAlerts
};
