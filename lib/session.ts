import { sign, verify } from "jsonwebtoken";
import type { NextRequest } from "next/server";

export type SessionPayload = {
  userId: string;
  role: string;
  workspaceId: string;
};

const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "loop-dev-secret";

export function createSessionToken(payload: SessionPayload) {
  return sign(payload, secret, { expiresIn: "7d" });
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get("loop_session")?.value;

  if (token) {
    try {
      return verify(token, secret) as SessionPayload;
    } catch {
      // Fall through to the header used by the current client-side pages.
    }
  }

  const headerUserId = req.headers.get("x-user-id");

  if (headerUserId) {
    return {
      userId: headerUserId,
      role: "",
      workspaceId: "",
    };
  }

  return null;
}
