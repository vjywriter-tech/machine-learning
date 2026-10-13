import crypto from "crypto";
import { preparedQuestions, verifyAttemptToken } from "@/lib/exam";
import { SET_NAMES } from "@/lib/questions";
import { resultExists, saveResult } from "@/lib/r2";
import type { ExamResult } from "@/lib/types";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const attempt = verifyAttemptToken(String(body.attemptToken || ""));
    if (await resultExists(attempt.setId, attempt.enrollmentNumber)) return Response.json({ error: "This examination has already been submitted." }, { status: 409 });
    const answers = (body.answers && typeof body.answers === "object" ? body.answers : {}) as Record<string, number>;
    const questions = preparedQuestions(attempt.setId, attempt.nonce);
    const responses = questions.map((question) => {
      const selected = Number.isInteger(answers[question.id]) ? answers[question.id] : null;
      return { questionId: question.id, selected, correct: selected === question.answer };
    });
    const score = responses.filter((item) => item.correct).length;
    const submittedAt = Date.now();
    const result: ExamResult = {
      id: crypto.randomUUID(), setId: attempt.setId, setName: SET_NAMES[attempt.setId], enrollmentNumber: attempt.enrollmentNumber,
      studentName: attempt.studentName, score, totalMarks: questions.length, percentage: Math.round((score / questions.length) * 10000) / 100,
      answeredCount: responses.filter((item) => item.selected !== null).length, startedAt: new Date(attempt.startedAt).toISOString(),
      submittedAt: new Date(submittedAt).toISOString(), durationSeconds: Math.max(0, Math.round((submittedAt - attempt.startedAt) / 1000)), responses
    };
    await saveResult(result);
    return Response.json({ success: true, setName: result.setName, studentName: result.studentName, enrollmentNumber: result.enrollmentNumber, score: result.score, totalMarks: result.totalMarks, percentage: result.percentage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed.";
    const status = /expired|Invalid attempt/.test(message) ? 400 : 500;
    console.error("Exam submission failed", error);
    return Response.json({ error: status === 400 ? message : "The result could not be saved. Please inform the faculty." }, { status });
  }
}
