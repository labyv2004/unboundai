import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "../routes/auth.js";

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req as any);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.userId = payload.userId;
  req.username = payload.username;
  next();
}
