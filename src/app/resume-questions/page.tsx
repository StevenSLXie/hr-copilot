"use client";
import { useState, useEffect } from "react";
import { readPdf, readDocx } from "lib/parse-resume-from-pdf/read-file";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { ResumeDropzone } from "components/ResumeDropzone";
import { Heading, Paragraph } from "components/documentation";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { LIMITS, VOUCHERS, PRICES } from '../../constants';
import CheckoutForm from "resume-parser/CheckoutForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FootNote } from "components/FootNote";
import React from "react";
import {franc} from 'franc'
import { postGptStreamReq } from "../../pages/api/postGptStreamReq";

const defaultFileUrl = "";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ResumeQuestions() {
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

  const KEYWORDS = ["Q: ","A: ","Guideline:"];
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
            textItems = await readPdf(fileUrl);
          } else if (fileExtension === 'docx') {
            textItems = await readDocx(fileUrl.split('.')[0]);
          } else {
            throw new Error(`Unsupported file extension: ${fileExtension}`);
          }
          const lines = groupTextItemsIntoLines(textItems || []);
          const reqLines = lines.map(line => line.map(item => item.text).join(' ')).join('\n');
          setLanguage(franc(reqLines));
          await postGptStreamReq(reqLines, setOutputText, 'questions');
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
              Get Personalized Interview Q&A
            </Heading>
            <Paragraph>
              - Upload your pdf resumes and get personalized interview Q&A instantly <br />
              - No signup, no subscription. Preview for free, pay only when satisfied.
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
              Mock-up Q&A 
            </Heading>}
            
            {
            (isPaid ? outputText : outputText.split('A:').slice(0, LIMITS.QUESTIONS_PREVIEW_LIMIT).join('A:'))
                .split(regex)
                .map((part, index) => {
                const isKeyword = KEYWORDS.includes(part);
                return (
                    <React.Fragment key={index}>
                    {part == 'Q: ' && fileUrl != '' && <hr className="border-gray-500 mt-4" />}
                    <p className="text-gray-500 mt-2 text-md font-mono ml-3 mr-3">
                        {isKeyword ? <strong>{part}</strong> : part }
                    </p>
                    </React.Fragment>
                );
                })
            }

            {outputText.length > 0 && outputText.split("A:").length > 4 && !isPaid && <Paragraph>
              The above is the preview of the Q&A. The report consist of {outputText.split("A:").length - 1} Q&A and get you fully prepared for your interview. <br></br> 
              Pay just {PRICES.QUESTIONS} USD to unlock the full Q&A set - that's less than the price of a StarBucks Americano!
            </Paragraph> }

            {outputText.length > 0 && <hr className="border-gray-500 mt-4" />}

            {outputText.length > 0 && outputText.split("A:").length > 4 && 
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              - Enter your card details and pay {PRICES.QUESTIONS} USD to get the full report.
            </p>}

            {/* {outputText.length > 0 && 
            <p className="text-gray-500 mt-2 text-sm font-semibold">
              - OR if you have been given a coupon, please enter your coupon code
            </p>} */}

            {outputText.length > 0 && outputText.split("A:").length > 4 && 
            <div id="checkoutButton">
              <Elements stripe={stripePromise}>
                <CheckoutForm amount={PRICES.QUESTIONS} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure}/>
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
            <FootNote />
          </section>
        </div>
      </div>
    
    </main>
  );
}
