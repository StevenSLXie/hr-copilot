import "globals.css";
import { TopNavBar } from "components/TopNavBar";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "HR Copilot - Every HR Professional Needs a Copilot",
  description:
    "HR Copilot parses PDF resumes in batches and parse them into a Excel-freiendly table",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TopNavBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
