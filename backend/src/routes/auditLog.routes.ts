import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import { AuditLogService } from "@/services/auditLog.service";

const router = Router();

/**
 * GET /api/admin/audit-logs
 * Get all audit logs (Admin only)
 */
router.get("/", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    const {
      organizationId,
      userId,
      action,
      status,
      startDate,
      endDate,
      limit = "50",
      skip = "0",
    } = req.query;

    const logs = await AuditLogService.getAuditLogs({
      organizationId: organizationId as string,
      userId: userId as string,
      action: action as any,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics
 */
router.get("/stats", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    const { organizationId } = req.query;
    const stats = await AuditLogService.getAuditStats(organizationId as string);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit stats" });
  }
});

/**
 * GET /api/admin/audit-logs/organization/:organizationId
 * Get audit logs for specific organization
 */
router.get(
  "/organization/:organizationId",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { limit = "50", skip = "0" } = req.query;

      const logs = await AuditLogService.getOrganizationAuditLogs(organizationId, {
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);

/**
 * GET /api/admin/audit-logs/user/:userId
 * Get audit logs for specific user
 */
router.get("/user/:userId", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = "20" } = req.query;

    const logs = await AuditLogService.getUserActivity(
      userId,
      parseInt(limit as string)
    );

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

export default router;
