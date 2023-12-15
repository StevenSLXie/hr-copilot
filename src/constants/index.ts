import type { Resume } from "lib/redux/types";

export const LIMITS = {
  NUM_RESUMES: 100,
  GPT_TIMEOUT: 60, // a timer inside callGpt, not the maxDuration
  UNCUT_LINE_LIMIT: 100,
  LINE_LIMIT: 300,
  PIXEL_WIDTH_LIMIT: 400,
  DEFAULT_WAITTIME: 40000,
  DEFAULT_DISPLAY_LIMIT: 3,
  MAX_INT: 1000000,
  ANALYZER_PREVIEW_LIMIT: 0.3,
  QUESTIONS_PREVIEW_LIMIT: 3,
};

export const PRICES = {
  QUESTIONS: 2.99,
  ANALYZER : 1.99,
}

export const VOUCHERS = [
  'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
  'Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2',
  'G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8',
  'W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4',
  'M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0'
];

export const ENG_ANALYZER_PROMPT = "Evaluate the following resume in terms of the following." + 
"1. Verdict: overall competence of the resume on a scale of 1-100? must have reasoning, in the format of xx/100" + 
"2. Summary: the summary should be one sentence, highlighting the candidate's biggest strength, selling point;" + 
"3. Weakness: highlight 6-8 points that the candidate is not strong about and how can the resume be polished to hide them. give examples, be specific and critical and detailed;" + 
"4. Stength: highlight 2-3 points that the candidate is strong about and how can the resume be polished to highlight them. give concise examples; " +
"5. Questions: list 3 questions you would ask if you are the hiring manager in order to deep dive into the candaiate's weakness. Must be specific. each question one line;" +
"6. Salary: based on the resume, guess the salary range of the candidate given his location. Propose the future salary range if the candidate is hired." + 
"the return should be in the format of Verdict: text; Summary: text; Weakness: text; Strength: text; Questions: text; Salary: text; the index and the dot must be included. The overall response should be around 500 words";

export const CMN_ANALYZER_PROMPT = "请评估以下简历。" +
"1. 整体评价：简历的整体能力评分为1-100分？必须有理由，格式为xx/100" +
"2. 总结：总结应该是一句话，突出候选人的最大优势，卖点；" +
"3. 缺点：指出候选人简历中的薄弱环节，至少6-8点，以及如何打磨简历以回避这些点。给出例子,必须尖锐和详细；" +
"4. 优点：强调候选人擅长的2-3点，以及如何打磨简历以突出它们。给出简明的例子；" +
"5. 面试问题：如果您是招聘经理，列出最重要的3个问题，以便深入了解候选人的弱点和具体的项目经验。必须具体。每个问题1-2行；" +
"6. 预估薪水：根据简历，猜测候选人的薪水范围，分中国大陆一线城市和二线城市分别讨论。以及如果移民北美，可以期待的薪资，分硅谷和其他地方分别讨论。注意：中国大陆薪资低于北美" +
"返回值的格式应如下：整体评价：内容；总结：内容；缺点：内容；优点：内容；面试问题：内容；预估薪水：内容；按顺序输出。整体在800字左右";

export const ENG_QUESTION_PROMPT = "You are a hiring manager interviewing an candaiate based on the following resume profile." +
"Based on candaiate's resume, ask 12 questions to deep dive into the candidate's experience, competency, weakness and suitability." +
"Questions must be specific, more on candidate's past project experience. 2-3 of them can also be behavior questions. For tech roles, questions should be around candidate's specific skillsets such as programming languages" + 
"For each question, an answer needs to be provided to help candidate address the question holistically and comprehensively." +
"the return should be in the format of Q: text; A: text; Each Q&A should be around 100 words. There must be 12 questions no matter what.";

export const CMN_QUESTION_PROMPT = "您是一名招聘经理，根据以下候选人简历，对候选人进行面试。" +
"根据候选人的简历，提出12个问题，以深入了解候选人的经验，能力，缺点和是否胜任相关岗位。" +
"问题必须具体，更多地关注候选人的过去项目经验。其中2-3个问题也可以是行为、性格方面的考察问题。对于技术角色，问题应围绕候选人的具体技能，例如编程语言" +
"对于每个问题，都需要提供一个答案，以帮助候选人准备面试。" +
"返回值的格式应如下 Q: text; A: text; 每个问题的答案应在100字左右。必须有12个问题。用中文问答";

export const DUMMY_RESUME: Resume = {
  profile: {
    name: "DummyDummy",
    email: "",
    phone: "",
    url: "",
    summary: "",
    location: ""
  },
  workExperiences: [],
  educations: [],
  projects: [],
  skills: {
    featuredSkills: [],
    descriptions: []
  },
  custom: {
    descriptions: []
  },
  insights: {
    careerHighlights: [],
    strengths: [],
    weaknesses: [],
    growthPotential: []
  }
};

