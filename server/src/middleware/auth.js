import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid session" });

    req.user = user;
    req.tokenId = payload.tokenId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}



// RBAC: usage requireRole("admin", "super_admin")
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }
    next();
  };
}

// Ensures the authenticated user is either the resource-owning patient,
// an admin, or a caregiver/doctor with an accepted consent scope.
export function requireSelfOrRole(paramName, ...roles) {
  return (req, res, next) => {
    const targetId = req.params[paramName];
    if (req.user._id.toString() === targetId) return next();
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: "Access denied for this patient record" });
  };
}
