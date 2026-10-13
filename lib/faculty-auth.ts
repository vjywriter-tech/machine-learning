import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ml_faculty_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function signature(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function passwordMatches(received: string) {
  const expected = process.env.FACULTY_PASSWORD || "";
  const a = Buffer.from(received), b = Buffer.from(expected);
  return Boolean(expected) && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createFacultySession() {
  const expires = Date.now() + 8 * 60 * 60_000;
  const body = Buffer.from(JSON.stringify({ expires })).toString("base64url");
  (await cookies()).set(COOKIE_NAME, `${body}.${signature(body)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
}

export async function clearFacultySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isFacultyAuthenticated() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [body, received] = token.split(".");
  if (!body || !received) return false;
  const expected = signature(body), a = Buffer.from(received), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")).expires > Date.now(); } catch { return false; }
}
