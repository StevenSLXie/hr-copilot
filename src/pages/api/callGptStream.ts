import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
 
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI();
 
// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

const guidelines = "1. Summary: the summary should be one sentence, highlighting the candiate's biggest strength;" + 
              "2. Weakness: highlight 2-3 points that the candidate is not strong about and how can the resume be polished to hide them. give concise example;" + 
              "3. Stength: highlight 2-3 points that the candidate is strong about and how can the resume be polished to highlight them. give concise example; " +
              "4. Verdict: overall, is the resume good or bad on a scale of 1-10? and simple reasoning why; " + 
              "5. Questions: list 3 questions you would ask if you are the hiring manager in order to deep dive into the candaiate's weakness. Must be specific;" +
              "the return should be in the format of summary: text; weakness: text; strength: text; verdict: text; questions: text; the index and the dot must be included";
 
export default async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { prompt } = await req.json();
 
  // Ask OpenAI for a streaming completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    stream: true,
    messages: [
      {
        "role": "system", 
        "content": "Evaluate the following resume in terms of the following: " + guidelines
      },
      {
        "role": "user", 
        "content": JSON.stringify(prompt)
      }
    ],
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}