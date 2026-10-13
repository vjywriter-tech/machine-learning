import ExamClient from "./exam-client";
import { setFromAccessToken } from "@/lib/exam";
export default async function ExamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const accessToken = decodeURIComponent(token);
  if (!setFromAccessToken(accessToken)) {
    return <main className="center-page"><section className="start-panel"><div className="brand-mark">!</div><p className="eyebrow">INVALID EXAMINATION LINK</p><h1>This question set is not available</h1><p className="muted">Use the complete private link shared by your faculty. Changing any part of the link makes it invalid.</p></section></main>;
  }
  return <ExamClient accessToken={accessToken} />;
}
