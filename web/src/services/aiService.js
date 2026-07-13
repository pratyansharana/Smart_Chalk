const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-8b',
  'gemini-2.5-pro'
];

async function callGeminiApi(modelName, systemPrompt, userPrompt, partsOverride = null, temp = 0.7) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key not found in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const parts = partsOverride || [{ text: userPrompt }];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemPrompt }
        ]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: temp,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const errorObj = {
      status: response.status,
      message: errText
    };
    throw errorObj;
  }

  const resData = await response.json();
  const content = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('No content returned from Gemini API.');
  }

  return JSON.parse(content);
}

async function fetchWithFallback(systemPrompt, userPrompt, partsOverride = null, temp = 0.7) {
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini Request] Attempting call with model: ${model}`);
      const result = await callGeminiApi(model, systemPrompt, userPrompt, partsOverride, temp);
      return result;
    } catch (err) {
      console.warn(`[Gemini Warning] Model ${model} failed (Status: ${err.status || 'unknown'}):`, err);
      lastError = err;
      // Continue to next model on transient errors (503 Service Unavailable, 429 Rate Limit, etc.)
      continue;
    }
  }
  const errorObj = new Error(lastError?.message || 'All Gemini models failed');
  errorObj.status = lastError?.status;
  throw errorObj;
}

async function callGroqTextApi(systemPrompt, userPrompt, temp = 0.7) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temp,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Text API Error: ${response.status} - ${errText}`);
  }

  const resData = await response.json();
  const content = resData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from Groq API.');
  }
  return JSON.parse(content);
}

async function callGroqVisionApi(systemPrompt, userPromptText, imageUrls, temp = 0.1) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const contentArray = [
    { type: 'text', text: userPromptText }
  ];

  if (imageUrls) {
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    urls.forEach((url) => {
      if (url) {
        contentArray.push({
          type: 'image_url',
          image_url: { url }
        });
      }
    });
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentArray }
      ],
      temperature: temp,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Vision API Error: ${response.status} - ${errText}`);
  }

  const resData = await response.json();
  const content = resData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from Groq Vision API.');
  }
  return JSON.parse(content);
}

async function fetchFromGroq(systemPrompt, userPrompt) {
  try {
    return await fetchWithFallback(systemPrompt, userPrompt, null, 0.7);
  } catch (geminiErr) {
    console.warn('[AI Fallback] Gemini failed. Trying Groq...', geminiErr);
    try {
      return await callGroqTextApi(systemPrompt, userPrompt, 0.7);
    } catch (groqErr) {
      console.error('[AI Fallback] Both Gemini and Groq failed:', groqErr);
      throw new Error(`AI Service Unavailable. Gemini status: ${geminiErr.status}. Groq error: ${groqErr.message}`);
    }
  }
}

async function urlToBase64Part(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const blob = await res.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            mimeType: blob.type || 'image/jpeg',
            data: base64data
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to convert image URL to base64:', url, err);
    return null;
  }
}

async function fetchFromGroqVision(systemPrompt, userPromptText, imageUrls) {
  try {
    const parts = [
      { text: userPromptText }
    ];

    if (imageUrls) {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      for (const url of urls) {
        if (url) {
          const imagePart = await urlToBase64Part(url);
          if (imagePart) {
            parts.push(imagePart);
          }
        }
      }
    }

    return await fetchWithFallback(systemPrompt, userPromptText, parts, 0.1);
  } catch (geminiErr) {
    console.warn('[AI Fallback] Gemini vision failed. Trying Groq vision...', geminiErr);
    try {
      return await callGroqVisionApi(systemPrompt, userPromptText, imageUrls, 0.1);
    } catch (groqErr) {
      console.error('[AI Fallback] Both Gemini vision and Groq vision failed:', groqErr);
      throw new Error(`AI Vision Service Unavailable. Gemini status: ${geminiErr.status}. Groq error: ${groqErr.message}`);
    }
  }
}

/**
 * Generates an AI test based on grade, topic, difficulty level, and optional custom instructions.
 */
export async function generateAITest({ grade, topic, level, instructions }) {
  const systemPrompt = `You are an elite academic tutor. Your task is to create a formal test paper that is perfectly aligned with the requested grade level, topic, and difficulty level.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced (e.g. college or high school math for elementary students) or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.
