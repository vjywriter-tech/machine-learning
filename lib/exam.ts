import crypto from "crypto";
import { QUESTION_SETS, SET_NAMES } from "./questions";
import type { PublicQuestion, Question, SetId } from "./types";

export const EXAM_MINUTES = 20;
const GRACE_MINUTES = 3;

const tokenEnv: Record<SetId, string> = {
  "set-1": "EXAM_SET_1_TOKEN",
  "set-2": "EXAM_SET_2_TOKEN",
  "set-3": "EXAM_SET_3_TOKEN",
  "set-4": "EXAM_SET_4_TOKEN"
};

export function configuredSets() {
  return (Object.keys(tokenEnv) as SetId[]).map((id) => ({
    id,
    name: SET_NAMES[id],
    token: process.env[tokenEnv[id]]?.trim() || ""
  }));
}

export function setFromAccessToken(token: string): SetId | null {
  const found = configuredSets().find((set) => set.token && safeEqual(set.token, token));
  return found?.id ?? null;
}

export function normalizeEnrollment(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function validEnrollment(value: string) {
  return /^[A-Z0-9/-]{6,30}$/.test(value);
}

type AttemptPayload = {
  setId: SetId;
  enrollmentNumber: string;
  studentName: string;
  nonce: string;
  startedAt: number;
  expiresAt: number;
};

function signingSecret() {
  const value = process.env.EXAM_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error("EXAM_SIGNING_SECRET must contain at least 32 characters.");
  return value;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createAttemptToken(input: Omit<AttemptPayload, "nonce" | "startedAt" | "expiresAt">) {
  const startedAt = Date.now();
  const payload: AttemptPayload = {
    ...input,
    nonce: crypto.randomBytes(18).toString("hex"),
    startedAt,
    expiresAt: startedAt + (EXAM_MINUTES + GRACE_MINUTES) * 60_000
  };
  const body = encode(payload);
  const signature = crypto.createHmac("sha256", signingSecret()).update(body).digest("base64url");
  return { token: `${body}.${signature}`, payload };
}

export function verifyAttemptToken(token: string): AttemptPayload {
  const [body, received] = token.split(".");
  if (!body || !received) throw new Error("Invalid attempt token.");
  const expected = crypto.createHmac("sha256", signingSecret()).update(body).digest("base64url");
  if (!safeEqual(expected, received)) throw new Error("Invalid attempt token.");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AttemptPayload;
  if (!QUESTION_SETS[payload.setId] || Date.now() > payload.expiresAt) throw new Error("This examination attempt has expired.");
  return payload;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function seededRandom(seedText: string) {
  const seed = crypto.createHash("sha256").update(`${signingSecret()}:${seedText}`).digest();
  let state = seed.readUInt32LE(0) || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function preparedQuestions(setId: SetId, nonce: string): Question[] {
  const random = seededRandom(`${setId}:${nonce}`);
  return shuffled(QUESTION_SETS[setId], random).map((question) => {
    const optionEntries = question.options.map((text, originalIndex) => ({ text, originalIndex }));
    const mixed = shuffled(optionEntries, random);
    return {
      ...question,
      options: mixed.map((entry) => entry.text) as Question["options"],
      answer: mixed.findIndex((entry) => entry.originalIndex === question.answer)
    };
  });
}

export function publicQuestions(setId: SetId, nonce: string): PublicQuestion[] {
  return preparedQuestions(setId, nonce).map(({ answer: _answer, ...question }) => question);
}
