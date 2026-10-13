import Link from "next/link";
export default function Home() {
  return <main className="center-page"><section className="welcome-panel"><div className="brand-mark">ML</div><p className="eyebrow">GTU SUBJECT 3171114</p><h1>Introduction to Machine Learning</h1><p className="muted">Use the private examination link shared by your faculty. Question-set links are not listed on this page.</p><Link className="text-link" href="/faculty">Faculty login</Link></section></main>;
}
