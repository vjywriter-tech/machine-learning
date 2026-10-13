import { configuredSets } from "@/lib/exam";
import { isFacultyAuthenticated } from "@/lib/faculty-auth";
import { listResults } from "@/lib/r2";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await isFacultyAuthenticated())) return Response.json({ error: "Faculty login required." }, { status: 401 });
  try {
    const origin = new URL(request.url).origin;
    const results = (await listResults()).sort((a, b) => a.score - b.score || a.studentName.localeCompare(b.studentName));
    const sets = configuredSets().map(({ id, name, token }) => ({ id, name, configured: Boolean(token), link: token ? `${origin}/exam/${encodeURIComponent(token)}` : "" }));
    return Response.json({ results, sets });
  } catch (error) {
    console.error("Faculty results failed", error);
    return Response.json({ error: "Results could not be loaded. Confirm R2 read/list permission and environment variables." }, { status: 500 });
  }
}
