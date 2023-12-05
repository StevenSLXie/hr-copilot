import "globals.css";
import { TopNavBar } from "components/TopNavBar";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Recruitment Copilot - Every Recruiter Needs a Copilot",
  description:
    "Free trials. No signup needed. Recruitment Copilot parses PDF resumes in batches and save them in a Excel file",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* <TopNavBar /> */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
