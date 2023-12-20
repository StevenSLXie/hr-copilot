"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Head from 'next/head';
import logoSrc from "public/logo.jpeg";
import { cx } from "lib/cx";
import { UserButton } from "@clerk/nextjs";

export const TopNavBar = () => {
  const pathName = usePathname();
  const isHomePage = pathName === "/";

  return (
    <header
      aria-label="Site Header"
      className={cx(
        "flex h-[var(--top-nav-bar-height)] items-center border-b-2 border-gray-100 px-3 lg:px-12",
        isHomePage && "bg-dot"
      )}
    >
      <div className="flex h-15 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 items-center justify-between">
        <Link href="/">
          <span className="sr-only">Recruitment Copilot</span>
        </Link>
        
        <nav
          aria-label="Site Nav Bar"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <div>
            <UserButton afterSignOutUrl="/"/>
          </div>
          {[
            ["/resume-diagnosis", "Resume Analyzer"],
            ["/resume-questions", "Interview Q&A"],
            ["/resume-parser", "For Recruiters"],
          ].map(([href, text]) => (
            <Link
              key={text}
              className="rounded-md px-1.5 py-2 text-black-500 hover:bg-black-100 focus-visible:bg-gray-100 lg:px-4"
              href={href}
            >
              {text}
            </Link>
          ))}
          {/* <div className="ml-1 mt-1">
            <iframe
              src="https://ghbtns.com/github-btn.html?user=stevenslxie&repo=hr-copilot&type=star&count=true"
              width="100"
              height="20"
              className="overflow-hidden border-none"
              title="GitHub"
            />
          </div> */}
        </nav>
      </div>
    </header>
  );
};
