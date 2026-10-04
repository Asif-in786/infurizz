import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "infurizz_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET must be set to at least 16 characters.");
  }
  return value;
}

function seal(userId: string) {
  const mac = createHmac("sha256", secret()).update(userId).digest("base64url");
  return `${userId}.${mac}`;
}

function open(token: string | undefined) {
  if (!token) return null;
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const userId = token.slice(0, split);
  const mac = token.slice(split + 1);
  const expected = createHmac("sha256", secret()).update(userId).digest("base64url");
  const actual = Buffer.from(mac);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  return userId;
}

export async function readSessionUserId() {
  const jar = await cookies();
  return open(jar.get(COOKIE)?.value);
}

export async function writeSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, seal(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
