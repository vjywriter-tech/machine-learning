import { createAttemptToken, EXAM_MINUTES, normalizeEnrollment, publicQuestions, setFromAccessToken, validEnrollment } from "@/lib/exam";
import { SET_NAMES } from "@/lib/questions";
import { resultExists } from "@/lib/r2";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const setId = setFromAccessToken(String(body.accessToken || ""));
    const enrollmentNumber = normalizeEnrollment(String(body.enrollmentNumber || ""));
    const studentName = String(body.studentName || "").trim().replace(/\s+/g, " ");
    if (!setId) return Response.json({ error: "This examination link is invalid or inactive." }, { status: 404 });
    if (!validEnrollment(enrollmentNumber)) return Response.json({ error: "Enter a valid enrollment number using 6-30 letters or digits." }, { status: 400 });
    if (studentName.length < 3 || studentName.length > 100) return Response.json({ error: "Enter the student's complete name." }, { status: 400 });
    if (await resultExists(setId, enrollmentNumber)) return Response.json({ error: "This enrollment number has already submitted this set." }, { status: 409 });
    const { token, payload } = createAttemptToken({ setId, enrollmentNumber, studentName });
    return Response.json({ attemptToken: token, setName: SET_NAMES[setId], minutes: EXAM_MINUTES, startedAt: payload.startedAt, endsAt: payload.startedAt + EXAM_MINUTES * 60_000, questions: publicQuestions(setId, payload.nonce) });
  } catch (error) {
    console.error("Exam start failed", error);
    return Response.json({ error: "The examination could not be started. Check the server configuration." }, { status: 500 });
  }
}
