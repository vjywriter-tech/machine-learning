import "./globals.css";
export const metadata = { title: "GTU Machine Learning Examination", description: "Objective examination for Units 1 to 3 of GTU subject 3171114" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
