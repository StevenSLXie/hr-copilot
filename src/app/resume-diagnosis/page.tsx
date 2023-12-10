"use client";
import { useState, useEffect } from "react";
import { readPdf, readDocx } from "lib/parse-resume-from-pdf/read-file";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Link, Paragraph } from "components/documentation";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import type { Resume as ResumeType } from "lib/redux/types";
import { LIMITS, DUMMY_RESUME, VOUCHERS } from '../../constants';
import CheckoutForm from "resume-parser/CheckoutForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

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
  const [outputText, setOutputText] = useState('');

  async function callStream(text: string) {
    // Fetch the data from the serverless function
  fetch('/api/callGptStream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: 'evaluate the following resume in terms of at least 10 aspects' + text })
  })
  .then(response => {
    // Read the response as a stream
    const reader = response.body?.getReader();

    // Read the next chunk of data
    function readNextChunk(): Promise<void> {
      return (reader as ReadableStreamDefaultReader).read().then(({ done, value }) => {
        if (done) {
          // The stream has ended
          return;
        }
        // Convert the chunk to a string
        const text = new TextDecoder().decode(value);
        setOutputText(prevText => prevText + text);
        // Display the text
        console.log(text);
        // Read the next chunk
        return readNextChunk();
      });
    }
    // Start reading the stream
    return readNextChunk();
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

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

  useEffect(() => {
    async function test() {
      if (fileUrl === '') {
        setResumes([]);
      }

      setIsParsingFinished(false);
      setProgressBarDuration(fileUrl ? fileUrl.split(';;;').length - 1 : 0);
      const fileUrls = fileUrl.split(';;;');
      const filesToProcess = fileUrls.length > 1 ? 1 : fileUrls.length - 1;
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
          await callStream(lines.map(line => line.map(item => item.text).join(' ')).join('\n'))
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
              Resume AI Checker
            </Heading>
            <Paragraph>
              Submitted over 500 resumes with no responses? Get your resume analyzed today for a better chance at catching employers' attention! <br />
              Powered by AI engines, this checker analyzes your resume in terms of your strengths, weaknesses, and questions you may be asked during an interview. <br />
              Try it now! Upload your pdf resumes. No signup, no subscription. Preview first, pay only when you're satisfied.
            </Paragraph>
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
            
            {
              outputText.split(/(summary:|strength:|weakness:|verdict:|questions:)/i).map((part, index) => (
                <p key={index} className="text-gray-500 mt-2 text-md font-semibold ml-3 mr-3">
                  {part}
                </p>
              ))
            }

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
                  className="bg-blue-400 hover:bg-blue-600 text-white h-full py-2 px-4 rounded ml-4"
                >
                  Redeem Coupon
                </button>
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
