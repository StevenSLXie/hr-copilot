import "globals.css";
import { TopNavBar } from "components/TopNavBar";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: "Recruitment Copilot | Get instant feedback on your resume",
  description:
    "Resume Review | Resume Feedback | Resume Analysis | Free trial, no signup, no subscription",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body>
        <TopNavBar />
        {children}
        <Analytics />
      </body>
    </html>
    </ClerkProvider>
  );
}
