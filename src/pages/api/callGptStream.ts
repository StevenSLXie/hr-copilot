import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import {franc} from 'franc'
import { ENG_ANALYZER_PROMPT, CMN_ANALYZER_PROMPT, ENG_QUESTION_PROMPT } from '../../constants';
 
const openai = new OpenAI();
// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';
 
export default async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const {resumeText, type}  = await req.json();
  let prompt = "";
  if (type === 'questions') {
    prompt = ENG_QUESTION_PROMPT
  }else {
    prompt = franc(JSON.stringify(resumeText)) === 'cmn' ? CMN_ANALYZER_PROMPT : ENG_ANALYZER_PROMPT;
  }

  // Ask OpenAI for a streaming completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    stream: true,
    messages: [
      {
        "role": "system", 
        "content": prompt
      },
      {
        "role": "user", 
        "content": JSON.stringify(resumeText)
      }
    ],
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}