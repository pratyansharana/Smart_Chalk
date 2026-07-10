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

async function fetchFromGroqVision(systemPrompt, userPromptText, imageUrl) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key not found in environment variables.');
  }

  const contentArray = [
    { type: 'text', text: userPromptText }
  ];

  if (imageUrl) {
    contentArray.push({
      type: 'image_url',
      image_url: {
        url: imageUrl
      }
    });
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
      temperature: 0.2,
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
  const systemPrompt = `You are an expert tutor. Create a formal test paper based on the requested topic, grade, and level.
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
  const systemPrompt = `You are an expert tutor. Create a multiple choice question (MCQ) quiz based on the requested topic, grade, and level.
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

/**
 * Grades a student's test submission based on test details, student answer text, and optional solution image.
 */
export async function gradeSubmissionWithAI({ testTitle, testQuestions, maxScore, studentAnswers, imageUrl }) {
  const systemPrompt = `You are an expert tutor. Grade the student's answers based on the test questions, guidelines, and max score.
Evaluate each answer logically, calculate a total score, and write highly constructive, encouraging, and detailed feedback.
If an image is attached, look at the image contents (the handwritten student paper or notebook page) to see the student's work, steps, and final answers, and grade accordingly.
Return a JSON object in this EXACT format:
{
  "score": 85, // Suggested numerical score out of the maximum score, MUST be a number, less than or equal to the maximum score.
  "feedback": "Step-by-step breakdown of what was correct, what was incorrect, and suggestions for improvement based on the student's text/image solution."
}`;

  const userPrompt = `Test Title: ${testTitle}
Maximum Score: ${maxScore}
Test Questions (Markdown):
${testQuestions}

Student's Written Answers Text:
${studentAnswers || 'No text answers provided.'}`;

  return fetchFromGroqVision(systemPrompt, userPrompt, imageUrl);
}
