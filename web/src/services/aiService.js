const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function fetchFromGroq(systemPrompt, userPrompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errText}`);
  }

  const resData = await response.json();
  const content = resData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from Groq API.');
  }

  return JSON.parse(content);
}

async function fetchFromGroqVision(systemPrompt, userPromptText, imageUrls) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const contentArray = [
    { type: 'text', text: userPromptText }
  ];

  if (imageUrls) {
    if (Array.isArray(imageUrls)) {
      imageUrls.forEach((url) => {
        if (url) {
          contentArray.push({
            type: 'image_url',
            image_url: {
              url
            }
          });
        }
      });
    } else if (typeof imageUrls === 'string') {
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: imageUrls
        }
      });
    }
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentArray },
      ],
      temperature: 0.1, // Lower temperature for more deterministic, strictly factual grading
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errText}`);
  }

  const resData = await response.json();
  const content = resData.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from Groq API.');
  }

  return JSON.parse(content);
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
- Speak directly to them: use "your work", "you solved", "I recommend", etc. Do not write dry third-person evaluations.
- The feedback MUST be short, crisp, and point-wise (using simple bullet points) rather than long paragraphs.
- Provide a brief encouraging opening sentence, followed by 2 to 4 bullet points detailing:
  • Specific strengths (what they did well).
  • Precise errors and misconceptions (why they lost points).
  • Clear corrections/recommendations for next time.

Return a JSON object in this EXACT format:
{
  "score": 85, // Calculated total numerical score (out of ${maxScore}), must be a number.
  "feedback": "Hello ${studentName || 'Student'},\n\n[Encouraging sentence]\n• [Point-wise strength]\n• [Point-wise error/correction]\n• [Point-wise recommendation]"
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

