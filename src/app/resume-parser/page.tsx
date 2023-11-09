"use client";
import { useState, useEffect } from "react";
import { readPdf } from "lib/parse-resume-from-pdf/read-pdf";
import type { TextItems } from "lib/parse-resume-from-pdf/types";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { ResumeDropzone } from "components/ResumeDropzone";
import { cx } from "lib/cx";
import { Heading, Link, Paragraph } from "components/documentation";
import { ResumeTable } from "resume-parser/ResumeTable";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { ResumeParserAlgorithmArticle } from "resume-parser/ResumeParserAlgorithmArticle";
import { Resume } from "components/Resume";
import type { Resume as ResumeType } from "lib/redux/types";

const RESUME_EXAMPLES = [
  {
    fileUrl: "resume-example/laverne-resume.pdf",
    description: (
      <span>
        Borrowed from University of La Verne Career Center -{" "}
        <Link href="https://laverne.edu/careers/wp-content/uploads/sites/15/2010/12/Undergraduate-Student-Resume-Examples.pdf">
          Link
        </Link>
      </span>
    ),
  },
  {
    fileUrl: "resume-example/openresume-resume.pdf",
    description: (
      <span>
        Created with OpenResume resume builder -{" "}
        <Link href="/resume-builder">Link</Link>
      </span>
    ),
  },
];

const defaultFileUrl = RESUME_EXAMPLES[0]["fileUrl"];
export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [textItems, setTextItems] = useState<TextItems>([]);
  let resumes: ResumeType[] = [];

  const handleExportClick = () => {
    const csvValue: string[] = resumes.flatMap(resume => {
      const profile = resume.profile;
      return Object.keys(profile).map(key => `${key}:${profile[key]}\n`);
    });
  
    // Uncomment and modify the following sections similarly if needed
    // const educations = resume.educations.map((education, i) => 
    //   Object.keys(education).filter(key => key !== 'descriptions').map(key => `Education ${i}:${education[key]}\n`)
    // );
    // csvValue = [...csvValue, ...educations];
  
    // const workExperiences = resume.workExperiences.map((workExperience, i) => 
    //   Object.keys(workExperience).filter(key => key !== 'descriptions').map(key => `Work ${i}:${workExperience[key]}\n`)
    // );
    // csvValue = [...csvValue, ...workExperiences];
  
    const blob = new Blob(csvValue.map((data) => new Blob([data], { type: "text/csv" })), { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  
  useEffect(() => {
    async function test() {
      const fileUrls = fileUrl.split(";;;");
      for (let i = 0; i < fileUrls.length-1; i++){
        const textItems = await readPdf(fileUrls[i]);
        // setTextItems(textItems);
        const lines = groupTextItemsIntoLines(textItems || []);
        const sections = groupLinesIntoSections(lines);
        resumes.push(extractResumeFromSections(sections));
      }
    }
    test();
  }, [fileUrl]);

  return (
    <main className="h-full w-full overflow-hidden">
      <div className="grid md:grid-cols-6">
        <div className="flex justify-center px-2 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-end">
          <section className="mt-5 grow px-4 md:max-w-[600px] md:px-0">
            <div className="aspect-h-[9.5] aspect-w-7">
              <iframe src={`${fileUrl}#navpanes=0`} className="h-full w-full" />
            </div>
          </section>
          <FlexboxSpacer maxWidth={45} className="hidden md:block" />
        </div>
        <div className="flex px-6 text-gray-900 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:overflow-y-scroll">
          <FlexboxSpacer maxWidth={45} className="hidden md:block" />
          <section className="max-w-[600px] grow">
            <Heading className="text-primary !mt-4">
              Resume Parser Playground
            </Heading>
            <Paragraph smallMarginTop={true}>
              This playground showcases the OpenResume resume parser and its
              ability to parse information from a resume PDF. Click around the
              PDF examples below to observe different parsing results.
            </Paragraph>
            <div className="mt-3 flex gap-3">
              {RESUME_EXAMPLES.map((example, idx) => (
                <article
                  key={idx}
                  className={cx(
                    "flex-1 cursor-pointer rounded-md border-2 px-4 py-3 shadow-sm outline-none hover:bg-gray-50 focus:bg-gray-50",
                    example.fileUrl === fileUrl
                      ? "border-blue-400"
                      : "border-gray-300"
                  )}
                  onClick={() => setFileUrl(example.fileUrl)}
                  onKeyDown={(e) => {
                    if (["Enter", " "].includes(e.key))
                      setFileUrl(example.fileUrl);
                  }}
                  tabIndex={0}
                >
                  <h1 className="font-semibold">Resume Example {idx + 1}</h1>
                  <p className="mt-2 text-sm text-gray-500">
                    {example.description}
                  </p>
                </article>
              ))}
            </div>
            <Paragraph>
              You can also{" "}
              <span className="font-semibold">add your resume below</span> to
              access how well your resume would be parsed by similar Application
              Tracking Systems (ATS) used in job applications. The more
              information it can parse out, the better it indicates the resume
              is well formatted and easy to read. It is beneficial to have the
              name and email accurately parsed at the very least.
            </Paragraph>
            <div className="mt-3">
              <ResumeDropzone
                onFileUrlChange={(fileUrl) =>
                   setFileUrl(fileUrl || defaultFileUrl)
                }
                playgroundView={true}
              />
            </div>
            <Heading level={2} className="!mt-[1.2em]">
              Resume Parsing Results
            </Heading>
            {/* <ResumeTable resume={resumes[0]} />  */}
            <button id="exportButton" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            style={{ marginTop: '10px' }}
            onClick={handleExportClick}>Export to CSV </button>
            <div className="pt-24" />
          </section>
        </div>
      </div>
    </main>
  );
}
