import { clearFacultySession } from "@/lib/faculty-auth";
export async function POST() { await clearFacultySession(); return Response.json({ success: true }); }
