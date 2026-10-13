import { createFacultySession, passwordMatches } from "@/lib/faculty-auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!passwordMatches(String(password || ""))) return Response.json({ error: "Incorrect faculty password." }, { status: 401 });
    await createFacultySession();
    return Response.json({ success: true });
  } catch { return Response.json({ error: "Faculty login is not configured correctly." }, { status: 500 }); }
}
