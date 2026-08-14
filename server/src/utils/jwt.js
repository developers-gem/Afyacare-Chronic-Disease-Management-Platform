import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, tokenId: uuidv4() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

export function signRefreshToken(user, tokenId) {
  return jwt.sign(
    { sub: user._id.toString(), tokenId: tokenId || uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
