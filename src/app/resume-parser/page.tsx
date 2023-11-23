"use client";
import { useState, useEffect } from "react";
import { readPdf, readDocx } from "lib/parse-resume-from-pdf/read-file";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Link, Paragraph } from "components/documentation";
import { ResumeDisplay } from "resume-parser/ResumeDisplay";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import type { Resume as ResumeType } from "lib/redux/types";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";


const defaultFileUrl = "";
const dummyName = "DummyDummy";

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
    const dummyResume: ResumeType = {
      profile: {
        name: dummyName,
        email: "",
        phone: "",
        url: "",
        summary: "",
        location: ""
      },
      workExperiences: [],
      educations: [],
      projects: [],
      skills: {
        featuredSkills: [],
        descriptions: []
      },
      custom: {
        descriptions: []
      }
    };
    console.timeEnd('callGpt Execution Time');
    return dummyResume;
  } else {
    const jsonResponse = await response.json();
    console.log(`Response content: ${jsonResponse}`);
    const resumeContent = jsonResponse['text']['message']['content'].replace('```json\n', '').replace('\n```', '');
    const resume: ResumeType = JSON.parse(resumeContent);
    console.log(resume.profile.name);
    console.timeEnd('callGpt Execution Time');
    return resume;
  }
}

export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [resumes, setResumes] = useState<ResumeType[]>([]);
  const [message, setMessage] = useState("");

  const handleUpdateResumes = (resume: ResumeType) => {
    setResumes(prevResumes => [...prevResumes, resume]);
  };

  const copyTableToClipboard = async () => {
    const table = document.getElementById("resumeDisplay");
    if (!table) return;

    // Get all the rows of the table
    const rows = table.querySelectorAll("tr");
    // Initialize an empty array to hold the CSV data
    const csv = [];
    // Loop through each row
    for (const row of rows) {
      // Get all the cells in the row
      const cells = row.querySelectorAll("td, th");
      // Get the text content of each cell and add it to the csv array
      csv.push([...cells].map(cell => cell.textContent ? `"${cell.textContent.replace(/"/g, '""')}"` : "").join(","));
    }
    // Join all the rows with newline characters to form the CSV string
    const csvString = csv.join("\n");
    try {
      // Copy the CSV string to the clipboard
      await navigator.clipboard.writeText(csvString);
      console.log('Table copied to clipboard');
      setMessage("Table copied to clipboard; paste it in a spreadsheet (e.g., Excel)");  // Set the message
    } catch (err) {
      console.error('Failed to copy table: ', err);
      setMessage("Failed to copy table to clipboard");
    }
  };


  useEffect(() => {
    async function test() {
      const fileUrls = fileUrl.split(";;;");
      for (let i = 0; i < fileUrls.length-1; i++){
        const fileUrl = fileUrls[i];
        const fileExtension = 'pdf'; //fileUrl.split('.').pop();
        console.log(`File extension: ${fileUrl} ${fileExtension}`);

        let textItems;
        if (fileExtension === 'pdf') {
          // textItems = await readPdf(fileUrl.split('.')[0]);
          textItems = await readPdf(fileUrl);
        } else if (fileExtension === 'docx') {
          textItems = await readDocx(fileUrl.split('.')[0]);
        } else {
          throw new Error(`Unsupported file extension: ${fileExtension}`);
        }
        const lines = groupTextItemsIntoLines(textItems || []);
        const sections = groupLinesIntoSections(lines || []);
        const resumeRule = extractResumeFromSections(sections);
        const concatenatedString = lines.map(line => line.map(item => item.text).join(' ')).join('\n');
        console.log(concatenatedString);
        console.log(sections)
        const resumeAi = await callGpt(concatenatedString);
        if (resumeAi.profile.name == dummyName) {
          handleUpdateResumes(resumeRule);} else{
          handleUpdateResumes(resumeAi);
          }
      }
    }
    test();
  }, [fileUrl]);

  return (
    <main className="h-full w-full overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className="flex px-6 text-gray-900 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:overflow-y-scroll">
          <FlexboxSpacer maxWidth={45} className="hidden md:block" />
          <section className="max-w-[1920px] grow">
            <Heading className="text-primary !mt-4">
              Resume Parser 
            </Heading>
            <Paragraph>
              You can {" "}
              <span className="font-semibold">add your .pdf/.docx resume(s) below</span> to
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
            <Heading level={2} className="text-primary !mt-4">
              Resume Parsing Results
            </Heading>
            <div id="resumeDisplay">
              <ResumeDisplay resumes={resumes} />
            </div>
            <div>
              <button 
                id="exportButton" 
                className="bg-blue-400 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                style={{ marginTop: '20px' }}
                onClick={copyTableToClipboard}>Copy Table</button>
              <p>{message}</p>
            </div>            
          </section>
        </div>
      </div>
    </main>
  );
}
