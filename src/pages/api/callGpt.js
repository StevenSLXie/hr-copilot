import OpenAI from "openai";

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
  }
}`;

export default async function handler(req, res) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          "role": "system", 
          "content": "The following text is extracted from a resume; parse them into the following format:" + JSON.stringify(prompt)
        },
        {
          "role": "user", 
          "content": JSON.stringify(req.body.text)
        }
      ],
      model: "gpt-3.5-turbo",
    });
    // console.log('completion from server' + completion.choices[0].text);
    console.log(completion.choices[0])
    res.status(200).json({ text: completion.choices[0] });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred' });
  }
}