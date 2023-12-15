import React from 'react';

export const  FootNote = () => (
  <>
    <hr className="border-gray-500 mt-4" />
    <p className="text-black-500 mt-2 text-xs">
      - <span className="font-semibold"> If you encounter any payment issue, please write to <a href="mailto:hr.copilot.beta@gmail.com">hr.copilot.beta@gmail.com</a>. </span>
    </p>    
    <p className="text-gray-500 mt-2 text-xs">
      - Recruitment Copilot respects your privacy and never retains your data. At the same time, please note that part of the information in resumes is processed via the OpenAI API. OpenAI has their own data usage policies. For more details, please refer to OpenAI's <a href="https://openai.com/policies" target="_blank" rel="noopener noreferrer">data usage policy</a>.
    </p>      
    <p className="text-gray-500 mt-2 text-xs">
      - Recruitment Copilot provides information for reference only and is not responsible for any misunderstandings or misinterpretations. Use this service at your own discretion.
    </p> 
    <p className="text-gray-500 mt-2 text-xs">
      - Recruitment Copilot makes use of components in <a href="https://github.com/xitanggg/open-resume" target="_blank" rel="noopener noreferrer">Open Resume</a> and make substantial modifications. 
    </p>  
  </>
);