4. CUSTOM INSTRUCTIONS: Incorporate these instructions strictly: "${instructions || 'None'}".

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

MARKDOWN FORMATTING RULES:
- Use "# [Section Title]" for main headers.
- Use "## [Sub-Header]" for sub-sections.
- Questions must start with a number followed by a period (e.g., "1. Solve the following...").

Return a JSON object in this EXACT format:
{
  "title": "Test Title (incorporating topic and grade)",
  "description": "Short description of the test guidelines and duration",
  "maxScore": 100,
  "testContent": "Detailed question paper in markdown format. Do not include answers."
}`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}
Additional Instructions: ${instructions || 'None'}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}

/**
 * Generates an AI MCQ quiz based on grade, topic, difficulty level, and number of questions.
 */
export async function generateAIQuiz({ grade, topic, level, count = 5 }) {
  const systemPrompt = `You are an elite academic tutor. Create a multiple choice question (MCQ) quiz based on the requested topic, grade, and level.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced (e.g. college or high school math for elementary students) or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

Return a JSON object in this EXACT format:
{
  "title": "Quiz Title (incorporating topic and grade)",
  "questions": [
    {
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0
    }
  ]
}
Note: "correctOptionIndex" must be a 0-indexed integer (0 for option 1, 1 for option 2, etc.) matching the correct option. Produce exactly ${count} questions.`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}

export async function gradeSubmissionWithAI({ testTitle, testQuestions, maxScore, studentAnswers, imageUrls, imageUrl, studentName }) {
  const systemPrompt = `You are an elite academic tutor. Your task is to grade the student's submission with extreme precision, accuracy, and fairness.

GRADING RUBRIC & STRATEGY:
1. STEP-BY-STEP EVALUATION:
   - For each question in the test paper, analyze the correct answer/method.
   - Look at the student's written text answers AND scan all attached submission images carefully to check their work, derivations, formulas, and final answers.
   - Do not guess or assume. Grade strictly based on visible correct work.
2. STRICT SCORE CALCULATION:
   - Assign partial points for correct steps and full points for correct final solutions.
   - Sum the individual question scores to calculate the final total score.
   - The final total score MUST be a number, and it MUST be less than or equal to the maximum score (${maxScore}).
3. NO HALLUCINATIONS:
   - If a student's answer is mathematically incorrect, do not give full marks. Deduct points appropriately and point out the exact error.
   - If the student's answer is blank or missing, assign 0 points for that question.

CRITICAL FORMATTING RULES FOR FEEDBACK:
- The feedback MUST be written in the first person as a warm, direct conversation from you (the teacher) to the student.
- Address the student by name, starting with "Hi ${studentName || 'Student'}," or "Hello ${studentName || 'Student'},".
- Speak directly to them: use "your work", "you solved", "I recommend", etc.
- You MUST provide a **Question-wise Score Breakdown** at the very beginning of the feedback. Format it like this:
  📋 **Marks Breakdown:**
  • **Question 1**: X/Y marks — [Reason for full marks OR explanation of deductions]
  • **Question 2**: X/Y marks — [Reason for full marks OR explanation of deductions]
  (Make sure the sum of all question marks matches the final total score returned).
- Following the breakdown, write a brief encouraging summary and 2 to 4 crisp, actionable bullet points detailing:
  • Specific strengths (what they did well).
  • Precise corrections/recommendations for next time.

