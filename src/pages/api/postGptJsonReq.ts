import { Resume } from "lib/redux/types";
import { DUMMY_RESUME } from "../../constants";

export async function postGptJsonReq(text: string) {
    // Fetch the data from the serverless function
  
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
        const resume: Resume = JSON.parse(resumeContent);
        return resume;
        } catch (error){
        console.error('Error parsing resume:', error);
        return DUMMY_RESUME;
        }
    }
 }