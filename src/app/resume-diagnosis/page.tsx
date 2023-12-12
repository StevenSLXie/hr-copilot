"use client";
import { useState, useEffect } from "react";
import { readPdf, readDocx } from "lib/parse-resume-from-pdf/read-file";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Link, Paragraph } from "components/documentation";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { LIMITS, DUMMY_RESUME, VOUCHERS } from '../../constants';
import CheckoutForm from "resume-parser/CheckoutForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React from "react";

const defaultFileUrl = "";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ResumeAnalyzer() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [displayLimit, setDisplayLimit] = useState(LIMITS.DEFAULT_DISPLAY_LIMIT);
  const [isPaid, setIsPaid] = useState(false); 
  const [isPaymentFailed, setIsPaymentFailed] = useState(false); 
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

  const KEYWORDS = ["Summary:", "Strength:", "Weakness:", "Verdict:", "Questions:", "Salary:"];
  // const regex = new RegExp(`(${KEYWORDS.join('|')})`, 'i');
  const regex = new RegExp(`(${KEYWORDS.join('|')})`);

  useEffect(() => {
    async function test() {
      if (fileUrl === '') {
        setOutputText('');
      }

      const fileUrls = fileUrl.split(';;;');
      const filesToProcess = fileUrls.length > 1 ? 1 : fileUrls.length - 1;
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
              Resume Copilot
            </Heading>
            <Paragraph>
              - Struggling with job applications? Get instant feedbacks on your resume! <br />
              - Uncover your strengths, weaknesses, salary expectations, and potential interview questions. <br />
              - Upload your PDF resume now. No signup, no subscription. Preview for free, pay only when satisfied.
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
              Analysis Report
            </Heading>}
            
          
            {
              (isPaid ? outputText : outputText.split(/\s+/).slice(0, LIMITS.ANALYZER_PREVIEW_LIMIT).join(' '))
                .split(regex)
                .map((part, index) => {
                  const isKeyword = KEYWORDS.includes(part);
                  return (
                    <React.Fragment key={index}>
                    <p className="text-gray-500 mt-2 text-md font-mono ml-3 mr-3">
                      {isKeyword ? <strong>{part}</strong> : part }
                    </p>
                    {!isKeyword && fileUrl != '' && <hr className="border-gray-500 mt-4" />}
                    </React.Fragment>
                  );
                })
            }

            {outputText.length > 0 && !isPaid && <Paragraph>
              The above is the preview of the reports. The full report has {outputText.split(/\s+/).length} words and consist of 6 parts: verdict, summary, weakness, strength, simulated questions and salary information. 
              It helps you polish your resumes and generate questions that you will likely get asked by an interviewer. Pay just 1.99 USD to get the full report - that's less than the price of a StarBucks Americano!
            </Paragraph> }

            {outputText.length > 0 && <hr className="border-gray-500 mt-4" />}

            {outputText.length > 0 && 
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              - Enter your card details and pay 1.99 USD to get the full report.
            </p>}

            {/* {outputText.length > 0 && 
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              - If you have been given a coupon, please enter your coupon code
            </p>} */}

            {outputText.length > 0 && 
            <div id="checkoutButton">
              <Elements stripe={stripePromise}>
                <CheckoutForm amount={1.99} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure}/>
              </Elements>
            </div>
            }

            {/* {outputText.length > 0 && 
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
            } */}

            {isPaymentFailed && <p className="text-red-500 mt-2 text-xs">Payment failed! Please check you credit card credentials</p>}

            <hr className="border-gray-500 mt-4" />
            <p className="text-black-500 mt-2 text-xs">
              - <span className="font-semibold"> If you encounter any payment issue, please write to <a href="mailto:hr.copilot.beta@gmail.com">hr.copilot.beta@gmail.com</a>. </span>
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
