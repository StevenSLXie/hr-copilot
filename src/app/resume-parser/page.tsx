"use client";
import { useState, useEffect } from "react";
import { readPdf, readDocx } from "lib/parse-resume-from-pdf/read-file";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Link, Paragraph } from "components/documentation";
import { ResumeDisplay } from "resume-parser/ResumeDisplay";
import {ProgressBar} from "resume-parser/ProgressBar";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import type { Resume as ResumeType } from "lib/redux/types";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";
import { BULLET_POINTS } from 'lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points';
import { utils, writeFile } from 'xlsx';
import { LIMITS, DUMMY_RESUME } from '../../constants';
import CheckoutForm from "resume-parser/CheckoutForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const defaultFileUrl = "";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Client-side code
async function callGpt(text: string) {
  const response = await fetch('/api/callGpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    return DUMMY_RESUME;
  } else {
    const jsonResponse = await response.json();
    try {
      const resumeContent = jsonResponse['text']['message']['content'].replace('```json\n', '').replace('\n```', '');
      const resume: ResumeType = JSON.parse(resumeContent);
      return resume;
    } catch (error){
      console.error('Error parsing resume:', error);
      return DUMMY_RESUME;
    }
  }
}

export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [resumes, setResumes] = useState<ResumeType[]>([]);
  const [isParsingFinished, setIsParsingFinished] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(LIMITS.DEFAULT_DISPLAY_LIMIT);
  const [isPaid, setIsPaid] = useState(false); 
  const [isPaymentFailed, setIsPaymentFailed] = useState(false); 
  const [progressBarDuration, setProgressBarDuration] = useState(1000000);

  const handleUpdateResumes = (resume: ResumeType) => {
    setResumes(prevResumes => [...prevResumes, resume]);
  };

  const handlePaymentSuccess = () => {
    setDisplayLimit(LIMITS.MAX_INT);
    setIsPaid(true);
  };

  const handlePaymentFailure = () => {
    setIsPaymentFailed(true);
  };

  const saveTableToExcel = () => {
    const table = document.getElementById("resumeDisplay");
    if (!table) return;
  
    // Get all the rows of the table
    const rows = table.querySelectorAll("tr");
    // Initialize an empty array to hold the table data
    const data = [];
    // Loop through each row
    for (const row of rows) {
      // Get all the cells in the row
      const cells = row.querySelectorAll("td, th");
      // Get the text content of each cell and add it to the data array
      data.push([...cells].map(cell => cell.textContent || ""));
    }
    // Create a worksheet
    const ws = utils.aoa_to_sheet(data);
    // Create a new workbook
    const wb = utils.book_new();
    // Append the worksheet to the workbook
    utils.book_append_sheet(wb, ws, "Sheet1");
    // Write the workbook to a file
    writeFile(wb, "resume_info.xlsx");
  };


  useEffect(() => {
    async function test() {
      if (fileUrl === '') {
        setResumes([]);
      }

      setIsParsingFinished(false);
      setProgressBarDuration(fileUrl ? fileUrl.split(';;;').length - 1 : 0);
      const fileUrls = fileUrl.split(';;;');
      const filesToProcess = fileUrls.length > LIMITS.NUM_RESUMES ? LIMITS.NUM_RESUMES : fileUrls.length - 1;
      setProgressBarDuration(filesToProcess > 0 ? filesToProcess : 0);
      const processingPromises = fileUrls.slice(0, filesToProcess).map(async (fileUrl) => {
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
          let previousLineContainsBullet = false;
          let filteredLines = [];
          // three strategies to reduce input text to GPT
          // 1. remove bullet points
          // 2. remove lines starting with lowercase letters and previous line contains bullet points
          // 3. remove lines longer than 400px and item count = 1
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].map(item => item.text).join(' ');
            const textWidth = (lines[i].map(item => item.width).reduce((sum, current) => sum + current, 0));
            const itemCounts = lines[i].length
            const lineStartsWithLowercase = line.charAt(0).toLowerCase() === line.charAt(0);         
            if (!BULLET_POINTS.some(bullet => line[0].includes(bullet)) && 
                !(previousLineContainsBullet && lineStartsWithLowercase) && (textWidth < LIMITS.PIXEL_WIDTH_LIMIT || itemCounts > 1)) {
              filteredLines.push(line);
            }
            previousLineContainsBullet = BULLET_POINTS.some(bullet => line[0].includes(bullet));
          }
          const concatenatedString = filteredLines.join('\n');
          // console.log(concatenatedString);

          // if too many lines, too rules directly
          const lineLimit = LIMITS.LINE_LIMIT;
          if (filteredLines.length > lineLimit){
            handleUpdateResumes(resumeRule);
          }else {
            console.time('callGptTime for' + filteredLines.length + ' lines');
            const resumeAi = await callGpt(concatenatedString);
            console.timeEnd('callGptTime for' + filteredLines.length + ' lines');
            if (resumeAi.profile.name === DUMMY_RESUME.profile.name) {
              handleUpdateResumes(resumeRule);
            } else {
              handleUpdateResumes(resumeAi);
            }
          }
      });
      await Promise.all(processingPromises);
      setIsParsingFinished(true);
    }
    test();
  }, [fileUrl]);

  return (
    <main className="h-full w-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="flex px-2 text-gray-900 h-[calc(100vh-var(--top-nav-bar-height))] overflow-y-scroll sm:col-span-3">
          <FlexboxSpacer maxWidth={45} className="hidden sm:block" />
          <section className="max-w-full sm:max-w-[1920px] grow">
            <Heading className="text-primary !mt-4">
              Recruitment Copilot
            </Heading>
            <Paragraph>
              <span className="font-semibold">Upload .pdf resumes in batch </span>for processing, aggregation, and Excel download, with 99% accuracy. 
            </Paragraph>
            <ul className="mt-2 text-base list-disc list-inside pl-5">
              <li>The first 3 resumes are processed for free.</li>
              <li>For any additional resumes beyond the first 3, there's a charge of $0.1 USD per resume, with a minimum total charge of $1 USD.</li>
              <li>No need to signup or subscribe. You only pay for what you use.</li>
              <li>We welcome your feedback and inquiries about customized solutions. Please contact us at <a href="mailto:hr.copilot.beta@gmail.com">hr.copilot.beta@gmail.com</a></li>
            </ul>
            
            <div className="mt-3">
              <ResumeDropzone
                onFileUrlChange={(fileUrl) =>
                   setFileUrl(fileUrl || defaultFileUrl)
                }
                playgroundView={true}
              />
            </div>
            {fileUrl !== '' && <Heading level={2} className="text-primary !mt-4">
              Resume Parsing Results
            </Heading>}
            {fileUrl !== '' && <p className="text-gray-500 mt-4 text-small">
              AI-powered engine takes time to comprehend your resumes. Please stay on this page until the parsing is finished.
              </p>}
            {fileUrl !== '' && <ProgressBar duration={progressBarDuration * LIMITS.DEFAULT_WAITTIME} isFinished={isParsingFinished} />}
            <div id="resumeDisplay">
              <ResumeDisplay resumes={resumes} limit={displayLimit} />
            </div>
            {(isPaid || (resumes.length <= displayLimit && resumes.length > 0)) && <div>
              <button 
                id="exportButton" 
                className="bg-blue-400 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mt-4"
                onClick={saveTableToExcel}>Download Table</button>
            </div>}   
            {resumes.length > displayLimit && 
            <p className="text-gray-500 mt-2 text-xs">
               <span className="font-semibold">First {LIMITS.DEFAULT_DISPLAY_LIMIT} resumes are shown above for your preview. Pay {Math.max(resumes.length * 0.1, 1)} USD to download all {resumes.length} resumes.</span>
            </p>}

            {resumes.length > displayLimit && 
            <div id="checkoutButton">
              <Elements stripe={stripePromise}>
                <CheckoutForm amount={Math.max(resumes.length * 0.1, 1)} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure}/>
              </Elements>
            </div>
            }

            {isPaymentFailed && <p className="text-red-500 mt-2 text-xs">Payment failed! Please check you credit card credentials</p>}

            <hr className="border-gray-500 mt-4" />
            <p className="text-black-500 mt-2 text-xs">
              - <span className="font-semibold"> If you're interested in accessing the full version of Recruitment Copilot or have any suggestions, please write to <a href="mailto:hr.copilot.beta@gmail.com">hr.copilot.beta@gmail.com</a>. </span>
            </p>    
            <p className="text-gray-500 mt-2 text-xs">
              - Recruitment Copilot respects your privacy and never retains your data. At the same time, please note that part of the information in resumes is processed via the OpenAI API. OpenAI has their own data usage policies. For more details, please refer to OpenAI's <a href="https://openai.com/policies" target="_blank" rel="noopener noreferrer">data usage policy</a>.
            </p>      
            <p className="text-gray-500 mt-2 text-xs">
              - Recruitment Copilot provides information for reference only and is not responsible for any misunderstandings or misinterpretations. Use this service at your own discretion.
            </p> 
            <p className="text-gray-500 mt-2 text-xs">
              - Recruitment Copilot makes use of components in <a href="https://github.com/xitanggg/open-resume" target="_blank" rel="noopener noreferrer">Open Resume</a> and make substantial modifications. 
            </p>  
          </section>
        </div>
      </div>
    </main>
  );
}
