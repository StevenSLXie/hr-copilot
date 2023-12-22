"use client";
import { useState, useEffect } from "react";
import { readPdf, readDocx } from "lib/parse-resume-from-pdf/read-file";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Link, Paragraph } from "components/documentation";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { LIMITS, PRICES, VOUCHERS } from '../../constants';
import CheckoutForm from "resume-parser/CheckoutForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React from "react";
import {franc} from 'franc'
import { FootNote } from "components/FootNote";
import { postGptStreamReq } from "../../pages/api/postGptStreamReq";
import { ShareButton } from "components/ShareButton";

const defaultFileUrl = "";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ResumeAnalyzer() {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [displayLimit, setDisplayLimit] = useState(LIMITS.DEFAULT_DISPLAY_LIMIT);
  const [isPaid, setIsPaid] = useState(false); 
  const [isPaymentFailed, setIsPaymentFailed] = useState(false); 
  const [voucherCode, setVoucherCode] = useState('');
  const [outputText, setOutputText] = useState('');
  const [language, setLanguage] = useState('und');

  function countWords(outputText: string, language: string): number {
    if (language === 'eng') {
      // English: count the number of spaces and add 1
      return outputText.split(' ').length;
    } else if (language === 'cmn') {
      // Chinese: count the number of characters
      return outputText.length;
    } else {
      // For other languages, return 0 or handle them appropriately
      return 0;
    }
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
      console.log(`Voucher code redeemed: ${voucherCode}`);
    }
  };

  const KEYWORDS = ["Summary:", "Strength:", "Weakness:", "Verdict:", "Questions:", "Salary:", "Self-introduction:",
                    "总结：", "优点：", "缺点：", "面试问题：", "预估薪水：", "整体评价："];
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
          const reqLines = lines.map(line => line.map(item => item.text).join(' ')).join('\n');
          setLanguage(franc(reqLines));
          await postGptStreamReq(reqLines, setOutputText, 'analyzer');
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
              🤔 Struggling with job applications? Get instant feedbacks on your resume! <br />
              💪 - Uncover your weaknesses and strengths; Explore strategies to enhance your resume. <br />
              📝 - The full report also includes a tailored self-introduction script, simulated interview questions and personalized salary estimation. <br />
              📤 - Upload your PDF resume now. No signup, no subscription. Preview for free, pay only when satisfied.
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
              (isPaid ? outputText : outputText.slice(0, Math.floor(outputText.length * LIMITS.ANALYZER_PREVIEW_LIMIT)))
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
              The above is the preview of the reports. The full report has {countWords(outputText, language)} words and consist of 7 parts: verdict, summary, weakness, strength, self-introduction, simulated questions and salary information. 
              Pay just {PRICES.ANALYZER} USD to unlock the full report - that's less than the price of a StarBucks Americano!
            </Paragraph> }

            {outputText.length > 0 && <hr className="border-gray-500 mt-4" />}

            {outputText.length > 0 && 
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              - Enter your card details and pay {PRICES.ANALYZER} USD to get the full report.
            </p>}

            {outputText.length > 0 && 
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              - OR if you have been given a coupon, please enter your coupon code
            </p>}

            {outputText.length > 0 && 
            <div id="checkoutButton">
              <Elements stripe={stripePromise}>
                <CheckoutForm amount={PRICES.ANALYZER} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure}/>
              </Elements>
            </div>
            }

            {outputText.length > 0 && 
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
            

            <ShareButton />
            <FootNote />
          </section>
        </div>
      </div>
    </main>
  );
}
