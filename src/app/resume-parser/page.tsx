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
import { LIMITS, DUMMY_RESUME, VOUCHERS } from '../../constants';
import CheckoutForm from "resume-parser/CheckoutForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FootNote } from "components/FootNote";
import { postGptJsonReq } from "../../pages/api/postGptJsonReq";

const defaultFileUrl = "";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [resumes, setResumes] = useState<ResumeType[]>([]);
  const [isParsingFinished, setIsParsingFinished] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(LIMITS.DEFAULT_DISPLAY_LIMIT);
  const [isPaid, setIsPaid] = useState(false); 
  const [isPaymentFailed, setIsPaymentFailed] = useState(false); 
  const [progressBarDuration, setProgressBarDuration] = useState(1000000);
  const [voucherCode, setVoucherCode] = useState('');

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

  const handleVoucherSubmit = () => {
    if (VOUCHERS.includes(voucherCode)) {
      setDisplayLimit(LIMITS.MAX_INT);
      setIsPaid(true);
    }
  };

  const copyTableToClipboard = () => {
    const table = document.getElementById("resumeDisplay");
    if (!table) return;
  
    // Create a Range object and set its boundaries to encompass the entire table
    const range = document.createRange();
    range.selectNode(table);
  
    // Clear the current selection and add the new range
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  
    // Copy the selection to the clipboard
    try {
      document.execCommand('copy');
      alert('Table copied to clipboard. Paste it in Excel.');
    } catch (err) {
      alert('Unable to copy table to clipboard');
    }
  
    // Clear the selection
    if (selection) {
      selection.removeAllRanges();
    }
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
            // first 30 lines are always important, keep them
            if (i < 30) {
              filteredLines.push(line);
              continue;
            }                    
            if (!BULLET_POINTS.some(bullet => line[0].includes(bullet)) && 
                !(previousLineContainsBullet && lineStartsWithLowercase) && (textWidth < LIMITS.PIXEL_WIDTH_LIMIT || itemCounts > 1)) {
              filteredLines.push(line);
            }
            previousLineContainsBullet = BULLET_POINTS.some(bullet => line[0].includes(bullet));
          }
          const concatenatedString = filteredLines.join('\n');

          // if too many lines, too rules directly
          const processLines = async (lines: string, lineCount: number) => {
            console.time(`callGptTime for ${lineCount} lines`);
            const resumeAi = await postGptJsonReq(lines);
            console.timeEnd(`callGptTime for ${lineCount} lines`);
            handleUpdateResumes(resumeAi.profile.name === DUMMY_RESUME.profile.name ? resumeRule : resumeAi);
          }
          
          if (lines.length < LIMITS.UNCUT_LINE_LIMIT) {
            await processLines(lines.map(line => line.map(item => item.text).join(' ')).join('\n'), lines.length);
          } else if (filteredLines.length < LIMITS.LINE_LIMIT) {
            await processLines(concatenatedString, filteredLines.length);
          } else {
            handleUpdateResumes(resumeRule);
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
              Resume AI Parser
            </Heading>
            <Paragraph>
              - Not just another resume parser. Get AI-powered insights on your candidates. Save 99% time on resume screening. <br />
              - Try it now! <span className="font-semibold">Upload .pdf resumes in batch </span>for processing, aggregation, analysis and Excel download, with 99% accuracy. <br />
              - For candaiates/job seekers, head to <Link href="/resume-diagnosis">Resume Diagnosis</Link> to get instant feedbacks on your resume.
            </Paragraph>
            
            <div className="mt-3">
              <ResumeDropzone
                onFileUrlChange={(fileUrl) =>
                   setFileUrl(fileUrl || defaultFileUrl)
                }
                playgroundView={true}
              />
            </div>

            <ul className="mt-2 text-base list-disc list-inside pl-5">
              <li>The first 3 resumes are processed for free.</li>
              <li>For any additional resumes beyond the first 3, there's a charge of $0.1 USD per resume, with a minimum total charge of $1 USD.</li>
              <li>No need to signup or subscribe. You only pay for what you use. Preview first, pay later</li>
              <li>Grab your coupon for free parsing now! Limited availability. Contact us at <a href="mailto:hr.copilot.beta@gmail.com">hr.copilot.beta@gmail.com</a> today!</li>
            </ul>

            {fileUrl !== '' && <Heading level={2} className="text-primary !mt-4">
              Resume Parsing Results
            </Heading>}
            {fileUrl !== '' && <p className="text-gray-500 mt-4 text-small">
              AI-powered engine takes time to comprehend your resumes. Please stay on this page until the parsing is finished.
              </p>}
            {fileUrl !== '' && <ProgressBar duration={progressBarDuration * LIMITS.DEFAULT_WAITTIME} isFinished={isParsingFinished} />}

            {fileUrl !== '' && <div id="resumeDisplay">
              <ResumeDisplay resumes={resumes} limit={displayLimit} />
            </div>}
            {(isPaid || (resumes.length <= displayLimit && resumes.length > 0)) && <div>
              <button 
                id="exportButton" 
                className="bg-slate-900 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded mt-4"
                onClick={copyTableToClipboard}>Copy Table</button>
            </div>}   
            {resumes.length > displayLimit && 
            <p className="text-gray-500 mt-2 text-xs font-semibold">
              First {LIMITS.DEFAULT_DISPLAY_LIMIT} resumes are shown above for your preview. To get all the data, choose one of the 2 options: 
            </p>}

            {resumes.length > displayLimit && 
            <p className="text-gray-500 mt-2 text-xs font-semibold">
              - Enter you bank details and pay {Math.max(resumes.length * 0.1 - 0.3, 1)} USD to download all parsed {resumes.length} resumes. OR
            </p>}

            {resumes.length > displayLimit && 
            <p className="text-gray-500 mt-2 text-xs font-semibold">
              - If you have been given a coupon, please enter your coupon code
            </p>}

            {resumes.length > displayLimit && 
            <div id="checkoutButton">
              <Elements stripe={stripePromise}>
                <CheckoutForm amount={Math.max(resumes.length * 0.1 - 0.3, 1)} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure}/>
              </Elements>
            </div>
            }

            {resumes.length > displayLimit && 
            <div id="voucherInput" className="flex items-center mt-2">
                <input 
                  type="text" 
                  value={voucherCode} 
                  onChange={(e) => setVoucherCode(e.target.value)} 
                  placeholder="🎟️ has coupon?"
                  className="py-2 px-10 text-left"
                />
                <button 
                  onClick={handleVoucherSubmit} 
                  className="bg-slate-900 hover:bg-slate-600 text-white h-full py-2 px-4 rounded ml-4"
                >
                  Redeem Coupon
                </button>
            </div>
          } 
            {isPaymentFailed && <p className="text-red-500 mt-2 text-xs">Payment failed! Please check you credit card credentials</p>}
            <FootNote />
          </section>
        </div>
      </div>
    </main>
  );
}
