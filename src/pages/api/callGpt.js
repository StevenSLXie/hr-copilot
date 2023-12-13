import OpenAI from "openai";

// export const maxDuration = 5;

// export const config = {
//   maxDuration: 5,
// };

const openai = new OpenAI();

const prompt = `{
  "profile": {
    "name": "",
    "email": "",
    "phone": "",
    "url": "",
    "summary": "",
    "location": ""
  },
  "workExperiences": [
    {
      "company": "",
      "jobTitle": "",
      "date": "",
      "descriptions": []
    }
  ],
  "educations": [
    {
      "school": "",
      "degree": "",
      "date": "",
      "gpa": "",
      "descriptions": []
    }
  ],
  "projects": [],
  "skills": {
    "featuredSkills": [],
    "descriptions": []
  },
  "custom": {
    "descriptions": []
  },
  "insights": {
    "careerHighlights": [],
    "strengths": [],
    "weaknesses": [],
    "growthPotential": [],
  }
}`;

export default async function handler(req, res) {
  try {
    const completionPromise = openai.chat.completions.create({
      messages: [
        {
          "role": "system", 
          "content": "The following text is extracted from a resume; parse them into the following format:" 
          + JSON.stringify(prompt) + ". You must return in the prescribed format. The other parts should just be extrated from the text. The insights should be summarized from the perspectives of an experienced HR, each with no more than 2 sentences. Be concise and critical. Analysis is better supported with numbers!"
        },
        {
          "role": "user", 
          "content": JSON.stringify(req.body.text)
        }
      ],
      model: "gpt-3.5-turbo-1106",
    });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 60000)
    );
    
    let completion;
    try {
      completion = await Promise.race([completionPromise, timeoutPromise]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Request timed out' });
      return;
    }
    // console.log(completion.choices[0])
    console.log('Successfully parsed resume via GPT');
    res.status(200).json({ text: completion.choices[0] });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}