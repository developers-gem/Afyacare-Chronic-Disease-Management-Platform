import AuditLog from "../models/AuditLog.js";

export async function logAudit(req, { action, resourceType, resourceId, metadata }) {
  try {
    await AuditLog.create({
      user: req.user?._id,
      role: req.user?.role,
      action,
      resourceType,
      resourceId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata,
    });
  } catch (err) {
    console.error("[audit] failed to log", action, err.message);
  }
}

// Express middleware factory for simple "logged after response sent" auditing.
export function auditAction(actionFn) {
  return async (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode < 400) {
        const { action, resourceType, resourceId, metadata } = actionFn(req, res);
        logAudit(req, { action, resourceType, resourceId, metadata });
      }
    });
    next();
  };
}