Return a JSON object in this EXACT format:
{
  "score": 85, // Calculated total numerical score (out of ${maxScore}), must be a number.
  "feedback": "Hello ${studentName || 'Student'},\n\n📋 **Marks Breakdown:**\n• **Question 1**: X/Y marks — [Reason]\n• **Question 2**: X/Y marks — [Reason]\n\n[Brief encouraging summary]\n• [Point-wise strength]\n• [Point-wise recommendation]"
}`;

  const userPrompt = `Test Title: ${testTitle}
Maximum Score: ${maxScore}
Student's Name: ${studentName || 'Student'}
Test Questions (Markdown):
${testQuestions}

Student's Written Answers Text:
${studentAnswers || 'No text answers provided.'}`;

  const urls = imageUrls || (imageUrl ? [imageUrl] : []);
  return fetchFromGroqVision(systemPrompt, userPrompt, urls);
}

/**
 * Generates an AI assignment based on grade, topic, difficulty level, and optional custom instructions.
 */
export async function generateAIAssignment({ grade, topic, level, instructions }) {
  const systemPrompt = `You are an elite academic tutor. Create a formal assignment paper based on the requested topic, grade, and level.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced (e.g. college or high school math for elementary students) or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

MARKDOWN FORMATTING RULES:
- Use "# [Section Title]" for main headers.
- Use "## [Sub-Header]" for sub-sections.
- Questions must start with a number followed by a period (e.g., "1. Solve the following...").

Return a JSON object in this EXACT format:
{
  "title": "Assignment Title (incorporating topic and grade)",
  "description": "Short description of the assignment guidelines and goals",
  "maxScore": 100,
  "assignmentContent": "Detailed assignment instructions and problems in markdown format. Do not include answers."
}`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}
Additional Instructions: ${instructions || 'None'}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}

/**
 * Generates an AI worksheet for student self-study.
 */
export async function generateAIWorksheet({ grade, topic, level, count = 5 }) {
  const systemPrompt = `You are an elite academic tutor. Create a personalized practice worksheet based on the requested topic, grade, and difficulty level.
The worksheet must contain exactly ${count} practice questions.

STRICT TOPIC & SYLLABUS ALIGNMENT DIRECTIVE:
1. STRICT TOPIC ADHERENCE: Focus exclusively on the requested topic: "${topic}". Do not introduce questions, terms, or mathematical concepts from unrelated topics. Keep every single question directly relevant to the topic.
2. GRADE-LEVEL COMPLIANCE: Target the educational complexity level of Grade: "${grade}". Avoid questions that are too advanced or too simple.
3. DIFFICULTY SPECIFICATION: Calibrate questions according to the difficulty: "${level}".
   - Easy: Direct questions, basic recall, simple exercises.
   - Medium: Conceptual application, standard multi-step problems.
   - Hard: Advanced problem solving, complex calculations, deep reasoning.

LaTeX MATH FORMATTING RULES:
1. Wrap all mathematical equations, variables, symbols, and expressions inside standard delimiters:
   - Use "$" for inline equations (e.g., "$a^2 + b^2 = c^2$").
   - Use "$$" for display/block equations (e.g., "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$").
2. CRITICAL: Never split a single math formula or its "$" delimiters across multiple newlines/line breaks. A formula and its delimiters must reside entirely on a single line.
3. CRITICAL: You MUST double-escape all backslashes inside JSON strings. Write "\\frac" instead of "\frac", "\\cdot" instead of "\cdot", "\\times" instead of "\times", etc.

MARKDOWN FORMATTING RULES:
- Use "# [Section Title]" for main headers.
- Use "## [Sub-Header]" for sub-sections.
- Questions must start with a number followed by a period (e.g., "1. Solve the following...").

Return a JSON object in this EXACT format:
{
  "title": "Practice Worksheet: Topic Name",
  "description": "Short description of the worksheet topics covered",
  "questionsContent": "Detailed practice questions in markdown format. Do not include answers."
}`;

  const userPrompt = `Grade: ${grade}
Topic: ${topic}
Difficulty Level: ${level}`;

  return fetchFromGroq(systemPrompt, userPrompt);
}


