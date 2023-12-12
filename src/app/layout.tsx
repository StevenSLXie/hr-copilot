import "globals.css";
import { TopNavBar } from "components/TopNavBar";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Recruitment Copilot - Turbocharge your resume",
  description:
    "Experience our free trial, no signup, no monthly plan! Let Recruitment Copilot turbocharge your resume and skyrocket your job success rate",
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
