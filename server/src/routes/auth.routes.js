import { Router } from "express";
import rateLimit from "express-rate-limit";
import User, { ROLE_LIST } from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: "fullName, email, phone, password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const safeRole = ROLE_LIST.includes(role) && role !== "super_admin" ? role : "patient";
    const user = new User({ fullName, email, phone, role: safeRole });
    await user.setPassword(password);
    await user.save();

    if (safeRole === "patient") {
      await PatientProfile.create({ user: user._id });
    }

    await logAuditRegister(req, user);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.status(201).json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

async function logAuditRegister(req, user) {
  req.user = user;
  await logAudit(req, { action: "auth.register", resourceType: "User", resourceId: user._id });
  delete req.user;
}

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await user.checkPassword(password || ""))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ error: "Account disabled" });

    const tokenId = uuidv4();
    user.sessions.push({ tokenId, userAgent: req.headers["user-agent"], ip: req.ip });
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, tokenId);

    req.user = user;
    await logAudit(req, { action: "auth.login", resourceType: "User", resourceId: user._id });

    res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Invalid session" });
    const session = user.sessions.find((s) => s.tokenId === payload.tokenId);
    if (!session) return res.status(401).json({ error: "Session revoked" });

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    req.user.sessions = req.user.sessions.filter((s) => s.tokenId !== req.tokenId);
    await req.user.save();
    await logAudit(req, { action: "auth.logout", resourceType: "User", resourceId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

// Simple OTP flow (demo: code is emailed back in dev; wire real SMS/Email in notifier)
router.post("/otp/request", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(404).json({ error: "No account with that email" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();
    console.log(`[otp:stub] code for ${email}: ${code}`);
    res.json({ ok: true, ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}) });
  } catch (err) {
    next(err);
  }
});

router.post("/otp/verify", authLimiter, async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.otp?.code) return res.status(400).json({ error: "No OTP pending" });
    if (user.otp.code !== code || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}); 

export default router;
