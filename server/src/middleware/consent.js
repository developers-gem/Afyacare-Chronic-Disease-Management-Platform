import { Consent } from "../models/Family.js";

// Enforces granular consent at the API level for caregivers/doctors viewing
// a patient's data. Patient viewing their own data, and admins, always pass.
export function requireConsentScope(scope, patientParam = "patientId") {
  return async (req, res, next) => {
    const patientId = req.params[patientParam] || req.query.patientId;
    if (!patientId) return res.status(400).json({ error: "patientId is required" });

    if (req.user._id.toString() === patientId) return next();
    if (["admin", "super_admin"].includes(req.user.role)) return next();

    const consent = await Consent.findOne({ patient: patientId, grantee: req.user._id });
    if (!consent || !consent.scopes[scope]) {
      return res.status(403).json({ error: `No consent granted for ${scope}` });
    }
    next();
  };
}
