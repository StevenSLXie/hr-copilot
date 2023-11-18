"use client";
import { useState, useEffect } from "react";
import { readPdf } from "lib/parse-resume-from-pdf/read-pdf";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Link, Paragraph } from "components/documentation";
import { ResumeDisplay } from "resume-parser/ResumeDisplay";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import type { Resume as ResumeType } from "lib/redux/types";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";


const defaultFileUrl = "";

// Client-side code
async function callGpt(text: string) {
  console.time('callGpt Execution Time');
  const response = await fetch('/api/callGpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error('Failed to parse resume');
  }
  const jsonResponse = await response.json();
  console.log(`Response content: ${jsonResponse}`);
  const resumeContent = jsonResponse['text']['message']['content'].replace('```json\n', '').replace('\n```', '');
  const resume: ResumeType = JSON.parse(resumeContent);
  console.log(resume.profile.name);
  console.timeEnd('callGpt Execution Time');
  return resume;
}

export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [resumes, setResumes] = useState<ResumeType[]>([]);

  const handleUpdateResumes = (resume: ResumeType) => {
    setResumes(prevResumes => [...prevResumes, resume]);
  };

  const handleExportClick = () => {
    const csvValue: string[] = resumes.flatMap(resume => {
      const profile = resume.profile;
      return Object.keys(profile).map(key => `${key}:${profile[key]}\n`);
    });
  
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
        const lines = groupTextItemsIntoLines(textItems || []);
        const sections = groupLinesIntoSections(lines || []);
        const resume = extractResumeFromSections(sections);
        const concatenatedString = lines.map(line => line.map(item => item.text).join(' ')).join('\n');
        // console.log(concatenatedString);
        // const resume = await callGpt(concatenatedString);
        handleUpdateResumes(resume);
      }
    }
    test();
  }, [fileUrl]);

  return (
    <main className="h-full w-full overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="flex px-6 text-gray-900 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:overflow-y-scroll">
          <FlexboxSpacer maxWidth={45} className="hidden md:block" />
          <section className="max-w-[1200px] grow">
            <Heading className="text-primary !mt-4">
              Resume Parser Playground
            </Heading>
            <Paragraph>
              You can also{" "}
              <span className="font-semibold">add your PDF resume(s) below</span> to
              batch process them and display the aggregated information in a table
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
            <ResumeDisplay resumes={resumes} />
            <button id="exportButton" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            style={{ marginTop: '10px' }}
            onClick={handleExportClick}>Export {resumes.length} resumes to CSV </button>
            <div className="pt-24" />
          </section>
        </div>
      </div>
    </main>
  );
}
