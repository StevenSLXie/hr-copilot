import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import {franc} from 'franc'
import { ENG_PROMPT, CMN_PROMPT } from '../../constants';
 
const openai = new OpenAI();
// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';
 
export default async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const {resumeText}  = await req.json();
  const prompt = franc(JSON.stringify(resumeText)) === 'cmn' ? CMN_PROMPT : ENG_PROMPT;

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