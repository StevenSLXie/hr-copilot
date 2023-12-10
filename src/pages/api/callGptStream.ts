import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
 
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI();
 
// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

const guidelines = 
              "1. Verdict: overall competence of the resume on a scale of 100? must have reasoning, must tell the scale; " + 
              "2. Summary: the summary should be one sentence, highlighting the candiate's biggest strength, selling point;" + 
              "3. Weakness: highlight 3-4 points that the candidate is not strong about and how can the resume be polished to hide them. give concise examples, be critical;" + 
              "4. Stength: highlight 3-4 points that the candidate is strong about and how can the resume be polished to highlight them. give concise examples; " +
              "5. Questions: list 3 questions you would ask if you are the hiring manager in order to deep dive into the candaiate's weakness. Must be specific. each question one line;" +
              "6. Salary: based on the resume, guess the salary range of the candidate given his location. Propose the future salary range if the candidate is hired." + 
              "the return should be in the format of verdict: text; summary: text; weakness: text; strength: text; questions: text; salary: text; the index and the dot must be included";
 
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